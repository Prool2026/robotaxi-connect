import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { localeOf, isAdmin } from '@/lib/domain';
import { messages } from '@/i18n/messages';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { CompanyForm } from '@/components/company-form';
export default async function CompanyRegistration({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  const m = messages[locale];
  const identity = await requireIdentity(locale);
  if (isAdmin(identity.profile.role)) redirect(`/${locale}/admin`);
  if (identity.profile.role === 'PROVIDER_USER') redirect(`/${locale}/anbieter`);
  const { data } = await identity.db
    .from('company_members')
    .select('company_id')
    .eq('user_id', identity.user.id)
    .maybeSingle();
  if (data) redirect(`/${locale}/portal`);
  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main" className="narrow-page onboarding">
        <p className="eyebrow">{m.companyStep}</p>
        <h1>{m.companyTitle}</h1>
        <p>{m.companyBody}</p>
        <CompanyForm locale={locale} />
        <a href={`/${locale}/konto`}>{locale === 'de' ? 'Mein Konto: Passwort, Kontaktdaten und Löschung' : 'My account: password, contact details and deletion'}</a>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
