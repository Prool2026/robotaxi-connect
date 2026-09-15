import { brand } from '../../config/brand';
import { label } from '../../i18n/messages';
import type { Locale } from '../domain';
export const templateNames = [
  'registration_received',
  'account_approved',
  'referral_provider',
  'referral_company',
  'contract_added',
  'document_added',
] as const;
export type EmailTemplate = (typeof templateNames)[number];
export const emailCopy = {
  de: {
    registration_received: [
      'Ihre Registrierung ist eingegangen',
      'Vielen Dank. Ihr Unternehmen wurde registriert und wird jetzt geprüft.',
    ],
    account_approved: [
      'Ihr Firmenaccount wurde freigegeben',
      'Ihr Firmenaccount ist jetzt freigegeben. Den aktuellen Stand finden Sie in Ihrem Portal.',
    ],
    referral_provider: [
      'Neue Unternehmensvermittlung',
      'Für Sie wurde eine neue Unternehmensvermittlung erfasst. Nachfolgend finden Sie ausschließlich die für diese Vermittlung ausgewählten Informationen.',
    ],
    referral_company: [
      'Ihre Vermittlung wurde erfasst',
      'Eine Vermittlung für Ihr Unternehmen wurde dokumentiert. Freigegebene Details finden Sie in Ihrem Firmenportal.',
    ],
    contract_added: [
      'Ein Vertrag wurde hinzugefügt',
      'Ein Vertrag wurde für Ihr Unternehmen freigegeben. Sie können ihn in Ihrem Firmenportal einsehen.',
    ],
    document_added: [
      'Ein Dokument ist verfügbar',
      'Ein Dokument wurde für Ihr Unternehmen freigegeben. Sie können es in Ihrem Firmenportal sicher herunterladen.',
    ],
    portal: 'Zum Firmenportal',
    reference: 'Vermittlungsreferenz',
    confirmation: 'E-Mail-Adresse bestätigen',
    confirmationBody:
      'Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Firmenprofil zu vervollständigen.',
    recovery: 'Passwort zurücksetzen',
    recoveryBody: 'Verwenden Sie den folgenden Link, um ein neues Passwort festzulegen.',
  },
  en: {
    registration_received: [
      'We have received your registration',
      'Thank you. Your company has been registered and is now being reviewed.',
    ],
    account_approved: [
      'Your company account is approved',
      'Your company account has been approved. Find the latest information in your portal.',
    ],
    referral_provider: [
      'New company referral',
      'A new company referral has been created for you. Only the information selected for this introduction is included below.',
    ],
    referral_company: [
      'Your referral has been recorded',
      'A referral for your company has been documented. Shared details are available in your company portal.',
    ],
    contract_added: [
      'A contract has been added',
      'A contract has been shared with your company. You can view it in your company portal.',
    ],
    document_added: [
      'A document is available',
      'A document has been shared with your company. You can download it securely from your company portal.',
    ],
    portal: 'Open company portal',
    reference: 'Referral reference',
    confirmation: 'Confirm your email address',
    confirmationBody: 'Confirm your email address to complete your company profile.',
    recovery: 'Reset your password',
    recoveryBody: 'Use the following link to set a new password.',
  },
};
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
export function renderEmail(
  template: EmailTemplate,
  locale: Locale,
  payload: Record<string, unknown>,
  origin: string,
) {
  const copy = emailCopy[locale];
  const [subject, intro] = copy[template];
  const url = `${new URL(origin).origin}/${locale}/portal`;
  const disclosure =
    template === 'referral_provider' &&
    typeof payload.disclosure === 'object' &&
    payload.disclosure !== null
      ? Object.entries(payload.disclosure)
      : [];
  const allowed = new Set([
    'name',
    'city',
    'country',
    'current_vehicles',
    'potential_vehicles',
    'email',
    'phone',
    'requirements',
  ]);
  const fields = disclosure
    .filter(([key]) => allowed.has(key))
    .map(([key, value]) => [label(locale, key), String(value ?? '—')]);
  const ref =
    typeof payload.referral_id === 'string' ? `${copy.reference}: ${payload.referral_id}` : '';
  const lines = [
    brand.name,
    subject,
    intro,
    ...fields.map(([k, v]) => `${k}: ${v}`),
    ref,
    template === 'referral_provider' ? '' : `${copy.portal}: ${url}`,
  ].filter(Boolean);
  const html = `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f5f7f1;font-family:Arial,sans-serif;color:#193b32"><main style="max-width:600px;margin:32px auto;padding:36px;background:#fff;border:1px solid #dce2d9"><p style="font-size:13px">${escapeHtml(brand.name)}</p><h1 style="font-size:24px;line-height:1.3">${escapeHtml(subject)}</h1><p style="font-size:15px;line-height:1.8">${escapeHtml(intro)}</p>${fields.length ? `<table style="width:100%;font-size:14px">${fields.map(([k, v]) => `<tr><th style="text-align:left;padding:8px">${escapeHtml(k)}</th><td style="padding:8px">${escapeHtml(v)}</td></tr>`).join('')}</table>` : ''}${ref ? `<p style="font-size:12px">${escapeHtml(ref)}</p>` : ''}${template !== 'referral_provider' ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 20px;background:#193b32;color:#fff;text-decoration:none">${escapeHtml(copy.portal)}</a></p>` : ''}</main></body></html>`;
  return { subject: `${brand.name} · ${subject}`, text: lines.join('\n\n'), html };
}
export function renderSupabaseAuthTemplate(type: 'confirmation' | 'recovery') {
  const title = `{{ if eq .Data.locale "en" }}${emailCopy.en[type]}{{ else }}${emailCopy.de[type]}{{ end }}`;
  const body =
    type === 'confirmation'
      ? `{{ if eq .Data.locale "en" }}${emailCopy.en.confirmationBody}{{ else }}${emailCopy.de.confirmationBody}{{ end }}`
      : `{{ if eq .Data.locale "en" }}${emailCopy.en.recoveryBody}{{ else }}${emailCopy.de.recoveryBody}{{ end }}`;
  const url = `{{ .SiteURL }}/{{ if eq .Data.locale "en" }}en{{ else }}de{{ end }}/auth/callback?token_hash={{ .TokenHash }}&type=${type === 'confirmation' ? 'signup' : 'recovery'}`;
  return `<h2>${escapeHtml(brand.name)}</h2><h1>${title}</h1><p>${body}</p><p><a href="${url}">${title}</a></p>`;
}
