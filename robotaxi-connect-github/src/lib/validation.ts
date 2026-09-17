import { fleetQuestions } from '@/config/fleet-questions';
import { z } from 'zod';
import {
  companyTypes,
  timelines,
  companyStatuses,
  contractStatuses,
  contractTypes,
  referralStatuses,
} from './domain';
const text = (max = 200) => z.string().trim().min(1).max(max);
const optionalText = (max = 5000) => z.string().trim().max(max).default('');
const whole = (max = 1000000) => z.coerce.number().int().min(0).max(max);
const money = z.coerce.number().finite().min(0).max(999999999999).multipleOf(0.01);
const date = z.union([z.literal(''), z.iso.date()]).default('');
export const uuid = z.uuid();
export const website = z
  .union([z.literal(''), z.url().refine((s) => ['https:', 'http:'].includes(new URL(s).protocol))])
  .default('');
export const credentialsSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const registerSchema = credentialsSchema.extend({
  first_name: text(100),
  last_name: text(100),
  locale: z.enum(['de', 'en']),
  consent: z.literal(true),
});
export const companySchema = z.object({
  name: text().min(2),
  street: text(),
  house_number: text(30),
  postal_code: text(20),
  city: text(100),
  country: text(100).min(2),
  phone: text(50).min(3),
  email: z.union([z.literal(''), z.email().max(254)]).default(''),
  website,
  company_type: z.enum(companyTypes),
  qualification: z.object(Object.fromEntries(fleetQuestions.map(q=>[q.key,optionalText(2500)]))).default({}),
  current_vehicles: whole(),
  potential_vehicles: whole(),
  timeline: z.enum(timelines),
  requirements: optionalText(),
  locale: z.enum(['de', 'en']),
  consent: z.boolean().default(false),
  legal_version: optionalText(50),
});
export const termsSchema = z.object({
  customer_protection_months: whole(120),
  commission_initial: z.coerce.number().min(0).max(100),
  commission_recurring: z.coerce.number().min(0).max(100),
  commission_fixed: money,
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']),
  internal_notes: optionalText(10000),
});
const exclusiveCommission = (v: {
  commission_fixed: number;
  commission_initial: number;
  commission_recurring: number;
}) => v.commission_fixed === 0 || (v.commission_initial === 0 && v.commission_recurring === 0);
export const referralSchema = termsSchema
  .extend({
    request_id: uuid,
    company_id: uuid,
    provider_id: uuid,
    provider_contact_id: uuid,
    estimated_vehicles: whole().refine((v) => v > 0),
    desired_start: date,
    shared_fields: z.array(z.enum(['name', 'location', 'fleet', 'contact', 'requirements'])).min(1),
    customer_visible: z.boolean(),
  })
  .refine(exclusiveCommission, { path: ['commission_fixed'], message: 'EXCLUSIVE_COMMISSION' });
export const contractSchema = termsSchema
  .extend({
    company_id: uuid,
    provider_id: z.union([uuid, z.literal('')]),
    referral_id: z.union([uuid, z.literal('')]),
    contract_number: text(100),
    contract_type: z.enum(contractTypes),
    title: text().min(2),
    status: z.enum(contractStatuses),
    valid_from: date,
    valid_until: date,
    signed_at: date,
    customer_visible: z.boolean(),
    customer_visible_notes: optionalText(),
  })
  .refine((v) => !v.valid_from || !v.valid_until || v.valid_until >= v.valid_from, {
    path: ['valid_until'],
    message: 'INVALID_DATE_RANGE',
  })
  .refine(exclusiveCommission, { path: ['commission_fixed'], message: 'EXCLUSIVE_COMMISSION' });
export const providerSchema = z.object({
  name: text().min(2),
  legal_name: text().min(2),
  website,
  country: text(100).min(2),
  solution: text(5000),
  notes: optionalText(10000),
  active: z.boolean(),
});
export const contactSchema = z.object({
  name: text(),
  email: z.email().max(254),
  phone: optionalText(50),
  position: optionalText(200),
  company_id: z.union([uuid, z.literal('')]).optional(),
  provider_id: z.union([uuid, z.literal('')]).optional(),
  locale: z.enum(['de', 'en']).default('de'),
});
export const activitySchema = z.object({
  company_id: uuid,
  kind: z.enum(['NOTE', 'CALL', 'MEETING', 'EMAIL']),
  body: text(10000),
});
export const statusSchema = z.enum(companyStatuses);
export const referralStatusSchema = z.enum(referralStatuses);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export function validateUpload(bytes: Uint8Array, mime: string, contract = false) {
  if (bytes.length < 8 || bytes.length > MAX_UPLOAD_BYTES) throw new Error('INVALID_FILE');
  const pdf = new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (contract && !(pdf && mime === 'application/pdf')) throw new Error('INVALID_FILE');
  if (pdf && mime === 'application/pdf') return 'pdf';
  if (png && mime === 'image/png') return 'png';
  if (jpg && mime === 'image/jpeg') return 'jpg';
  throw new Error('INVALID_FILE');
}
export function formObject(form: FormData) {
  return Object.fromEntries(form.entries());
}
export function safeNext(value: string | null, locale: string) {
  return value === 'reset-password' ? `/${locale}/reset-password` : `/${locale}/portal`;
}
