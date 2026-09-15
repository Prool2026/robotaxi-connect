import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Company,
  Contract,
  Contact,
  Document,
  Fleet,
  Profile,
  Provider,
  Referral,
} from './domain';
export type Activity = {
  id: string;
  company_id: string;
  actor_user_id: string;
  kind: string;
  body: string;
  created_at: string;
};
export type Audit = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  company_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type EmailLog = {
  id: string;
  company_id: string;
  recipient: string;
  template: string;
  status: string;
  attempt_count: number;
  external_message_id: string | null;
  error_code: string | null;
  created_at: string;
};
export type PrivacyRequest = {
  id: string;
  user_id: string;
  company_id: string | null;
  kind: string;
  status: string;
  created_at: string;
};
export type Terms = {
  company_id: string;
  referral_id?: string;
  contract_id?: string;
  customer_protection_months: number;
  commission_initial: number;
  commission_recurring: number;
  commission_fixed: number;
  currency: string;
  internal_notes: string;
  shared_fields?: string[];
  disclosure?: Record<string, string | number | null>;
};
export type Stats = {
  total: number;
  new: number;
  pending: number;
  qualified: number;
  potential: number;
  active_referrals: number;
  won: number;
  open_contracts: number;
  pipeline: Record<string, number>;
  statuses: Record<string, number>;
};
export type PortalData = {
  company: Company;
  fleet: Fleet;
  referrals: Referral[];
  contracts: Contract[];
  documents: Document[];
  profile: Profile;
};
export type AdminData = {
  companies: Company[];
  fleets: Fleet[];
  contacts: Contact[];
  providers: Provider[];
  providerContacts: Contact[];
  referrals: Referral[];
  referralTerms: Terms[];
  contracts: Contract[];
  contractTerms: Terms[];
  documents: Document[];
  activities: Activity[];
  audit: Audit[];
  emailLogs: EmailLog[];
  privacyRequests: PrivacyRequest[];
  profiles: Profile[];
  companyNotes: { company_id: string; internal_notes: string }[];
  stats: Stats;
  profile: Profile;
  companyCount: number;
  collectionCount?: number;
};
export const companyColumns =
  'id,name,street,house_number,postal_code,city,country,phone,email,website,company_type,status,created_at,approved_at,locale';
export const referralColumns =
  'id,company_id,provider_id,provider_name,status,estimated_vehicles,customer_visible,customer_visible_notes,sent_at,created_at,created_by';
export const contractColumns =
  'id,company_id,provider_id,contract_number,contract_type,title,status,valid_from,valid_until,signed_at,customer_visible,customer_visible_notes,storage_path,created_at';
export const documentColumns =
  'id,company_id,contract_id,title,storage_path,mime_type,size_bytes,customer_visible,archived_at,created_at';
function must<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error || result.data === null) throw new Error('DATA_UNAVAILABLE');
  return result.data;
}
export async function loadPortal(
  db: SupabaseClient,
  companyId: string,
  profile: Profile,
): Promise<PortalData> {
  const [c, f, r, k, d] = await Promise.all([
    db.from('companies').select(companyColumns).eq('id', companyId).single(),
    db
      .from('fleet_profiles')
      .select('company_id,current_vehicles,potential_vehicles,timeline,requirements')
      .eq('company_id', companyId)
      .single(),
    db
      .from('referrals')
      .select(referralColumns)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    db
      .from('contracts')
      .select(contractColumns)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    db
      .from('documents')
      .select(documentColumns)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);
  return {
    company: must(c) as unknown as Company,
    fleet: must(f) as Fleet,
    referrals: must(r) as unknown as Referral[],
    contracts: must(k) as unknown as Contract[],
    documents: must(d) as unknown as Document[],
    profile,
  };
}
export async function loadAdmin(
  db: SupabaseClient,
  profile: Profile,
  query: {
    search?: string;
    status?: string;
    page?: number;
    companyId?: string;
    section?: string;
    recordId?: string;
  } = {},
): Promise<AdminData> {
  let companies = db
    .from('companies')
    .select(companyColumns, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id');
  if (query.companyId) companies = companies.eq('id', query.companyId);
  if (query.search) {
    const safe = query.search.replace(/[%_,().\\]/g, ' ').slice(0, 100);
    companies = companies.or(`name.ilike.%${safe}%,city.ilike.%${safe}%`);
  }
  if (query.status) companies = companies.eq('status', query.status);
  const page = Math.max(0, query.page || 0);
  companies = companies.range(page * 50, page * 50 + 49);
  const list = (table: string, section: string, columns = '*') => {
    let q = db
      .from(table)
      .select(columns, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id');
    if (query.companyId && !['providers', 'provider_contacts'].includes(table))
      q = q.eq('company_id', query.companyId);
    if (query.recordId && query.section === section && query.recordId !== 'new')
      q = q.eq('id', query.recordId);
    if (table.endsWith('_contacts')) q = q.is('archived_at', null);
    return query.section === section && !query.recordId
      ? q.range(page * 50, page * 50 + 49)
      : q.limit(100);
  };
  const all = await Promise.all([
    companies,
    db.from('fleet_profiles').select('*').limit(1000),
    list('company_contacts', 'contacts'),
    list('providers', 'providers'),
    db.from('provider_contacts').select('*').is('archived_at', null).limit(1000),
    list('referrals', 'referrals'),
    db.from('referral_terms').select('*').limit(0),
    list('contracts', 'contracts'),
    db.from('contract_terms').select('*').limit(0),
    list('documents', 'documents'),
    list('activities', 'activities'),
    list('audit_logs', 'activities'),
    list(
      'email_logs',
      'settings',
      'id,company_id,recipient,template,status,attempt_count,external_message_id,error_code,created_at',
    ),
    list('privacy_requests', 'settings'),
    db.from('profiles').select('id,first_name,last_name,role,locale,deactivated_at').limit(1000),
    db.from('company_private').select('company_id,internal_notes').limit(500),
    db.rpc('admin_dashboard'),
  ]);
  const data = all.map(must);
  const result = {
    companies: data[0],
    fleets: data[1],
    contacts: data[2],
    providers: data[3],
    providerContacts: data[4],
    referrals: data[5],
    referralTerms: data[6],
    contracts: data[7],
    contractTerms: data[8],
    documents: data[9],
    activities: data[10],
    audit: data[11],
    emailLogs: data[12],
    privacyRequests: data[13],
    profiles: data[14],
    companyNotes: data[15],
    stats: data[16],
    profile,
    companyCount: all[0].count || 0,
  } as AdminData;
  const index = {
    contacts: 2,
    providers: 3,
    referrals: 5,
    contracts: 7,
    documents: 9,
    activities: 11,
    settings: 12,
  }[query.section || ''];
  result.collectionCount = index === undefined ? 0 : all[index].count || 0;
  if (query.section === 'activities')
    result.collectionCount = Math.max(all[10].count || 0, all[11].count || 0);
  if (query.section === 'settings')
    result.collectionCount = Math.max(all[12].count || 0, all[13].count || 0);
  // Fetch terms and relations for the actual rows, so older detail pages never depend on a list limit.
  const relatedCompanies = [
    ...new Set(
      [
        ...result.contacts,
        ...result.referrals,
        ...result.contracts,
        ...result.documents,
        ...result.activities,
      ]
        .map((r) => r.company_id)
        .filter((id): id is string => !!id),
    ),
  ];
  if (query.section !== 'companies')
    for (let i = 0; i < relatedCompanies.length; i += 100) {
      const ids = relatedCompanies
        .slice(i, i + 100)
        .filter((id) => !result.companies.some((c) => c.id === id));
      if (ids.length)
        result.companies.push(
          ...(must(
            await db.from('companies').select(companyColumns).in('id', ids),
          ) as unknown as Company[]),
        );
    }
  const relatedRows = async <T>(table: string, column: string, ids: string[]): Promise<T[]> => {
    const rows: T[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      rows.push(
        ...(must(
          await db
            .from(table)
            .select('*')
            .in(column, ids.slice(i, i + 100)),
        ) as T[]),
      );
    }
    return rows;
  };
  [result.referralTerms, result.contractTerms, result.fleets] = await Promise.all([
    relatedRows<Terms>(
      'referral_terms',
      'referral_id',
      result.referrals.map((r) => r.id),
    ),
    relatedRows<Terms>(
      'contract_terms',
      'contract_id',
      result.contracts.map((c) => c.id),
    ),
    relatedRows<Fleet>(
      'fleet_profiles',
      'company_id',
      result.companies.map((c) => c.id),
    ),
  ]);
  if (query.companyId)
    result.companyNotes = must(
      await db
        .from('company_private')
        .select('company_id,internal_notes')
        .eq('company_id', query.companyId),
    );
  if (query.section === 'providers' && query.recordId && query.recordId !== 'new')
    result.providerContacts = must(
      await db
        .from('provider_contacts')
        .select('*')
        .eq('provider_id', query.recordId)
        .is('archived_at', null),
    ) as Contact[];
  if (query.section === 'contracts' && query.recordId && query.recordId !== 'new')
    result.documents = must(
      await db.from('documents').select('*').eq('contract_id', query.recordId),
    ) as Document[];
  if (query.section === 'contracts' && query.recordId && query.recordId !== 'new') {
    const contract = result.contracts[0] as Contract & { referral_id?: string };
    if (contract?.provider_id && !result.providers.some((p) => p.id === contract.provider_id))
      result.providers.push(
        ...(must(
          await db.from('providers').select('*').eq('id', contract.provider_id),
        ) as Provider[]),
      );
    if (contract?.referral_id && !result.referrals.some((r) => r.id === contract.referral_id))
      result.referrals.push(
        ...(must(
          await db.from('referrals').select('*').eq('id', contract.referral_id),
        ) as Referral[]),
      );
  }
  return result;
}
