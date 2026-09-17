'use server';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { requireIdentity } from '@/lib/auth';
import { localeOf, isAdmin } from '@/lib/domain';
import { appUrl } from '@/lib/env';
import { authRateLimit } from '@/lib/rate-limit';
export type AccountState = { error?: string; success?: string };
export async function accountAction(kind: string, lang: string, _state: AccountState, form: FormData): Promise<AccountState> {
 const locale=localeOf(lang); const de=locale==='de';
 try {
  const identity=await requireIdentity(locale); const {db,user}=identity;
  await authRateLimit(`account:${kind}`);
  if(kind==='password' || kind==='email' || kind==='delete') {
   const password=z.string().min(1).max(128).parse(form.get('current_password'));
   const result=await db.auth.signInWithPassword({email:user.email!,password});
   if(result.error || result.data.user?.id!==user.id) return {error:de?'Das aktuelle Passwort ist nicht korrekt.':'Your current password is incorrect.'};
  }
  if(kind==='password') {
   const password=z.string().min(12).max(128).parse(form.get('password'));
   if(password!==form.get('confirm_password')) return {error:de?'Die neuen Passwörter stimmen nicht überein.':'The new passwords do not match.'};
   const {error}=await db.auth.updateUser({password}); if(error) throw error;
   const logout=await db.auth.signOut({scope:'others'}); if(logout.error) throw logout.error;
   return {success:de?'Passwort geändert. Andere Sitzungen wurden abgemeldet.':'Password changed. Other sessions were signed out.'};
  }
  if(kind==='email') {
   const email=z.email().max(254).parse(form.get('email')).toLowerCase();
   if(email===user.email?.toLowerCase()) return {error:de?'Bitte eine neue E-Mail-Adresse eingeben.':'Please enter a new email address.'};
   const {error}=await db.auth.updateUser({email},{emailRedirectTo:`${appUrl()}/${locale}/auth/callback`}); if(error) throw error;
   return {success:de?'Bitte bestätigen Sie die Änderung über die E-Mails von uns. Prüfen Sie Ihre bisherige und Ihre neue Adresse. Bis zur Bestätigung bleibt die bisherige Anmeldung gültig.':'Please confirm the change using our emails. Check both your current and new address. Your current login remains valid until confirmation.'};
  }
  if(kind==='profile') {
   const first=z.string().trim().min(1).max(100).parse(form.get('first_name'));
   const last=z.string().trim().min(1).max(100).parse(form.get('last_name'));
   const {error}=await db.rpc('update_profile',{first,last,lang:locale}); if(error) throw error;
  } else if(kind==='provider') {
   if(identity.profile.role!=='PROVIDER_USER') throw Error('FORBIDDEN');
   const input=z.object({company_name:z.string().trim().min(2).max(200),email:z.email().max(254),phone:z.string().max(50),address:z.string().max(500),website:z.union([z.literal(''),z.url().regex(/^https?:\/\//)]),solution:z.string().trim().min(1).max(5000),markets:z.string().max(2000)}).parse(Object.fromEntries(form));
   const {error}=await db.rpc('save_provider_account',{input}); if(error) throw error;
  } else if(kind==='delete') {
   if(isAdmin(identity.profile.role)) return {error:de?'Administratorkonten können hier nicht gelöscht werden.':'Administrator accounts cannot be deleted here.'};
   if(form.get('confirm_delete')!=='on' || form.get('delete_word')!=='DELETE') return {error:de?'Bitte die Löschung bestätigen und DELETE eingeben.':'Please confirm deletion and type DELETE.'};
   const finished=await db.functions.invoke('delete-account',{body:{confirm:true}});
   if(finished.error || finished.data?.deleted!==true) throw Error('DELETION_INCOMPLETE');
   // Auth user and refresh sessions are deleted by the transaction. Clear local cookies as well.
   const jar=await cookies();
   for(const cookie of jar.getAll()) if(cookie.name.startsWith('robotaxi-auth')) jar.delete(cookie.name);
   redirect(`/${locale}/account-deleted`);
  } else if(kind!=='profile') throw Error('INVALID_ACTION');
  revalidatePath(`/${locale}`,'layout');
  return {success:de?'Änderungen gespeichert.':'Changes saved.'};
 } catch(error) {
  unstable_rethrow(error);
  if(error instanceof z.ZodError) return {error:de?'Bitte alle Angaben prüfen. Das neue Passwort muss mindestens 12 Zeichen lang sein.':'Please check your entries. A new password must contain at least 12 characters.'};
  return {error:de?(kind==='delete'?'Die Löschung ist noch nicht vollständig abgeschlossen. Bitte erneut mit Ihrem Passwort versuchen oder uns kontaktieren.':'Die Änderung konnte nicht gespeichert werden. Bitte erneut versuchen.'):(kind==='delete'?'Deletion has not completed. Please retry with your password or contact us.':'Could not save the change. Please try again.')};
 }
}
