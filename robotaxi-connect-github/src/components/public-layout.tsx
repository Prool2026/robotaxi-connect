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
            <Link href={`/${locale}#operators`}>{m.operators}</Link>
            <Link href={`/${locale}#process`}>{m.process}</Link>
            <Link href={`/${locale}#providers`}>{m.providers}</Link>
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
        <Link href={`/${locale}/legal/imprint`}>{m.imprint}</Link>
        <Link href={`/${locale}/legal/privacy`}>{m.privacy}</Link>
        <Link href={`/${locale}/legal/terms`}>{m.terms}</Link>
        <a href={`/${locale}#contact`}>{m.contact}</a>
      </nav>
      <span className="footer-year">
        © {new Date().getFullYear()} {brand.name}
      </span>
    </footer>
  );
}
