import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Building2,
  LayoutDashboard,
  CarFront,
  GitBranch,
  FileText,
  FolderOpen,
  UserRound,
  UsersRound,
  Network,
  Activity,
  Settings2,
  LogOut,
  LockKeyhole,
  CircleHelp,
} from 'lucide-react';
import { Brand } from './public-layout';
import { LocaleSwitch } from './locale-switch';
import { logoutAction } from '@/app/actions/auth';
import { label, messages, type MessageKey } from '@/i18n/messages';
import type { Locale } from '@/lib/domain';
export function Workspace({
  locale,
  admin = false,
  demo = false,
  active = '',
  name,
  children,
}: {
  locale: Locale;
  admin?: boolean;
  demo?: boolean;
  active?: string;
  name: string;
  children: React.ReactNode;
}) {
  const m = messages[locale];
  const base = `/${locale}/${demo ? 'demo/' : ''}${admin ? 'admin' : 'portal'}`;
  const nav: [string, MessageKey, typeof LayoutDashboard][] = admin
    ? [
        ['', 'dashboard', LayoutDashboard],
        ['companies', 'companies', Building2],
        ['contacts', 'contacts', UsersRound],
        ['providers', 'providerManagement', Network],
        ['referrals', 'referrals', GitBranch],
        ['contracts', 'contracts', FileText],
        ['documents', 'documents', FolderOpen],
        ['activities', 'activities', Activity],
        ['settings', 'settings', Settings2],
      ]
    : [
        ['', 'overview', LayoutDashboard],
        ['profile', 'profile', Building2],
        ['fleet', 'fleet', CarFront],
        ['referrals', 'referrals', GitBranch],
        ['contracts', 'contracts', FileText],
        ['documents', 'documents', FolderOpen],
        ['account', 'account', UserRound],
      ];
  return (
    <div className="workspace-layout">
      <a className="skip-link" href="#main">
        {m.skip}
      </a>
      <aside className="sidebar">
        <Link className="brand-link" href={`/${locale}`}>
          <Brand small />
        </Link>
        <p className="eyebrow">{m.workspace}</p>
        <nav aria-label={admin ? m.admin : m.portal}>
          {nav.map(([path, key, Icon]) => (
            <Link
              key={path}
              className="nav-item"
              href={`${base}${path ? '/' + path : ''}`}
              aria-current={active === path ? 'page' : undefined}
            >
              <Icon size={17} />
              {m[key]}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <small>{admin ? m.admin : m.portal}</small>
          <strong>{name}</strong>
          <Link className="logout-button" href={`/${locale}#contact`}>
            <CircleHelp size={15} />
            {m.contact}
          </Link>
        </div>
      </aside>
      <div className="workspace-content">
        {demo && (
          <div className="demo-banner">
            {m.demo} · {m.demoReadOnly}
          </div>
        )}
        <header className="workspace-topbar">
          <span>
            <LockKeyhole size={13} />
            {admin ? m.admin : m.portal}
            <ArrowRight size={11} />
            {m[nav.find((n) => n[0] === active)?.[1] || 'overview']}
          </span>
          <div>
            <LocaleSwitch locale={locale} />
            {!demo && (
              <form action={logoutAction.bind(null, locale)}>
                <button className="logout-button" aria-label={m.logout}>
                  <LogOut size={15} />
                </button>
              </form>
            )}
            <span className="avatar" aria-label={name}>
              {initials(name)}
            </span>
          </div>
        </header>
        <main id="main" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}
export function Badge({ value, locale }: { value: string; locale: Locale }) {
  return (
    <span className="badge" data-status={value}>
      {label(locale, value)}
    </span>
  );
}
export function PageHeading({
  title,
  body,
  eyebrow,
  children,
}: {
  title: string;
  body?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {body && <p>{body}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function Panel({
  title,
  children,
  link,
}: {
  title?: string;
  children: React.ReactNode;
  link?: { label: string; href: string };
}) {
  return (
    <section className="panel">
      {title && (
        <header className="panel-header">
          <h2>{title}</h2>
          {link && (
            <Link href={link.href}>
              {link.label}
              <ArrowUpRight size={14} />
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
export function Empty({ locale }: { locale: Locale }) {
  const m = messages[locale];
  return (
    <div className="empty">
      <FolderOpen size={31} strokeWidth={1.3} />
      <h3>{m.emptyTitle}</h3>
      <p>{m.emptyBody}</p>
    </div>
  );
}
export function Kpi({
  title,
  value,
  foot,
  featured = false,
  icon: Icon = Building2,
}: {
  title: string;
  value: string | number;
  foot?: string;
  featured?: boolean;
  icon?: typeof Building2;
}) {
  return (
    <div className={`kpi ${featured ? 'kpi-featured' : ''}`}>
      <div className="kpi-title">
        {title}
        <Icon size={15} strokeWidth={1.5} />
      </div>
      <div className="kpi-value">{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}
export function DateText({ value, locale }: { value: string | null; locale: Locale }) {
  return (
    <>
      {value
        ? new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
            timeZone: 'Europe/Berlin',
          }).format(new Date(value))
        : '—'}
    </>
  );
}
export function Money({
  value,
  currency,
  locale,
}: {
  value: number;
  currency: string;
  locale: Locale;
}) {
  return (
    <>
      {new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
        style: 'currency',
        currency,
      }).format(value)}
    </>
  );
}
export function InfoList({
  locale,
  items,
}: {
  locale: Locale;
  items: [string, React.ReactNode][];
}) {
  return (
    <dl className="data-list">
      {items.map(([key, value]) => (
        <div key={key}>
          <dt>{label(locale, key)}</dt>
          <dd>{value === '' ? '—' : (value ?? '—')}</dd>
        </div>
      ))}
    </dl>
  );
}
