'use client';
import { useParams } from 'next/navigation';
import { localeOf } from '@/lib/domain';
import { messages } from '@/i18n/messages';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const locale = localeOf(useParams().locale);
  const m = messages[locale];
  return (
    <main className="narrow-page">
      <h1>{m.unavailable}</h1>
      <p>{m.error}</p>
      <button className="button primary" onClick={reset}>
        {m.continue}
      </button>
      <a className="button secondary" href={`/${locale}`}>
        {m.back}
      </a>
    </main>
  );
}
