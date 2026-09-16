import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { guides, categories, guideUrl } from '@/config/knowledge';
import { localeOf } from '@/lib/domain';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale: lang, slug } = await params; const locale = localeOf(lang);
  const g = guides.find(g => g.slug === slug); if (!g) notFound();
  return { title: g[locale].title, description: g[locale].answer, alternates: { canonical: guideUrl(locale, slug), languages: { de: guideUrl('de', slug), en: guideUrl('en', slug) } }, openGraph: { type: 'article', title: g[locale].title, description: g[locale].answer, url: guideUrl(locale, slug), modifiedTime: g.reviewed } };
}
export default async function GuidePage({ params }: Props) {
  const { locale: lang, slug } = await params; const locale = localeOf(lang); const de = locale === 'de';
  const g = guides.find(g => g.slug === slug); if (!g) notFound(); const copy = g[locale];
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: copy.title, description: copy.answer, dateModified: g.reviewed, inLanguage: locale, mainEntityOfPage: guideUrl(locale, slug), author: { '@type': 'Organization', name: 'Robotaxi Connect', url: 'https://www.robotaxi-connect.de/de/legal/imprint' }, citation: g.sources.map(s => s.url) };
  return <><PublicHeader locale={locale} /><main id="main" className="container guide-page">
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav aria-label={de ? 'Brotkrümelnavigation' : 'Breadcrumb'} className="news-jump"><Link href={`/${locale}`}>Robotaxi Connect</Link><Link href={`/${locale}/wissen`}>{de ? 'Wissen & FAQ' : 'Guides & FAQ'}</Link><span>{categories[locale][g.category]}</span></nav>
    <article><header><p className="eyebrow">{categories[locale][g.category]}</p><h1>{copy.title}</h1><p className="news-video-note">{de ? 'Redaktion' : 'Editorial team'}: <Link href={`/${locale}/legal/imprint`}>Robotaxi Connect</Link> · {de ? 'Quellen zuletzt geprüft' : 'Sources last reviewed'}: <time dateTime={g.reviewed}>{g.reviewed}</time></p></header>
    <div className="guide-answer"><strong>{de ? 'Kurz beantwortet' : 'Short answer'}</strong><p>{copy.answer}</p></div>
    {copy.sections.map(s => <section className="guide-section" key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}
    <section className="guide-section"><h2>{de ? 'Ihre nächsten Schritte' : 'Your next steps'}</h2><ul>{copy.checklist.map(c => <li key={c}>{c}</li>)}</ul></section>
    <section className="guide-section"><h2>{de ? 'Quellen zum Nachlesen' : 'Sources'}</h2><p>{de ? 'Originalquellen zum angegebenen Prüfstand. Herstellerangaben sind keine unabhängige Bestätigung; unsere Planungshinweise sind als Einordnung formuliert.' : 'Original sources as of the review date. Supplier statements are not independent verification; planning suggestions are our assessment.'}</p><ul>{g.sources.map(s => <li key={s.url}><a className="text-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul><details><summary>{de ? 'Redaktioneller Verlauf' : 'Editorial history'}</summary><p>2026-09-16 · {de ? 'Erstveröffentlichung vorbereitet; Primärquellen recherchiert.' : 'Initial edition prepared; primary sources researched.'}</p>{g.history?.map(entry => <p key={entry.date + entry.de}>{entry.date} · {entry[locale]}</p>)}</details></section>
    </article><aside className="guide-section"><h2>{de ? 'Weitere Fragen' : 'Related questions'}</h2>{guides.filter(x => x.slug !== slug).map(x => <p key={x.slug}><Link className="text-link" href={`/${locale}/wissen/${x.slug}`}>{x[locale].title} ↗</Link></p>)}<p><Link className="text-link" href={`/${locale}/developments`}>{de ? 'Zum Nachrichten- und Videoarchiv' : 'News and video archive'} ↗</Link></p></aside>
    <div className="guide-answer"><h2>{de ? 'Ihr Unternehmen einordnen' : 'Discuss your business'}</h2><p>{de ? 'Robotaxi Connect begleitet die persönliche Kontaktvermittlung. Wir verkaufen keine Fahrzeuge und erteilen keine Betriebsgenehmigungen.' : 'Robotaxi Connect facilitates personal business introductions. We do not sell vehicles or issue operating permits.'}</p><a className="button primary" href="mailto:info@robotaxi-connect.de">{de ? 'Persönlich Kontakt aufnehmen' : 'Get in touch'}</a></div>
  </main><PublicFooter locale={locale} /></>;
}
