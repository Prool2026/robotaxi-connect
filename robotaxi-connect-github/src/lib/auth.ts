import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { isAdmin, type Locale, type Profile } from '@/lib/domain';
export const getIdentity = cache(async () => {
  if (!isConfigured()) return null;
  const db = await supabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  const { data: profile } = await db
    .from('profiles')
    .select('id,first_name,last_name,locale,role,deactivated_at')
    .eq('id', user.id)
    .single();
  if (!profile || profile.deactivated_at) return null;
  return { user, profile: profile as Profile, db };
});
export async function requireIdentity(locale: Locale) {
  const identity = await getIdentity();
  if (!identity) redirect(`/${locale}/login`);
  return identity;
}
export async function requireAdmin(locale: Locale) {
  const identity = await requireIdentity(locale);
  if (!isAdmin(identity.profile.role)) redirect(`/${locale}/portal`);
  return identity;
}
export async function requireCompany(locale: Locale) {
  const identity = await requireIdentity(locale);
  if (isAdmin(identity.profile.role)) redirect(`/${locale}/admin`);
  if (identity.profile.role === 'PROVIDER_USER') redirect(`/${locale}/anbieter`);
  const { data: member } = await identity.db
    .from('company_members')
    .select('company_id')
    .eq('user_id', identity.user.id)
    .maybeSingle();
  if (!member) redirect(`/${locale}/register/company`);
  return { ...identity, companyId: member.company_id as string };
}
