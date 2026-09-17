import { AuthScreen } from '@/components/auth-screen';
import { localeOf } from '@/lib/domain';
export default async function Register({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{type?:string}> }) {
  return <AuthScreen locale={localeOf((await params).locale)} mode="register" accountType={(await searchParams).type==='technology'?'technology':'taxi'} />;
}
