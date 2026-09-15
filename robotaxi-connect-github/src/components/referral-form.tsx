'use client';
import { useRef, useState, useActionState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { createReferralAction } from '@/app/actions/business';
import { initialState } from '@/lib/action-state';
import { referralSchema } from '@/lib/validation';
import type { Company, Contact, Fleet, Locale, Provider } from '@/lib/domain';
import { messages, label } from '@/i18n/messages';
import { Field, Checkbox } from './fields';
type Props = {
  locale: Locale;
  company: Company;
  fleet?: Fleet;
  providers: Provider[];
  contacts: Contact[];
  requestId: string;
  disabled?: boolean;
};
export function ReferralDialog(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const m = messages[props.locale];
  return (
    <>
      <button
        type="button"
        className="button primary"
        disabled={!props.company.approved_at}
        onClick={() => dialog.current?.showModal()}
      >
        {m.refer}
        <ArrowUpRight size={15} />
      </button>
      <dialog ref={dialog} className="referral-dialog" aria-label={m.referralTitle}>
        <div className="dialog-header">
          <h2>{m.referralTitle}</h2>
          <button type="button" aria-label={m.cancel} onClick={() => dialog.current?.close()}>
            <X size={20} />
          </button>
        </div>
        <ReferralForm {...props} />
      </dialog>
    </>
  );
}
export function ReferralForm({
  locale,
  company,
  fleet,
  providers,
  contacts,
  requestId,
  disabled,
}: Props) {
  const m = messages[locale];
  const activeProviders = providers.filter(
    (p) => p.active && contacts.some((c) => c.provider_id === p.id),
  );
  const [providerId, setProviderId] = useState(activeProviders[0]?.id || '');
  const [review, setReview] = useState<[string, string][]>([]);
  const [clientError, setClientError] = useState('');
  const [state, action, pending] = useActionState(
    createReferralAction.bind(null, locale),
    initialState,
  );
  if (!activeProviders.length) return <div className="notice warning">{m.noProviderContacts}</div>;
  return (
    <form
      action={action}
      className="action-form"
      onSubmit={(event) => {
        if (review.length) {
          if (disabled) event.preventDefault();
          return;
        }
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = referralSchema.safeParse({
          ...Object.fromEntries(form),
          shared_fields: form.getAll('shared_fields'),
          customer_visible: form.get('customer_visible') === 'on',
        });
        if (!parsed.success) {
          setClientError(
            parsed.error.issues.some((i) => i.message === 'EXCLUSIVE_COMMISSION')
              ? m.exclusiveCommission
              : m.invalid,
          );
          return;
        }
        setClientError('');
        const input = parsed.data;
        const provider = providers.find((p) => p.id === input.provider_id);
        const contact = contacts.find((c) => c.id === input.provider_contact_id);
        const rows: [string, string][] = [
          [m.company, company.name],
          [m.provider, provider?.name || ''],
          [m.provider_contact_id, `${contact?.name || ''} · ${contact?.email || ''}`],
          [m.estimated_vehicles, String(input.estimated_vehicles)],
          [m.customer_protection_months, String(input.customer_protection_months)],
          [m.commission_initial, `${input.commission_initial} %`],
          [m.commission_recurring, `${input.commission_recurring} %`],
          [m.commission_fixed, `${input.commission_fixed} ${input.currency}`],
          [m.desired_start, input.desired_start || '—'],
          [m.internal_notes, input.internal_notes || '—'],
          [m.visibility, input.customer_visible ? m.visible : m.internal],
        ];
        const disclosures: Record<string, string> = {
          name: company.name,
          location: `${company.city}, ${company.country}`,
          fleet: `${fleet?.current_vehicles || 0} → ${input.estimated_vehicles}`,
          contact: `${company.email} · ${company.phone}`,
          requirements: fleet?.requirements || '—',
        };
        for (const key of input.shared_fields)
          rows.push([label(locale, `share_${key}`), disclosures[key]]);
        setReview(rows);
      }}
    >
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="company_id" value={company.id} />
      <input type="hidden" name="reviewed" value={review.length ? 'true' : 'false'} />
      <fieldset disabled={pending} style={review.length ? { display: 'none' } : undefined}>
        <p className="muted" style={{ marginBottom: 22 }}>
          {m.referralBody}
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="referral-provider">{m.provider} *</label>
            <select
              id="referral-provider"
              name="provider_id"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              {activeProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            key={providerId}
            name="provider_contact_id"
            locale={locale}
            choices={contacts
              .filter((c) => c.provider_id === providerId)
              .map((c) => ({ value: c.id, label: `${c.name} · ${c.email}` }))}
            value={contacts.find((c) => c.provider_id === providerId)?.id}
            required
          />
          <Field
            name="estimated_vehicles"
            locale={locale}
            type="number"
            value={fleet?.potential_vehicles || 1}
            required
            min={1}
            max={1000000}
          />
          <Field name="desired_start" locale={locale} type="date" />
          <Field
            name="customer_protection_months"
            locale={locale}
            type="number"
            value={12}
            required
            min={0}
            max={120}
          />
          <Field
            name="currency"
            locale={locale}
            value="EUR"
            options={['EUR', 'USD', 'GBP', 'CHF']}
          />
          <Field
            name="commission_initial"
            locale={locale}
            type="number"
            value={0}
            required
            min={0}
            max={100}
            step="0.01"
          />
          <Field
            name="commission_recurring"
            locale={locale}
            type="number"
            value={0}
            required
            min={0}
            max={100}
            step="0.01"
          />
          <Field
            name="commission_fixed"
            locale={locale}
            type="number"
            value={0}
            required
            min={0}
            step="0.01"
            hint="exclusiveCommission"
            wide
          />
          <Field name="internal_notes" locale={locale} type="textarea" wide max={10000} />
        </div>
        <div className="disclosure-box">
          <h3 className="small-heading">{m.shared_fields}</h3>
          {['name', 'location', 'fleet', 'contact', 'requirements'].map((k) => (
            <label key={k} className="checkbox">
              <input type="checkbox" name="shared_fields" value={k} />
              <span>{label(locale, `share_${k}`)}</span>
            </label>
          ))}
        </div>
        <Checkbox name="customer_visible" locale={locale} text="customer_visible" />
      </fieldset>
      {review.length > 0 && (
        <section>
          <h3>{m.reviewTitle}</h3>
          <p className="muted" style={{ marginTop: 12 }}>
            {m.reviewBody}
          </p>
          <dl className="review-summary">
            {review.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {(clientError || state.error) && (
        <div role="alert" className="notice error">
          {clientError || m[state.error!]}
        </div>
      )}
      <div className="review-actions">
        {review.length > 0 && (
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={() => setReview([])}
          >
            {m.back}
          </button>
        )}
        <button
          className="button primary"
          type="submit"
          disabled={pending || Boolean(disabled && review.length)}
        >
          {pending ? m.saving : review.length ? m.confirmReferral : m.review}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </form>
  );
}
