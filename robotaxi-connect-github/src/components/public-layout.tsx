import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { brand } from '@/config/brand';
import type { Locale } from '@/lib/domain';
import { messages } from '@/i18n/messages';
import { LocaleSwitch } from './locale-switch';
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? 'brand-small' : ''}`}>
      <img src={brand.logo} width="44" height="44" alt="" />
      <span>{brand.name}</span>
    </span>
  );
}
export function PublicHeader({ locale }: { locale: Locale }) {
  const m = messages[locale];
  return (
    <>
      <a className="skip-link" href="#main">
        {m.skip}
      </a>
      <header className="public-header">
        <div className="container header-inner">
          <Link href={`/${locale}`} aria-label={brand.name}>
            <Brand />
          </Link>
          <nav className="public-nav" aria-label={m.overview}>
            <Link href={`/${locale}/taxiunternehmen`}>{locale === 'de' ? 'Für Taxiunternehmen' : 'For taxi businesses'}</Link>
            <Link href={`/${locale}/wissen`}>{locale === 'de' ? 'Wissen & FAQ' : 'Guides & FAQ'}</Link>
            <Link href={`/${locale}/technologieunternehmen`}>{m.providers}</Link>
            <Link href={`/${locale}/developments`}>{locale === 'de' ? 'Die neuesten Entwicklungen' : 'Latest developments'}</Link>
          </nav>
          <div className="header-actions">
            <LocaleSwitch locale={locale} />
            <Link className="login-link" href={`/${locale}/login`}>
              {m.login}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>
      <nav className="mobile-news-nav" aria-label={locale === 'de' ? 'Aktuelles' : 'News'}>
        <Link href={`/${locale}/taxiunternehmen`}>{locale === 'de' ? 'Für Taxiunternehmen' : 'For taxi businesses'} <ArrowUpRight size={14} /></Link>
        <Link href={`/${locale}/technologieunternehmen`}>{m.providers} <ArrowUpRight size={14} /></Link>
        <Link href={`/${locale}/wissen`}>{locale === 'de' ? 'Wissen & FAQ' : 'Guides & FAQ'} <ArrowUpRight size={14} /></Link>
        <Link href={`/${locale}/developments`}>{locale === 'de' ? 'Die neuesten Entwicklungen' : 'Latest developments'} <ArrowUpRight size={14} /></Link>
      </nav>
    </>
  );
}
export function PublicFooter({ locale }: { locale: Locale }) {
  const m = messages[locale];
  return (
    <footer className="public-footer container">
      <div>
        <Link href={`/${locale}`}>
          <Brand />
        </Link>
        <p>{m.copyright}</p>
      </div>
      <nav aria-label={m.imprint}>
        <Link href={`/${locale}/wissen`}>{locale === 'de' ? 'Wissen & FAQ' : 'Guides & FAQ'}</Link>
        <Link href={`/${locale}/legal/imprint`}>{m.imprint}</Link>
        <Link href={`/${locale}/legal/privacy`}>{m.privacy}</Link>
        <Link href={`/${locale}/legal/terms`}>{m.terms}</Link>
        <a href="mailto:info@robotaxi-connect.de">{m.contact}</a>
      </nav>
      <span className="footer-year">
        © {new Date().getFullYear()} {brand.name}
      </span>
    </footer>
  );
}
