import { getSupabaseConfig, appUrl, registrationEnabled } from '@/lib/env';
import { assertDatabaseIdentity } from '@/lib/supabase/identity';
export async function GET() {
  try {
    appUrl();
    if (!registrationEnabled()) throw new Error('NOT_READY');
    await assertDatabaseIdentity(getSupabaseConfig());
    return Response.json({ status: 'ready' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { status: 'not_ready' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
