import { requireAdmin } from '@/lib/auth';
import { localeOf } from '@/lib/domain';
import { Workspace } from '@/components/workspace';
export default async function ProviderAccounts({params}:{params:Promise<{locale:string}>}) {
 const locale=localeOf((await params).locale); const {db}=await requireAdmin(locale);
 const {data,error}=await db.from('provider_accounts').select('*').order('updated_at',{ascending:false}).limit(200);
 if(error) throw new Error('PROVIDER_ACCOUNTS_UNAVAILABLE');
 return <Workspace locale={locale} admin active="provider-accounts" name="Robotaxi Connect"><h1>{locale==='de'?'Registrierte Technologieunternehmen':'Registered technology companies'}</h1><p>{locale==='de'?'Eigene Registrierungen zur persönlichen Bearbeitung. Keine Freigabe von Taxi- oder Netzwerkdaten.':'Registrations for personal handling. No taxi company or network data is disclosed.'}</p>{data?.length?data.map(p=><section className="account-card" key={p.user_id}><h2>{p.company_name|| (locale==='de'?'Profil noch unvollständig':'Profile incomplete')}</h2><p>{p.email} · {p.phone}</p><p>{p.address}</p><p>{p.website}</p><p>{p.solution}</p><p>{p.markets}</p><a href={`mailto:${p.email}`}>{locale==='de'?'Persönlich kontaktieren':'Contact personally'}</a></section>):<p>{locale==='de'?'Noch keine Registrierungen.':'No registrations yet.'}</p>}</Workspace>;
}
