export function getSupabaseConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.ROBOTAXI_SUPABASE_URL;
  const key = env.ROBOTAXI_SUPABASE_PUBLISHABLE_KEY;
  const ref = env.ROBOTAXI_SUPABASE_PROJECT_REF;
  if (!url || !key || !ref) throw new Error('ROBOTAXI_CONFIGURATION_MISSING');
  const parsed = new URL(url);
  const local = ['127.0.0.1', 'localhost'].includes(parsed.hostname);
  if (env.NODE_ENV === 'production' && (local || parsed.protocol !== 'https:'))
    throw new Error('ROBOTAXI_HTTPS_REQUIRED');
  if (!local && parsed.hostname !== `${ref}.supabase.co`)
    throw new Error('ROBOTAXI_PROJECT_MISMATCH');
  if (!local && !/^[a-z]{20}$/.test(ref)) throw new Error('ROBOTAXI_PROJECT_INVALID');
  return { url, key };
}
export function isConfigured() {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
export const isDemo = (env: Record<string, string | undefined> = process.env) =>
  env.NODE_ENV !== 'production' && env.ROBOTAXI_DEMO === 'true';
export function appUrl() {
  const url = new URL(process.env.ROBOTAXI_APP_URL || 'http://localhost:3100');
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
    throw new Error('ROBOTAXI_HTTPS_REQUIRED');
  return url.origin;
}
export const registrationEnabled = () =>
  isConfigured() &&
  (process.env.NODE_ENV !== 'production' || process.env.ROBOTAXI_LEGAL_READY === 'true');
