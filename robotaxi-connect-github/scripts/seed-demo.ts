import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';
import { getSupabaseConfig } from '../src/lib/env';
nextEnv.loadEnvConfig(process.cwd(), true);
const config = getSupabaseConfig();
if (
  process.env.NODE_ENV === 'production' ||
  process.env.ROBOTAXI_ALLOW_DEMO_SEED !== 'true' ||
  !['localhost', '127.0.0.1'].includes(new URL(config.url).hostname)
)
  throw new Error('DEMO_SEED_REQUIRES_EXPLICIT_LOCAL_DEVELOPMENT');
const secret = process.env.ROBOTAXI_SUPABASE_SECRET_KEY;
const password = process.env.ROBOTAXI_DEMO_PASSWORD;
if (!secret || !password || password.length < 12)
  throw new Error('Set ROBOTAXI_SUPABASE_SECRET_KEY and ROBOTAXI_DEMO_PASSWORD (12+ characters).');
const admin = createClient(config.url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
if ((await admin.rpc('robotaxi_identity')).data !== 'robotaxi-connect/v1')
  throw new Error('ROBOTAXI_DATABASE_IDENTITY_MISMATCH');
for (const [email, role] of [
  ['admin@robotaxi-demo.test', 'ADMIN'],
  ['company@robotaxi-demo.test', 'COMPANY_USER'],
] as const) {
  const users = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (users.error) throw new Error('SEED_AUTH_FAILED');
  let user = users.data.users.find((u) => u.email === email);
  if (!user) {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: 'Demo', last_name: 'User', locale: 'de' },
    });
    if (result.error || !result.data.user) throw new Error('SEED_AUTH_FAILED');
    user = result.data.user;
  }
  const { error } = await admin.from('profiles').update({ role }).eq('id', user.id);
  if (error) throw new Error('SEED_ROLE_FAILED');
}
const member = createClient(config.url, config.key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
if ((await member.auth.signInWithPassword({ email: 'company@robotaxi-demo.test', password })).error)
  throw new Error('SEED_LOGIN_FAILED');
const { data: membership, error: memberError } = await member
  .from('company_members')
  .select('company_id')
  .maybeSingle();
if (memberError) throw new Error('SEED_MEMBERSHIP_FAILED');
if (!membership) {
  const { error } = await member.rpc('save_company', {
    input: {
      name: 'Müller Taxi GmbH · Demo',
      street: 'Demostraße',
      house_number: '1',
      postal_code: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      phone: '+49 30 000000',
      website: '',
      company_type: 'TAXI',
      current_vehicles: 38,
      potential_vehicles: 12,
      timeline: '2028',
      requirements: 'Fiktive lokale Entwicklungsdaten.',
      locale: 'de',
      consent: true,
      legal_version: 'DEMO',
    },
  });
  if (error) throw new Error('SEED_COMPANY_FAILED');
}
const operator = createClient(config.url, config.key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
if ((await operator.auth.signInWithPassword({ email: 'admin@robotaxi-demo.test', password })).error)
  throw new Error('SEED_ADMIN_LOGIN_FAILED');
const { data: providers, error: providerError } = await operator
  .from('providers')
  .select('id')
  .eq('name', 'Demo Autonomous Provider');
if (providerError) throw new Error('SEED_PROVIDER_QUERY_FAILED');
if (!providers?.length) {
  const { data: providerId, error } = await operator.rpc('save_admin_record', {
    kind: 'provider',
    input: {
      name: 'Demo Autonomous Provider',
      legal_name: 'Demo Autonomous Provider GmbH',
      website: '',
      country: 'Deutschland',
      solution: 'Fiktive autonome Flottenlösung',
      notes: 'Nur lokale Demo',
      active: true,
    },
  });
  if (error) throw new Error('SEED_PROVIDER_FAILED');
  const contact = await operator.rpc('save_admin_record', {
    kind: 'provider_contact',
    input: {
      provider_id: providerId,
      name: 'Demo Ansprechpartner',
      email: 'provider@robotaxi-demo.test',
      phone: '',
      position: 'Demo',
      locale: 'de',
    },
  });
  if (contact.error) throw new Error('SEED_PROVIDER_CONTACT_FAILED');
}
console.log(
  'Local demo ready: admin@robotaxi-demo.test and company@robotaxi-demo.test. Password: your ROBOTAXI_DEMO_PASSWORD.',
);
