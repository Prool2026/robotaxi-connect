import { AuthScreen } from '@/components/auth-screen';
import { requireIdentity } from '@/lib/auth';
import { localeOf } from '@/lib/domain';
export default async function Reset({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  await requireIdentity(locale);
  return <AuthScreen locale={locale} mode="reset" />;
}
