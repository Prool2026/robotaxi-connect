import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/env';
import { assertDatabaseIdentity } from './identity';
export async function supabase() {
  const config = getSupabaseConfig();
  await assertDatabaseIdentity(config);
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      name: 'robotaxi-auth',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* Read-only Server Component; proxy refreshes cookies. */
        }
      },
    },
  });
}
