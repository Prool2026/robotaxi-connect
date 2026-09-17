'use server';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { fleetQuestions } from '@/config/fleet-questions';
import { requireAdmin, requireCompany, requireIdentity } from '@/lib/auth';
import { localeOf } from '@/lib/domain';
import {
  companySchema,
  providerSchema,
  contactSchema,
  activitySchema,
  contractSchema,
  referralSchema,
  uuid,
  statusSchema,
  referralStatusSchema,
  validateUpload,
} from '@/lib/validation';
import { registrationEnabled } from '@/lib/env';
import { legalVersion } from '@/config/legal-content';
import type { ActionState } from '@/lib/action-state';
type DbError = { message: string } | null;
function check(error: DbError) {
  if (error) throw new Error(error.message);
}
async function safely(work: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await work();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof z.ZodError)
      return { error: 'invalid', fields: [...new Set(error.issues.map((i) => String(i.path[0])))] };
    if (error instanceof Error && error.message.includes('RATE_LIMITED'))
      return { error: 'rateLimited' };
    if (error instanceof Error && error.message === 'INVALID_FILE')
      return { error: 'uploadInvalid' };
    return { error: 'error' };
  }
}
function values(form: FormData) {
  return {
    ...Object.fromEntries(form.entries()),
    customer_visible: form.get('customer_visible') === 'on',
    active: form.get('active') === 'on',
    consent: form.get('consent') === 'on',
  };
}
export async function saveCompanyAction(
  lang: string,
  id: string | null,
  admin: boolean,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const identity = admin
      ? await requireAdmin(locale)
      : id
        ? await requireCompany(locale)
        : await requireIdentity(locale);
    if (!admin && !id && !registrationEnabled()) return { error: 'legalNotReady' };
    // Company edits always derive the company from the server-side membership.
    const cid = admin
      ? id
        ? uuid.parse(id)
        : null
      : 'companyId' in identity
        ? String(identity.companyId)
        : null;
    const input = companySchema.parse({ ...values(form), qualification:Object.fromEntries(fleetQuestions.map(q=>[q.key,form.get(q.key)||''])), locale, legal_version: legalVersion });
    if (!admin && !cid && !input.consent) return { error: 'invalid', fields: ['consentCompany'] };
    if (admin && !input.email) return { error: 'invalid', fields: ['email'] };
    const { data, error } = await identity.db.rpc('save_company', { input, company_uuid: cid });
    check(error);
    revalidatePath(`/${locale}`, 'layout');
    if (!id) redirect(admin ? `/${locale}/admin/companies/${data}` : `/${locale}/portal`);
    return { ok: true };
  });
}
export async function companyStatusAction(
  lang: string,
  cid: string,
  approve: boolean,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    uuid.parse(cid);
    const { error } = approve
      ? await db.rpc('approve_company', { cid })
      : await db.rpc('set_company_status', {
          cid,
          next_status: statusSchema.parse(form.get('status')),
        });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    return { ok: true };
  });
}
export async function adminRecordAction(
  lang: string,
  kind: string,
  id: string | null,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    if (id) uuid.parse(id);
    const raw = values(form);
    const input =
      kind === 'provider'
        ? providerSchema.parse(raw)
        : kind === 'company_contact' || kind === 'provider_contact'
          ? contactSchema.parse(raw)
          : kind === 'activity'
            ? activitySchema.parse(raw)
            : kind === 'company_note'
              ? z.object({ company_id: uuid, internal_notes: z.string().max(10000) }).parse(raw)
              : null;
    if (!input) return { error: 'invalid' };
    const { data, error } = await db.rpc('save_admin_record', { kind, input, record_id: id });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    if (kind === 'provider' && !id) redirect(`/${locale}/admin/providers/${data}`);
    return { ok: true };
  });
}
export async function createReferralAction(
  lang: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    const input = referralSchema.parse({
      ...values(form),
      shared_fields: form.getAll('shared_fields'),
    });
    if (form.get('reviewed') !== 'true') return { error: 'invalid' };
    const { data, error } = await db.rpc('create_referral', { input });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    redirect(`/${locale}/admin/referrals/${data}?created=1`);
  });
}
export async function updateReferralAction(
  lang: string,
  rid: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    uuid.parse(rid);
    const { error } = await db.rpc('update_referral', {
      rid,
      next_status: referralStatusSchema.parse(form.get('status')),
      visible: form.get('customer_visible') === 'on',
      customer_notes: z
        .string()
        .max(5000)
        .parse(form.get('customer_visible_notes') || ''),
    });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    return { ok: true };
  });
}
export async function saveContractAction(
  lang: string,
  id: string | null,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    if (id) uuid.parse(id);
    const input = contractSchema.parse(values(form));
    const { data, error } = await db.rpc('save_contract', { input, contract_uuid: id });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    if (!id) redirect(`/${locale}/admin/contracts/${data}`);
    return { ok: true };
  });
}
export async function uploadDocumentAction(
  lang: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    const companyId = uuid.parse(form.get('company_id'));
    const contractId = z.union([uuid, z.literal('')]).parse(form.get('contract_id') || '');
    const title = z.string().trim().min(2).max(200).parse(form.get('title'));
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 10485760) throw new Error('INVALID_FILE');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = validateUpload(bytes, file.type, !!contractId);
    if (contractId) {
      const { data, error } = await db
        .from('contracts')
        .select('id')
        .eq('id', contractId)
        .eq('company_id', companyId)
        .single();
      check(error);
      if (!data) return { error: 'invalid' };
    }
    const storagePath = `companies/${companyId}/${contractId ? 'contracts' : 'documents'}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await db.storage
      .from('company-files')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    check(uploadError);
    const { error } = await db.rpc('attach_document', {
      input: {
        company_id: companyId,
        contract_id: contractId,
        title,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        customer_visible: form.get('customer_visible') === 'on',
      },
    });
    if (error) {
      await db.storage.from('company-files').remove([storagePath]);
      check(error);
    }
    revalidatePath(`/${locale}/admin`, 'layout');
    return { ok: true, message: 'uploadSuccess' };
  });
}
export async function documentVisibilityAction(
  lang: string,
  id: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    uuid.parse(id);
    const { error } = await db.rpc('set_document_visibility', {
      did: id,
      visible: form.get('customer_visible') === 'on',
      archive: form.get('archive') === 'on',
    });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    return { ok: true };
  });
}
export async function profileAction(
  lang: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireIdentity(locale);
    const input = z
      .object({
        first: z.string().trim().min(1).max(100),
        last: z.string().trim().min(1).max(100),
        lang: z.enum(['de', 'en']),
      })
      .parse({
        first: form.get('first_name'),
        last: form.get('last_name'),
        lang: form.get('locale'),
      });
    const { error } = await db.rpc('update_profile', input);
    check(error);
    revalidatePath(`/${locale}`, 'layout');
    return { ok: true };
  });
}
export async function privacyAction(
  lang: string,
  kind: 'DELETE' | 'DEACTIVATE',
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireCompany(locale);
    if (kind === 'DEACTIVATE' && form.get('confirm') !== 'on') return { error: 'invalid' };
    const { error } = await db.rpc('request_privacy', { request_kind: kind });
    check(error);
    if (kind === 'DEACTIVATE') {
      await db.auth.signOut();
      redirect(`/${locale}/login`);
    }
    return { ok: true, message: 'privacyRequested' };
  });
}
export async function resolvePrivacyAction(
  lang: string,
  id: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    uuid.parse(id);
    const { error } = await db.rpc('resolve_privacy', {
      rid: id,
      next_status: z
        .enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'])
        .parse(form.get('status')),
    });
    check(error);
    revalidatePath(`/${locale}/admin/settings`);
    return { ok: true };
  });
}
export async function addMemberAction(
  lang: string,
  id: string,
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return safely(async () => {
    const locale = localeOf(lang);
    const { db } = await requireAdmin(locale);
    uuid.parse(id);
    const email = z.email().max(254).parse(form.get('email'));
    const { error } = await db.rpc('add_company_member', { cid: id, member_email: email });
    check(error);
    revalidatePath(`/${locale}/admin`, 'layout');
    return { ok: true };
  });
}
