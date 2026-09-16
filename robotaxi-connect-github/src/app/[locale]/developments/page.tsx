import Link from 'next/link';
import { VideoAnalysis } from '@/components/video-analysis';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { editions } from '@/config/developments';
import { localeOf } from '@/lib/domain';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const de = (await params).locale === 'de';
  return { title: `${de ? 'Die neuesten Entwicklungen' : 'Latest developments'} | Robotaxi Connect`, description: de ? 'Robotaxi-Entwicklungen, Quellen und Einordnung für Taxi- und Flottenunternehmen in Europa.' : 'Robotaxi developments, sources and context for European fleet operators.' };
}
export default async function Developments({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const de = locale === 'de';
  const sorted = [...editions].sort((a, b) => b.date.localeCompare(a.date));
  const date = (value: string) => new Intl.DateTimeFormat(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  return <><PublicHeader locale={locale} /><main id="main" className="container developments-page">
    <section className="news-hero">
      <div><p className="eyebrow">ROBOTAXI CONNECT · {de ? 'WISSEN & ORIENTIERUNG' : 'INSIGHTS & CONTEXT'}</p>
        <h1>{de ? 'Die neuesten Entwicklungen' : 'Latest developments'}</h1>
        <p>{de ? 'Was bewegt die autonome Mobilität – und was bedeutet das für Ihr Unternehmen in Europa? Fakten, Videos und Perspektiven auf einen Blick.' : 'What is changing in autonomous mobility, and what does it mean for your business in Europe? Facts, videos and perspectives in one place.'}</p>
        <a className="button primary" href="#updates">{de ? 'Entwicklungen ansehen' : 'Explore developments'} <ArrowUpRight size={16} /></a>
      </div>
      <aside className="news-stamp"><Globe2 size={48} strokeWidth={1} /><p className="eyebrow">{de ? 'EUROPA IM FOKUS' : 'EUROPE IN FOCUS'}</p><strong>{de ? 'Fakten vor Prognosen.' : 'Facts before forecasts.'}</strong><p>{de ? 'Letzte redaktionelle Prüfung' : 'Last editorial review'}<br /><time dateTime={sorted[0].date}>{date(sorted[0].date)}</time></p></aside>
    </section>
    <nav className="news-jump" aria-label={de ? 'Themen' : 'Topics'}><a href="#updates">{de ? 'Hersteller & Anbieter' : 'Manufacturers & providers'}</a><a href="#videos">Videos</a><a href="#archive">{de ? 'Archiv' : 'Archive'}</a></nav>
    <section id="updates"><p className="eyebrow">{de ? 'MARKTÜBERBLICK' : 'MARKET OVERVIEW'}</p><h2>{de ? 'Wer entwickelt was?' : 'Who is building what?'}</h2><p className="news-intro">{de ? 'Eine kuratierte Auswahl. Quellen können älter als die Ausgabe sein; ihre Daten stehen an jedem Beitrag. Ankündigungen sind keine Zusage zur Verfügbarkeit.' : 'A curated selection. Sources may predate this edition; dates are shown with each item. Announcements do not guarantee availability.'}</p>
    {sorted.map((edition, index) => <section key={edition.date} id={`edition-${edition.date}`} className="news-edition"><h3>{index === 0 ? (de ? 'Aktuelle Ausgabe' : 'Current edition') : (de ? 'Archivierte Ausgabe' : 'Archived edition')} · {date(edition.date)}</h3><div className="news-grid">{edition.items.map(item => { const copy = item[locale]; return <article className="news-card" id={`${edition.date}-${item.id}`} key={item.id}><div className="news-tags"><span>{item.region}</span><span>{copy.status}</span></div><p className="eyebrow">{item.company}</p><h3>{copy.title}</h3><p>{copy.fact}</p><div className="news-context"><h4>{de ? 'Einordnung für Europa' : 'European context'}</h4><p>{copy.europe}</p><h4>{de ? 'Für Ihre Flotte · unsere Einschätzung' : 'For your fleet · our assessment'}</h4><p>{copy.takeaway}</p></div><div className="news-source"><a href={item.source} target="_blank" rel="noopener noreferrer">{item.sourceLabel} ↗</a><small>{item.sourceDate ? `${de ? 'Quellenstand' : 'Source date'}: ${date(item.sourceDate)}` : (de ? 'Undatierte Seite' : 'Undated page')} · {de ? 'Geprüft' : 'Reviewed'}: {date(edition.date)}</small><Link href={`/${locale}/developments#${edition.date}-${item.id}`}>{de ? 'Beitragslink' : 'Permalink'}</Link></div></article>; })}</div></section>)}
    </section>
    <VideoAnalysis locale={locale} />
    <section id="archive" className="news-archive news-section"><div><p className="eyebrow">{de ? 'WISSEN BEWAHREN' : 'KEEPING A RECORD'}</p><h2>{de ? 'Das Archiv' : 'The archive'}</h2><p>{de ? 'Jede Ausgabe bleibt mit ihrem damaligen Wissensstand auffindbar. Neuere Entwicklungen erhalten eine neue Ausgabe.' : 'Each edition preserves its knowledge at the time. New developments appear in a new edition.'}</p></div><div>{sorted.map(edition => <a key={edition.date} href={`#edition-${edition.date}`}>{date(edition.date)} <span>{edition.items.length} {de ? 'Beiträge' : 'articles'} ↗</span></a>)}</div></section>
  </main><PublicFooter locale={locale} /></>;
}
