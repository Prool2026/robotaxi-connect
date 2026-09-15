'use client';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/domain';
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const path = usePathname();
  return (
    <div className="locale-switch" aria-label={locale === 'de' ? 'Sprache' : 'Language'}>
      {(['de', 'en'] as const).map((lang) => (
        <a
          key={lang}
          href={path.replace(/^\/(de|en)(?=\/|$)/, `/${lang}`)}
          hrefLang={lang}
          aria-current={locale === lang ? 'true' : undefined}
        >
          {lang.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
