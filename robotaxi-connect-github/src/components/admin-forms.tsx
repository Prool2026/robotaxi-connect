import { Field, Checkbox } from './fields';
import { ActionForm } from './action-form';
import { messages } from '@/i18n/messages';
import type { Company, Contact, Contract, Locale, Provider, Referral } from '@/lib/domain';
import { contractStatuses, contractTypes } from '@/lib/domain';
import type { Terms } from '@/lib/data';
import {
  adminRecordAction,
  saveContractAction,
  uploadDocumentAction,
} from '@/app/actions/business';
export function ProviderForm({
  locale,
  provider,
  disabled,
}: {
  locale: Locale;
  provider?: Provider;
  disabled?: boolean;
}) {
  return (
    <ActionForm
      action={adminRecordAction.bind(null, locale, 'provider', provider?.id || null)}
      locale={locale}
      submit={provider ? 'save' : 'addProvider'}
      disabled={disabled}
    >
      <div className="form-grid">
        <Field
          name="name"
          labelKey="providerName"
          locale={locale}
          value={provider?.name}
          required
        />
        <Field name="legal_name" locale={locale} value={provider?.legal_name} required />
        <Field name="website" locale={locale} value={provider?.website} type="url" />
        <Field name="country" locale={locale} value={provider?.country} required />
        <Field
          name="solution"
          locale={locale}
          value={provider?.solution}
          required
          type="textarea"
          wide
        />
        <Field
          name="notes"
          locale={locale}
          value={provider?.notes}
          type="textarea"
          wide
          max={10000}
        />
      </div>
      <Checkbox
        name="active"
        locale={locale}
        text="active"
        checked={provider ? provider.active : true}
      />
    </ActionForm>
  );
}
export function ContactForm({
  locale,
  parentId,
  provider = false,
  contact,
  disabled,
}: {
  locale: Locale;
  parentId: string;
  provider?: boolean;
  contact?: Contact;
  disabled?: boolean;
}) {
  return (
    <ActionForm
      action={adminRecordAction.bind(
        null,
        locale,
        provider ? 'provider_contact' : 'company_contact',
        contact?.id || null,
      )}
      locale={locale}
      submit={contact ? 'save' : 'addContact'}
      disabled={disabled}
    >
      <input type="hidden" name={provider ? 'provider_id' : 'company_id'} value={parentId} />
      <div className="form-grid">
        <Field
          name="name"
          labelKey="contactName"
          locale={locale}
          value={contact?.name}
          required
          wide
        />
        <Field
          name="email"
          locale={locale}
          value={contact?.email}
          type="email"
          required
          max={254}
        />
        <Field name="phone" locale={locale} value={contact?.phone} type="tel" max={50} />
        <Field name="position" locale={locale} value={contact?.position} />
        <Field
          name="locale"
          labelKey="language"
          locale={locale}
          choices={[
            { value: 'de', label: 'Deutsch' },
            { value: 'en', label: 'English' },
          ]}
          value={contact?.locale || locale}
        />
      </div>
    </ActionForm>
  );
}
export function TermsFields({ locale, terms }: { locale: Locale; terms?: Terms }) {
  return (
    <>
      <h3 className="small-heading" style={{ marginTop: 28 }}>
        {messages[locale].termsInternal}
      </h3>
      <div className="form-grid">
        <Field
          name="customer_protection_months"
          locale={locale}
          type="number"
          min={0}
          max={120}
          value={terms?.customer_protection_months ?? 0}
          required
        />
        <Field
          name="currency"
          locale={locale}
          options={['EUR', 'USD', 'GBP', 'CHF']}
          value={terms?.currency || 'EUR'}
        />
        <Field
          name="commission_initial"
          locale={locale}
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={terms?.commission_initial ?? 0}
          required
        />
        <Field
          name="commission_recurring"
          locale={locale}
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={terms?.commission_recurring ?? 0}
          required
        />
        <Field
          name="commission_fixed"
          locale={locale}
          type="number"
          min={0}
          step="0.01"
          value={terms?.commission_fixed ?? 0}
          required
          wide
          hint="exclusiveCommission"
        />
        <Field
          name="internal_notes"
          locale={locale}
          value={terms?.internal_notes}
          type="textarea"
          wide
          max={10000}
        />
      </div>
    </>
  );
}
export function ContractForm({
  locale,
  companies,
  providers,
  referrals,
  contract,
  terms,
  companyId,
  disabled,
}: {
  locale: Locale;
  companies: Company[];
  providers: Provider[];
  referrals: Referral[];
  contract?: Contract & { referral_id?: string };
  terms?: Terms;
  companyId?: string;
  disabled?: boolean;
}) {
  const m = messages[locale];
  return (
    <ActionForm
      action={saveContractAction.bind(null, locale, contract?.id || null)}
      locale={locale}
      submit={contract ? 'save' : 'addContract'}
      disabled={disabled}
    >
      <div className="form-grid">
        {contract ? (
          <>
            <input type="hidden" name="company_id" value={contract.company_id} />
            <div className="field full">
              <label>{m.company}</label>
              <p>
                {companies.find((c) => c.id === contract.company_id)?.name || contract.company_id}
              </p>
            </div>
          </>
        ) : (
          <Field
            name="company_id"
            labelKey="company"
            locale={locale}
            choices={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={companyId || companies[0]?.id}
            required
            wide
          />
        )}
        <Field name="title" locale={locale} value={contract?.title} required wide />
        <Field name="contract_number" locale={locale} value={contract?.contract_number} required />
        <Field
          name="contract_type"
          locale={locale}
          options={contractTypes}
          value={contract?.contract_type || 'BROKERAGE'}
        />
        <Field
          name="status"
          locale={locale}
          options={contractStatuses}
          value={contract?.status || 'DRAFT'}
        />
        <Field
          name="provider_id"
          labelKey="provider"
          locale={locale}
          choices={[
            { value: '', label: m.none },
            ...providers.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={contract?.provider_id || ''}
        />
        <Field
          name="referral_id"
          locale={locale}
          choices={[
            { value: '', label: m.none },
            ...referrals
              .filter((r) => !contract || r.company_id === contract.company_id)
              .map((r) => ({ value: r.id, label: `${r.provider_name} · ${r.id.slice(0, 8)}` })),
          ]}
          value={contract?.referral_id || ''}
          wide
        />
        <Field name="valid_from" locale={locale} type="date" value={contract?.valid_from} />
        <Field name="valid_until" locale={locale} type="date" value={contract?.valid_until} />
        <Field
          name="signed_at"
          locale={locale}
          type="date"
          value={contract?.signed_at?.slice(0, 10)}
        />
        <Field
          name="customer_visible_notes"
          locale={locale}
          value={contract?.customer_visible_notes}
          type="textarea"
          wide
        />
      </div>
      <Checkbox
        name="customer_visible"
        locale={locale}
        text="customer_visible"
        checked={contract?.customer_visible}
      />
      <TermsFields locale={locale} terms={terms} />
    </ActionForm>
  );
}
export function UploadForm({
  locale,
  companies,
  contracts,
  companyId,
  contractId,
  disabled,
}: {
  locale: Locale;
  companies: Company[];
  contracts: Contract[];
  companyId?: string;
  contractId?: string;
  disabled?: boolean;
}) {
  const m = messages[locale];
  return (
    <ActionForm
      action={uploadDocumentAction.bind(null, locale)}
      locale={locale}
      submit="upload"
      disabled={disabled}
    >
      <div className="form-grid">
        <Field
          name="company_id"
          labelKey="company"
          locale={locale}
          value={companyId || companies[0]?.id}
          choices={companies.map((c) => ({ value: c.id, label: c.name }))}
          required
        />
        <Field
          name="contract_id"
          labelKey="contract"
          locale={locale}
          value={contractId || ''}
          choices={[
            { value: '', label: m.none },
            ...contracts
              .filter((c) => !companyId || c.company_id === companyId)
              .map((c) => ({ value: c.id, label: `${c.contract_number} · ${c.title}` })),
          ]}
        />
        <Field name="title" locale={locale} required wide />
        <div className="field full">
          <label htmlFor="upload-file">{m.file} *</label>
          <input
            id="upload-file"
            type="file"
            name="file"
            accept={contractId ? 'application/pdf' : 'application/pdf,image/png,image/jpeg'}
            required
          />
          <small>{m.fileHint}</small>
        </div>
      </div>
      <Checkbox name="customer_visible" locale={locale} text="customer_visible" />
    </ActionForm>
  );
}
