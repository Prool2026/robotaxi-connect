import 'server-only';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
const buckets = new Map<string, { count: number; expires: number }>();
// Local abuse brake; Supabase Auth's project-level rate limits remain authoritative.
export async function authRateLimit(scope: string) {
  const h = await headers();
  const address = (h.get('x-forwarded-for') || 'local').split(',').at(-1)!.trim();
  const key = createHash('sha256').update(`${scope}:${address}`).digest('hex');
  const now = Date.now();
  for (const [k, v] of buckets) if (v.expires < now) buckets.delete(k);
  if (buckets.size > 10000) throw new Error('RATE_LIMITED');
  const bucket = buckets.get(key) || { count: 0, expires: now + 15 * 60 * 1000 };
  bucket.count++;
  buckets.set(key, bucket);
  if (bucket.count > 12) throw new Error('RATE_LIMITED');
}
