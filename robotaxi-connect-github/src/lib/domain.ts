export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const localeOf = (value: unknown): Locale => (value === 'en' ? 'en' : 'de');
export const roles = ['ADMIN', 'ADMIN_EMPLOYEE', 'COMPANY_USER', 'PROVIDER_USER'] as const;
export type Role = (typeof roles)[number];
export const isAdmin = (role: string) => role === 'ADMIN' || role === 'ADMIN_EMPLOYEE';
export const companyStatuses = [
  'NEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'CONTACTED',
  'QUALIFIED',
  'INTERESTED',
  'LOI',
  'REFERRED',
  'OFFER',
  'CUSTOMER',
  'LOST',
  'ARCHIVED',
] as const;
export const referralStatuses = [
  'DRAFT',
  'SENT',
  'RECEIVED',
  'IN_DISCUSSION',
  'OFFER',
  'WON',
  'LOST',
  'CANCELLED',
] as const;
export const contractStatuses = [
  'DRAFT',
  'SENT',
  'SIGNED',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'ARCHIVED',
] as const;
export const contractTypes = [
  'BROKERAGE',
  'SALES_PARTNER',
  'LOI',
  'NDA',
  'REFERRAL',
  'OTHER',
] as const;
export const companyTypes = [
  'TAXI',
  'RENTAL',
  'RIDE_HAILING',
  'MOBILITY',
  'FLEET',
  'OTHER',
] as const;
export const timelines = ['ASAP', '2027', '2028', '2029', 'LATER', 'OPEN'] as const;
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  locale: Locale;
  role: Role;
  deactivated_at: string | null;
};
export type Company = {
  id: string;
  name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string | null;
  company_type: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  locale: Locale;
};
export type Fleet = {
  qualification?: Record<string,string>;
  company_id: string;
  current_vehicles: number;
  potential_vehicles: number;
  timeline: string;
  requirements: string | null;
};
export type Referral = {
  id: string;
  company_id: string;
  provider_id: string;
  provider_name: string;
  status: string;
  estimated_vehicles: number;
  customer_visible: boolean;
  customer_visible_notes: string | null;
  sent_at: string | null;
  created_at: string;
  created_by: string;
};
export type Contract = {
  id: string;
  company_id: string;
  provider_id: string | null;
  contract_number: string;
  contract_type: string;
  title: string;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  signed_at: string | null;
  customer_visible: boolean;
  customer_visible_notes: string | null;
  storage_path: string | null;
  created_at: string;
};
export type Document = {
  id: string;
  company_id: string;
  contract_id: string | null;
  title: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  customer_visible: boolean;
  archived_at: string | null;
  created_at: string;
};
export type Provider = {
  id: string;
  name: string;
  legal_name: string;
  website: string | null;
  country: string;
  solution: string;
  notes: string | null;
  active: boolean;
};
export type Contact = {
  id: string;
  company_id?: string;
  provider_id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  locale?: Locale;
};
