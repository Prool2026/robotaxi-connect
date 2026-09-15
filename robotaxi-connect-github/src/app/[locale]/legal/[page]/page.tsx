import { notFound } from 'next/navigation';
import { brand } from '@/config/brand';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { localeOf } from '@/lib/domain';
import { messages } from '@/i18n/messages';
export default async function Legal({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale: lang, page } = await params;
  const locale = localeOf(lang);
  const m = messages[locale];
  const data = {
    privacy: [m.privacy, m.legalPrivacy],
    imprint: [m.imprint, m.legalImprint],
    terms: [m.terms, m.legalTerms],
  }[page];
  if (!data) notFound();
  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main" className="container legal-page">
        <p className="eyebrow">{brand.name}</p>
        <h1>{data[0]}</h1>
        <div className="notice warning">{m.legalPlaceholder}</div>
        <p>{data[1]}</p>
        <p>{brand.legalName || m.notSet}</p>
        {brand.supportEmail && <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>}
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
