import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  MoveDown,
  Route,
  Layers3,
  ScanLine,
  CarFront,
  Network,
  Check,
  Plus,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { localeOf } from '@/lib/domain';
import { messages } from '@/i18n/messages';
import { isDemo } from '@/lib/env';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const m = messages[locale];
  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" />
              {m.eyebrow}
            </p>
            <h1>
              {m.heroStart}
              <br />
              {m.heroMiddle}
              <br />
              <span>{m.heroEnd}</span>
            </h1>
            <p className="hero-body">{m.heroBody}</p>
            <div className="hero-buttons">
              <Link className="button primary" href={`/${locale}/register`}>
                {m.register}
                <ArrowUpRight size={18} />
              </Link>
              <a className="text-link" href="#providers">
                {m.providers}
                <ArrowRight size={16} />
              </a>
            </div>
            <p className="hero-note">
              <Check size={14} />
              {m.heroNote}
            </p>
          </div>
          <div className="mobility-visual" aria-label={brand.claim[locale]}>
            <div className="visual-top">
              <span className="eyebrow">{m.network}</span>
              <span className="visual-cross">+</span>
            </div>
            <div className="map-grid" aria-hidden="true">
              <svg className="route-map" viewBox="0 0 560 540" fill="none">
                <path
                  d="M-30 112H198Q260 112 260 174V338Q260 400 322 400H600"
                  stroke="#9faa9c"
                  strokeWidth="66"
                />
                <path
                  d="M-30 112H198Q260 112 260 174V338Q260 400 322 400H600"
                  stroke="#d3dace"
                  strokeWidth="62"
                />
                <path
                  d="M-30 112H198Q260 112 260 174V338Q260 400 322 400H600"
                  stroke="#f9fcf7"
                  strokeWidth="1.5"
                  strokeDasharray="10 12"
                />
                <path
                  d="M96 -20V480Q96 504 120 504H580M410 -20V208Q410 237 381 237H-20"
                  stroke="#b6c0b0"
                  strokeWidth="20"
                />
                <path
                  d="M96 -20V480Q96 504 120 504H580M410 -20V208Q410 237 381 237H-20"
                  stroke="#e4e9de"
                  strokeWidth="17"
                />
                <path
                  className="route-highlight"
                  d="M32 112H198Q260 112 260 174V338Q260 400 322 400H496"
                  stroke="#244d3c"
                  strokeWidth="3"
                />
                <circle cx="32" cy="112" r="7" fill="#214a3a" />
                <circle cx="496" cy="400" r="7" fill="#214a3a" />
                <rect x="235" y="219" width="50" height="85" rx="19" fill="#163f35" />
                <rect x="243" y="233" width="34" height="43" rx="10" fill="#c4dbbe" />
                <path d="M247 282h26M246 227h28" stroke="#e3efdc" strokeWidth="2" />
                <circle cx="260" cy="260" r="67" stroke="#477158" strokeOpacity=".25" />
                <circle cx="260" cy="260" r="91" stroke="#477158" strokeOpacity=".12" />
              </svg>
            </div>
            <div className="map-card map-card-one">
              <span className="map-icon">
                <CarFront size={21} />
              </span>
              <div>
                <small>{m.fleetReady}</small>
                <strong>{m.operatorLabel}</strong>
              </div>
              <span className="map-dot" />
            </div>
            <div className="map-card map-card-two">
              <span className="map-icon">
                <ScanLine size={21} />
              </span>
              <div>
                <small>{m.futureReady}</small>
                <strong>{m.providerLabel}</strong>
              </div>
              <span className="map-dot" />
            </div>
            <div className="visual-bottom">
              <div>
                <span className="eyebrow">01 — 03</span>
                <h2>{m.networkTitle}</h2>
              </div>
              <span className="round-arrow">
                <ArrowUpRight size={23} />
              </span>
            </div>
          </div>
        </section>
        <div className="value-strip">
          <div className="container">
            {[m.stripOne, m.stripTwo, m.stripThree].map((s, i) => (
              <span key={s}>
                <small>0{i + 1}</small>
                {s}
                <ArrowUpRight size={17} />
              </span>
            ))}
          </div>
        </div>
        <section id="operators" className="section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{m.operatorsEyebrow}</p>
              <h2>{m.operatorsTitle}</h2>
            </div>
            <p>{m.operatorsBody}</p>
          </div>
          <div className="benefit-grid">
            {[
              [Route, m.benefitOne, m.benefitOneBody],
              [Layers3, m.benefitTwo, m.benefitTwoBody],
              [Network, m.benefitThree, m.benefitThreeBody],
            ].map(([Icon, title, body], i) => {
              const I = Icon as typeof Route;
              return (
                <article className="benefit" key={i}>
                  <I size={28} strokeWidth={1.4} />
                  <span className="card-number">0{i + 1}</span>
                  <h3>{title as string}</h3>
                  <p>{body as string}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section id="process" className="process-section">
          <div className="container">
            <p className="eyebrow">{m.processEyebrow}</p>
            <h2>{m.processTitle}</h2>
            <div className="steps">
              {[
                [m.stepOne, m.stepOneBody],
                [m.stepTwo, m.stepTwoBody],
                [m.stepThree, m.stepThreeBody],
              ].map(([title, body], i) => (
                <article key={title}>
                  <span>0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <Link className="button light" href={`/${locale}/register`}>
              {m.register}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section id="providers" className="section container provider-section">
          <div className="provider-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="orbit-center">
              <Network size={52} strokeWidth={1} />
            </span>
            <span className="orbit-node node-one">
              <CarFront size={24} />
            </span>
            <span className="orbit-node node-two">
              <ScanLine size={24} />
            </span>
            <span className="orbit-node node-three">
              <Route size={24} />
            </span>
          </div>
          <div>
            <p className="eyebrow">{m.providerEyebrow}</p>
            <h2>{m.providerTitle}</h2>
            <p>{m.providerBody}</p>
            <a className="button primary" href="#contact">
              {m.providerCta}
              <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section className="future-section container">
          <MoveDown size={28} strokeWidth={1} />
          <div>
            <p className="eyebrow">{m.futureEyebrow}</p>
            <h2>{m.futureTitle}</h2>
          </div>
          <div>
            <p>{m.futureBody}</p>
            <small>{m.futureNote}</small>
          </div>
        </section>
        <section id="faq" className="section container faq-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>{m.faqTitle}</h2>
          </div>
          <div>
            {[
              [m.faqOne, m.faqOneAnswer],
              [m.faqTwo, m.faqTwoAnswer],
              [m.faqThree, m.faqThreeAnswer],
              [m.faqFour, m.faqFourAnswer],
              [m.faqFive, m.faqFiveAnswer],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="contact" className="contact-section container">
          <div>
            <p className="eyebrow">{m.contact}</p>
            <h2>{m.contactTitle}</h2>
            <p>{m.contactBody}</p>
          </div>
          <div className="contact-actions">
            {brand.supportEmail ? (
              <a className="button light" href={`mailto:${brand.supportEmail}`}>
                {m.providerCta}
                <ArrowUpRight size={18} />
              </a>
            ) : (
              <p className="contact-note">{m.contactUnavailable}</p>
            )}
            <Link className="text-link" href={`/${locale}/register`}>
              {m.register}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        {isDemo() && (
          <div className="container demo-links">
            <span>{m.demo}</span>
            <Link href={`/${locale}/demo/portal`}>
              {m.previewPortal}
              <ArrowUpRight size={16} />
            </Link>
            <Link href={`/${locale}/demo/admin`}>
              {m.previewAdmin}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
