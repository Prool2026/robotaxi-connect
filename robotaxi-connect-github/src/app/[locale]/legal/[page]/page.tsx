import { notFound } from 'next/navigation';
import { brand } from '@/config/brand';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { localeOf } from '@/lib/domain';
import { messages } from '@/i18n/messages';
import { Imprint } from '@/components/imprint';
import { legalContent, legalVersion } from '@/config/legal-content';
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
  const document = page === 'privacy' || page === 'terms' ? legalContent[locale][page] : null;
  return (
    <>
      <PublicHeader locale={locale} />
      {page === 'imprint' ? <Imprint locale={locale} /> : <main id="main" className="container legal-page">
        <p className="eyebrow">{brand.name}</p>
        <h1>{document?.title || data[0]}</h1>
        <p>{document?.intro}</p>
        <p className="legal-version">{locale === 'de' ? 'Stand' : 'Version'}: {legalVersion}</p>
        <nav className="legal-contents" aria-label={locale === 'de' ? 'Inhalt' : 'Contents'}>
          {document?.sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}>{section.title}</a>)}
        </nav>
        {document?.sections.map((section, index) => <section className="legal-section" id={`section-${index + 1}`} key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>)}
        <a href="mailto:info@robotaxi-connect.de">info@robotaxi-connect.de</a>
      </main>}
      <PublicFooter locale={locale} />
    </>
  );
}
