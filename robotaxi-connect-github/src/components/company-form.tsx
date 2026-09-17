import { fleetQuestions } from '@/config/fleet-questions';
import { ActionForm } from './action-form';
import { Field, Checkbox } from './fields';
import { messages } from '@/i18n/messages';
import { saveCompanyAction } from '@/app/actions/business';
import { companyTypes, timelines, type Locale, type Company, type Fleet } from '@/lib/domain';
export function CompanyForm({
  locale,
  company,
  fleet,
  admin = false,
  disabled = false,
}: {
  locale: Locale;
  company?: Company;
  fleet?: Fleet;
  admin?: boolean;
  disabled?: boolean;
}) {
  const m = messages[locale];
  return (
    <ActionForm
      action={saveCompanyAction.bind(null, locale, company?.id || null, admin)}
      locale={locale}
      submit={company ? 'save' : admin ? 'addCompany' : 'registerCompany'}
      disabled={disabled}
    >
      <section className="form-section">
        <h3>{m.companyDetails}</h3>
        <div className="form-grid">
          <Field
            name="name"
            locale={locale}
            value={company?.name}
            required
            wide
            autoComplete="organization"
          />
          <Field
            name="company_type"
            locale={locale}
            value={company?.company_type || 'TAXI'}
            options={companyTypes}
            required
            wide
          />
          <Field name="street" locale={locale} value={company?.street} required />
          <Field
            name="house_number"
            locale={locale}
            value={company?.house_number}
            required
            max={30}
          />
          <Field
            name="postal_code"
            locale={locale}
            value={company?.postal_code}
            required
            autoComplete="postal-code"
            max={20}
          />
          <Field
            name="city"
            locale={locale}
            value={company?.city}
            required
            autoComplete="address-level2"
            max={100}
          />
          <Field
            name="country"
            locale={locale}
            value={company?.country || 'Deutschland'}
            required
            autoComplete="country-name"
            max={100}
          />
          <Field
            name="website"
            locale={locale}
            type="url"
            value={company?.website}
            autoComplete="url"
            max={500}
          />
        </div>
      </section>
      <section className="form-section">
        <h3>{m.contactDetails}</h3>
        <div className="form-grid">
          <Field
            name="phone"
            locale={locale}
            value={company?.phone}
            required
            type="tel"
            autoComplete="tel"
            max={50}
          />
          {(admin || company) && (
            <Field
              name="email"
              locale={locale}
              value={company?.email}
              type="email"
              required
              max={254}
            />
          )}
        </div>
      </section>
      <section>
        <h3 className="small-heading">{m.fleetDetails}</h3>
        <div className="form-grid">
          <Field
            name="current_vehicles"
            locale={locale}
            value={fleet?.current_vehicles ?? 0}
            type="number"
            min={0}
            max={1000000}
            required
          />
          <Field
            name="potential_vehicles"
            locale={locale}
            value={fleet?.potential_vehicles ?? 0}
            type="number"
            min={0}
            max={1000000}
            required
          />
          <Field
            name="timeline"
            locale={locale}
            value={fleet?.timeline || 'OPEN'}
            options={timelines}
            required
            wide
          />
          <Field
            name="requirements"
            locale={locale}
            value={fleet?.requirements}
            type="textarea"
            wide
          />
        </div>
      </section>
      <section className="form-section"><h3>{locale==='de'?'Ihr Betrieb und mögliche Pilotprojekte':'Your operations and potential pilots'}</h3><p>{locale==='de'?'Diese ergänzenden Angaben helfen uns bei der persönlichen Partnersuche. Ungeklärte Punkte können Sie offenlassen und später ergänzen. Bitte keine Daten einzelner Fahrgäste eintragen.':'These optional details help us find suitable partners. You can leave undecided points blank and update them later. Please do not enter individual passenger data.'}</p><div className="form-grid">{fleetQuestions.map(q=><label className="field" style={{gridColumn:"1 / -1"}} key={q.key}>{q[locale]}<textarea name={q.key} defaultValue={fleet?.qualification?.[q.key]||''} rows={3} maxLength={2500}/></label>)}</div></section>
      {!company && !admin && (
        <Checkbox name="consent" locale={locale} text="consentCompany" required />
      )}
    </ActionForm>
  );
}
