import type { AdminData, PortalData } from './data';
import type { Company, Fleet, Profile, Referral, Contract, Document } from './domain';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const profile: Profile = {
  id: id(90),
  first_name: 'Alex',
  last_name: 'Demo',
  role: 'ADMIN',
  locale: 'de',
  deactivated_at: null,
};
const companyNames = [
  'Müller Taxi GmbH',
  'Demo City Mobility',
  'Demo Rhein Taxi',
  'Demo Nord Flotte',
  'Demo Urban Transfer',
  'Demo Isar Mobil',
];
const cities = ['Berlin', 'Hamburg', 'Köln', 'Hannover', 'Leipzig', 'München'];
const statuses = [
  'REFERRED',
  'PENDING_APPROVAL',
  'QUALIFIED',
  'CONTACTED',
  'PENDING_APPROVAL',
  'INTERESTED',
];
const companies: Company[] = companyNames.map((name, i) => ({
  id: id(i + 1),
  name,
  street: 'Demostraße',
  house_number: String(i + 1),
  postal_code: '10115',
  city: cities[i],
  country: 'Deutschland',
  phone: '+49 30 000000',
  email: `demo-${i + 1}@example.test`,
  website: null,
  company_type: i % 2 ? 'FLEET' : 'TAXI',
  status: statuses[i],
  created_at: `2026-09-${String(15 - i).padStart(2, '0')}T09:00:00Z`,
  approved_at: i === 1 || i === 4 ? null : '2026-09-10T12:00:00Z',
  locale: 'de',
}));
const fleets: Fleet[] = companies.map((c, i) => ({
  company_id: c.id,
  current_vehicles: [38, 64, 23, 112, 18, 47][i],
  potential_vehicles: [12, 20, 8, 30, 6, 15][i],
  timeline: '2028',
  requirements: 'Demo: innerstädtischer Flottenbetrieb.',
}));
const provider = {
  id: id(40),
  name: 'Demo Autonomous Provider',
  legal_name: 'Demo Autonomous Provider GmbH',
  country: 'Deutschland',
  website: null,
  solution: 'Autonome Flottenlösung · Demo',
  notes: 'Ausschließlich fiktive Entwicklungsdaten.',
  active: true,
};
const referrals: Referral[] = [
  {
    id: id(50),
    company_id: id(1),
    provider_id: provider.id,
    provider_name: provider.name,
    status: 'SENT',
    estimated_vehicles: 12,
    customer_visible: true,
    customer_visible_notes: null,
    sent_at: '2026-09-15T10:00:00Z',
    created_at: '2026-09-15T10:00:00Z',
    created_by: profile.id,
  },
  {
    id: id(51),
    company_id: id(3),
    provider_id: provider.id,
    provider_name: provider.name,
    status: 'IN_DISCUSSION',
    estimated_vehicles: 8,
    customer_visible: true,
    customer_visible_notes: null,
    sent_at: '2026-09-12T10:00:00Z',
    created_at: '2026-09-12T10:00:00Z',
    created_by: profile.id,
  },
  {
    id: id(52),
    company_id: id(4),
    provider_id: provider.id,
    provider_name: provider.name,
    status: 'OFFER',
    estimated_vehicles: 30,
    customer_visible: false,
    customer_visible_notes: null,
    sent_at: '2026-09-11T10:00:00Z',
    created_at: '2026-09-11T10:00:00Z',
    created_by: profile.id,
  },
];
const contracts: Contract[] = [
  {
    id: id(60),
    company_id: id(1),
    provider_id: provider.id,
    contract_number: 'DEMO-2026-001',
    contract_type: 'BROKERAGE',
    title: 'Vermittlungsvereinbarung · Demo',
    status: 'DRAFT',
    valid_from: '2026-10-01',
    valid_until: '2027-10-01',
    signed_at: null,
    customer_visible: true,
    customer_visible_notes: null,
    storage_path: null,
    created_at: '2026-09-15T10:00:00Z',
  },
];
const documents: Document[] = [];
export function demoAdmin(): AdminData {
  return {
    companies,
    fleets,
    contacts: companies.map((c, i) => ({
      id: id(70 + i),
      company_id: c.id,
      name: 'Alex Demo',
      email: c.email,
      phone: c.phone,
      position: 'Demo',
    })),
    providers: [provider],
    providerContacts: [
      {
        id: id(41),
        provider_id: provider.id,
        name: 'Demo Kontakt',
        email: 'provider@example.test',
        phone: '',
        position: 'Demo',
      },
    ],
    referrals,
    referralTerms: referrals.map((r) => ({
      company_id: r.company_id,
      referral_id: r.id,
      customer_protection_months: 12,
      commission_initial: 0,
      commission_recurring: 0,
      commission_fixed: 1500,
      currency: 'EUR',
      internal_notes: 'Demo',
      shared_fields: ['name', 'fleet'],
      disclosure: {
        name: companies.find((c) => c.id === r.company_id)!.name,
        potential_vehicles: r.estimated_vehicles,
      },
    })),
    contracts,
    contractTerms: [
      {
        company_id: id(1),
        contract_id: id(60),
        customer_protection_months: 12,
        commission_initial: 0,
        commission_recurring: 0,
        commission_fixed: 1500,
        currency: 'EUR',
        internal_notes: 'Demo',
      },
    ],
    documents,
    activities: [
      {
        id: id(80),
        company_id: id(1),
        actor_user_id: profile.id,
        kind: 'CALL',
        body: 'Demo: Anforderungen und Einführungszeitraum besprochen.',
        created_at: '2026-09-15T10:00:00Z',
      },
    ],
    audit: [],
    emailLogs: [],
    privacyRequests: [],
    profiles: [profile],
    companyNotes: [],
    profile,
    companyCount: companies.length,
    stats: {
      total: 6,
      new: 6,
      pending: 2,
      qualified: 3,
      potential: 91,
      active_referrals: 3,
      won: 0,
      open_contracts: 1,
      pipeline: { EUR: 4500 },
      statuses: { SENT: 1, IN_DISCUSSION: 1, OFFER: 1 },
    },
  };
}
export function demoPortal(): PortalData {
  return {
    company: companies[0],
    fleet: fleets[0],
    referrals: referrals.filter((r) => r.company_id === id(1) && r.customer_visible),
    contracts,
    documents,
    profile: { ...profile, role: 'COMPANY_USER' },
  };
}
