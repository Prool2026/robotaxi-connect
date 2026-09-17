import Link from 'next/link';
import { CarFront, Cpu, ShieldCheck } from 'lucide-react';
import { brand } from '@/config/brand';
import { PublicHeader, PublicFooter } from './public-layout';
import { ActionForm } from './action-form';
import { Field, Checkbox } from './fields';
import { authAction } from '@/app/actions/auth';
import { messages } from '@/i18n/messages';
import { isConfigured, registrationEnabled } from '@/lib/env';
import type { Locale } from '@/lib/domain';
export function AuthScreen({
  locale,
  mode,
  accountType = 'taxi',
}: {
  locale: Locale;
  mode: 'register' | 'login' | 'forgot' | 'reset';
  accountType?: 'taxi' | 'technology';
}) {
  const m = messages[locale];
  const register = mode === 'register';
  const reset = mode === 'reset';
  const forgot = mode === 'forgot';
  const enabled = register ? registrationEnabled() : isConfigured();
  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main" className="auth-layout container">
        <aside className="auth-aside auth-connection-aside">
          <p className="eyebrow">{m.eyebrow}</p>
          <h2>{brand.claim[locale]}</h2>
          <div className="connection-diagram" aria-label={locale === 'de' ? 'Robotaxi Connect vermittelt persönlich zwischen Flottenunternehmen und Technologiepartnern.' : 'Robotaxi Connect personally connects fleet operators and technology partners.'}>
            <div className="connection-party"><CarFront size={25} aria-hidden="true"/><div><strong>{locale === 'de' ? 'Taxi- & Flottenunternehmen' : 'Taxi & fleet operators'}</strong><span>{locale === 'de' ? 'Betrieb, Fahrzeuge, Erfahrung' : 'Operations, vehicles, experience'}</span></div></div>
            <div className="connection-line" aria-hidden="true"/>
            <div className="connection-hub"><img src={brand.logo} width="52" height="52" alt=""/><div><span className="connection-caption">{locale === 'de' ? 'DIE PERSÖNLICHE VERBINDUNG' : 'THE PERSONAL CONNECTION'}</span><strong>Robotaxi Connect</strong><span>{locale === 'de' ? 'Verstehen. Passende Partner finden. Zusammenbringen.' : 'Understand. Find the right partners. Connect.'}</span></div></div>
            <div className="connection-line" aria-hidden="true"/>
            <div className="connection-party"><Cpu size={25} aria-hidden="true"/><div><strong>{locale === 'de' ? 'Technologiepartner' : 'Technology partners'}</strong><span>{locale === 'de' ? 'Autonome Systeme & Lösungen' : 'Autonomous systems & solutions'}</span></div></div>
          </div>
          <p>
            <ShieldCheck size={20} />
            {locale === 'de' ? 'Persönlich vermittelt. Vertraulich betreut. Kontaktweitergabe nur nach Zustimmung.' : 'Personal matching. Confidential support. Contact details shared only with approval.'}
          </p>
        </aside>
        <section className="auth-panel">
          <p className="eyebrow">{register ? m.accountStep : m.portal}</p>
          <h1>{register ? (accountType === 'technology' ? (locale === 'de' ? 'Ihr Konto als Technologieunternehmen.' : 'Your technology company account.') : m.registerTitle) : forgot || reset ? m.resetTitle : m.loginTitle}</h1>
          <p>{register ? (accountType === 'technology' ? (locale === 'de' ? 'Legen Sie zunächst Ihr Konto an. Nach der E-Mail-Bestätigung ergänzen Sie Ihr Unternehmensprofil mit Angaben zu Einsatzmöglichkeiten, Fahrzeugen, Voraussetzungen, Schulungen, Genehmigungen und Zusammenarbeit.' : 'Create your account first. After confirming your email, complete your company profile with use cases, vehicles, requirements, training, approvals and partnership details.') : m.registerBody) : forgot ? m.resetBody : m.loginBody}</p>
          {!enabled && (
            <div className="notice warning">
              {!isConfigured() ? m.configurationBody : m.legalNotReady}
            </div>
          )}
          <ActionForm
            action={authAction.bind(null, mode, locale)}
            locale={locale}
            submit={register ? 'continue' : forgot ? 'sendReset' : reset ? 'setPassword' : 'login'}
            disabled={!enabled}
          >
            <div className="form-grid">
              {register && <input type="hidden" name="account_type" value={accountType} />}
              {register && (
                <>
                  <Field name="first_name" locale={locale} required autoComplete="given-name" />
                  <Field name="last_name" locale={locale} required autoComplete="family-name" />
                </>
              )}
              {!reset && (
                <Field
                  name="email"
                  locale={locale}
                  type="email"
                  required
                  wide
                  autoComplete="email"
                  max={254}
                />
              )}{' '}
              {!forgot && (
                <Field
                  name="password"
                  labelKey={reset ? 'newPassword' : 'password'}
                  locale={locale}
                  type="password"
                  required
                  wide
                  hint={register || reset ? 'passwordHint' : undefined}
                  autoComplete={register || reset ? 'new-password' : 'current-password'}
                  max={128}
                />
              )}{' '}
              {(register || reset) && (
                <Field
                  name="confirm_password"
                  labelKey="confirmPassword"
                  locale={locale}
                  type="password"
                  required
                  wide
                  autoComplete="new-password"
                  max={128}
                />
              )}
            </div>
            {register && (
              <>
                <Checkbox name="consent" locale={locale} text="consentAccount" required />
                <div className="legal-links">
                  <Link href={`/${locale}/legal/privacy`}>{m.privacy}</Link>
                  <Link href={`/${locale}/legal/terms`}>{m.terms}</Link>
                </div>
              </>
            )}
          </ActionForm>
          {mode === 'login' && (
            <Link className="subtle-link" href={`/${locale}/forgot-password`}>
              {m.forgotPassword}
            </Link>
          )}
          <div className="auth-bottom">
            {register ? m.hasAccount : m.noAccount}{' '}
            <Link href={`/${locale}/${register ? 'login' : 'register'}`}>
              {register ? m.login : m.register}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
