import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { localeOf } from '@/lib/domain';
import { PublicHeader,PublicFooter } from '@/components/public-layout';
import { AccountForm } from '@/components/account-form';
import { AccountInput,AccountSettings } from '@/components/account-settings';
export const metadata={robots:{index:false,follow:false}};
export default async function Provider({params}:{params:Promise<{locale:string}>}) {
 const locale=localeOf((await params).locale); const de=locale==='de';
 const {db,user,profile}=await requireIdentity(locale);
 if(profile.role!=='PROVIDER_USER') redirect(`/${locale}/portal`);
 const {data,error}=await db.from('provider_accounts').select('*').eq('user_id',user.id).maybeSingle();
 if(error) throw new Error('PROVIDER_PROFILE_UNAVAILABLE');
 const p=data||{};
 return <><PublicHeader locale={locale}/><main id="main" className="container audience-page"><p className="eyebrow">{de?'IHR TECHNOLOGIEUNTERNEHMEN':'YOUR TECHNOLOGY COMPANY'}</p><h1>{de?'Ihr persönlicher Anbieterbereich':'Your provider account'}</h1><p>{de?'Hier verwalten Sie ausschließlich Ihr eigenes Firmenprofil und Konto. Wir bearbeiten Ihre Anfrage persönlich. Andere Unternehmen und das interne Netzwerk bleiben vertraulich.':'Manage only your own company profile and account here. We handle your enquiry personally. Other companies and our internal network remain private.'}</p><nav className="legal-contents"><a href="#provider-profile">{de?'Firmenprofil':'Company profile'}</a><a href="#provider-account">{de?'Konto, Passwort und Löschung':'Account, password and deletion'}</a></nav>
 <section id="provider-profile" className="account-card"><h2>{de?'Firma und Kontaktdaten':'Company and contact details'}</h2><AccountForm kind="provider" locale={locale} submit={de?'Firmenprofil speichern':'Save company profile'}>
 <AccountInput name="company_name" label={de?'Firmenname':'Company name'} value={p.company_name||''}/><AccountInput name="email" type="email" label={de?'Geschäftliche Kontakt-E-Mail':'Business contact email'} value={p.email||user.email||''}/><AccountInput name="phone" type="tel" label={de?'Telefon':'Phone'} value={p.phone||''} max={50}/><AccountInput name="address" label={de?'Geschäftsanschrift':'Business address'} value={p.address||''} max={500}/><AccountInput name="website" type="url" label="Website" value={p.website||''} required={false}/><label className="field">{de?'Technologie / Lösung':'Technology / solution'}<textarea name="solution" defaultValue={p.solution||''} rows={4} maxLength={5000} required/></label><label className="field">{de?'Zielmärkte und Entwicklungsstand':'Target markets and development stage'}<textarea name="markets" defaultValue={p.markets||''} rows={3} maxLength={2000}/></label></AccountForm></section>
 <section id="provider-account"><h2>{de?'Mein Konto':'My account'}</h2><AccountSettings locale={locale} profile={profile} email={user.email||''} pendingEmail={user.new_email}/></section><Link href={`/${locale}/wissen`}>{de?'Wissen & FAQ':'Guides & FAQ'}</Link>
 </main><PublicFooter locale={locale}/></>;
}
