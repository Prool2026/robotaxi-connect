import 'server-only';
import { createClient } from '@supabase/supabase-js';
let verified: { url: string; key: string; until: number } | undefined;
export async function assertDatabaseIdentity(config: { url: string; key: string }) {
  if (verified?.url === config.url && verified.key === config.key && verified.until > Date.now())
    return;
  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc('robotaxi_identity');
  if (error || data !== 'robotaxi-connect/v1')
    throw new Error('ROBOTAXI_DATABASE_IDENTITY_MISMATCH');
  verified = { ...config, until: Date.now() + 60000 };
}
