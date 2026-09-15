import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { localeOf } from '@/lib/domain';
import { safeNext } from '@/lib/validation';
import { appUrl, isConfigured } from '@/lib/env';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const locale = localeOf((await params).locale);
  const query = request.nextUrl.searchParams;
  if (isConfigured()) {
    const db = await supabase();
    const code = query.get('code');
    const token = query.get('token_hash');
    const type = query.get('type');
    const result = code
      ? await db.auth.exchangeCodeForSession(code)
      : token && (type === 'signup' || type === 'recovery' || type === 'email_change')
        ? await db.auth.verifyOtp({ token_hash: token, type })
        : null;
    if (result && !result.error)
      return NextResponse.redirect(
        `${appUrl()}${safeNext(type === 'recovery' ? 'reset-password' : query.get('next'), locale)}`,
      );
  }
  return NextResponse.redirect(`${appUrl()}/${locale}/login?error=verification`);
}
