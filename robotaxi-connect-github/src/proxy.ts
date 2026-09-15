import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isConfigured } from '@/lib/env';
import { assertDatabaseIdentity } from '@/lib/supabase/identity';
export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'${process.env.NODE_ENV !== 'production' ? ' ws: wss:' : ''}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
  headers.set('x-nonce', nonce);
  headers.set('x-robotaxi-locale', request.nextUrl.pathname.split('/')[1] === 'en' ? 'en' : 'de');
  headers.set('Content-Security-Policy', csp);
  let response = NextResponse.next({ request: { headers } });
  if (
    isConfigured() &&
    request.cookies.getAll().some((c) => c.name.startsWith('robotaxi-auth')) &&
    !request.nextUrl.pathname.startsWith('/api/health')
  ) {
    const config = getSupabaseConfig();
    await assertDatabaseIdentity(config);
    const client = createServerClient(config.url, config.key, {
      cookieOptions: {
        name: 'robotaxi-auth',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          headers.set('cookie', request.cookies.toString());
          response = NextResponse.next({ request: { headers } });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await client.auth.getUser();
  }
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'] };
