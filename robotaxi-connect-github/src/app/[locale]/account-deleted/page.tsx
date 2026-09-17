import Link from 'next/link';
import { localeOf } from '@/lib/domain';
import { PublicHeader,PublicFooter } from '@/components/public-layout';
export default async function Deleted({params}:{params:Promise<{locale:string}>}) {
 const locale=localeOf((await params).locale);
 return <><PublicHeader locale={locale}/><main id="main" className="narrow-page"><h1>{locale==='de'?'Ihr Konto wurde gelöscht.':'Your account has been deleted.'}</h1><p>{locale==='de'?'Sie sind abgemeldet und können sich mit diesem Konto nicht mehr anmelden.':'You are signed out and can no longer sign in using this account.'}</p><Link href={`/${locale}`} className="button primary">{locale==='de'?'Zur Startseite':'Back to home'}</Link></main><PublicFooter locale={locale}/></>;
}
