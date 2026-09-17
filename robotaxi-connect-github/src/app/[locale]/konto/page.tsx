import { requireIdentity } from '@/lib/auth';
import { localeOf,isAdmin } from '@/lib/domain';
import { PublicHeader,PublicFooter } from '@/components/public-layout';
import { AccountSettings } from '@/components/account-settings';
export const metadata={robots:{index:false,follow:false}};
export default async function Account({params}:{params:Promise<{locale:string}>}) {
 const locale=localeOf((await params).locale); const {user,profile}=await requireIdentity(locale);
 return <><PublicHeader locale={locale}/><main id="main" className="container audience-page"><h1>{locale==='de'?'Mein Konto':'My account'}</h1><AccountSettings locale={locale} profile={profile} email={user.email||''} pendingEmail={user.new_email} allowDelete={!isAdmin(profile.role)}/></main><PublicFooter locale={locale}/></>;
}
