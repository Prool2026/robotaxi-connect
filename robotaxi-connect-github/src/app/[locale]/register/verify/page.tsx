import { MailCheck } from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { ActionForm } from '@/components/action-form';
import { Field } from '@/components/fields';
import { authAction } from '@/app/actions/auth';
import { localeOf } from '@/lib/domain';
import { messages } from '@/i18n/messages';
import { isConfigured } from '@/lib/env';
export default async function Verify({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const m = messages[locale];
  return (
    <>
      <PublicHeader locale={locale} />
      <main id="main" className="narrow-page">
        <MailCheck size={44} strokeWidth={1.3} />
        <h1>{m.checkEmail}</h1>
        <p>{m.checkEmailBody}</p>
        <ActionForm
          action={authAction.bind(null, 'resend', locale)}
          locale={locale}
          submit="resend"
          disabled={!isConfigured()}
        >
          <Field name="email" locale={locale} type="email" required max={254} />
        </ActionForm>
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
