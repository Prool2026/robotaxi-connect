import { AuthScreen } from '@/components/auth-screen';
import { localeOf } from '@/lib/domain';
export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  return <AuthScreen locale={localeOf((await params).locale)} mode="login" />;
}
