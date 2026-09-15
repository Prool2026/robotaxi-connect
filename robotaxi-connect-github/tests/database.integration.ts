import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';
import { getSupabaseConfig } from '../src/lib/env';
nextEnv.loadEnvConfig(process.cwd(), true);
test('real local Supabase Auth, registration and REST tenant boundaries', async () => {
  const config = getSupabaseConfig();
  if (
    process.env.ROBOTAXI_TEST_DATABASE !== 'true' ||
    !['localhost', '127.0.0.1'].includes(new URL(config.url).hostname)
  )
    throw new Error(
      'Run ONLY against a disposable local Supabase instance with ROBOTAXI_TEST_DATABASE=true.',
    );
  const secret = process.env.ROBOTAXI_SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Missing test service key');
  const admin = createClient(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const clients = [];
  assert.equal((await admin.rpc('robotaxi_identity')).data, 'robotaxi-connect/v1');
  for (const suffix of ['a', 'b']) {
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const email = `robotaxi-test-${crypto.randomUUID()}-${suffix}@example.test`;
    const password = crypto.randomUUID();
    const signup = await client.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: 'Integration', last_name: 'Test', locale: 'de', role: 'ADMIN' },
      },
    });
    assert.equal(signup.error, null);
    assert.ok(signup.data.user);
    assert.equal(signup.data.session, null);
    assert.ok((await client.auth.signInWithPassword({ email, password })).error);
    assert.equal(
      (await admin.auth.admin.updateUserById(signup.data.user.id, { email_confirm: true })).error,
      null,
    );
    assert.equal((await client.auth.signInWithPassword({ email, password })).error, null);
    const profile = await client.from('profiles').select('role').single();
    assert.equal(profile.data?.role, 'COMPANY_USER');
    const registered = await client.rpc('save_company', {
      input: {
        name: `Integration ${suffix}`,
        street: 'Test',
        house_number: '1',
        postal_code: '10115',
        city: 'Berlin',
        country: 'DE',
        phone: '000000',
        company_type: 'TAXI',
        website: '',
        current_vehicles: 38,
        potential_vehicles: 12,
        timeline: 'OPEN',
        requirements: '',
        locale: 'de',
        consent: true,
        legal_version: 'TEST',
      },
    });
    assert.equal(registered.error, null);
    assert.ok(registered.data);
    clients.push({ client, id: registered.data as string });
  }
  for (const [current, other] of [
    [clients[0], clients[1]],
    [clients[1], clients[0]],
  ]) {
    assert.equal((await current.client.from('companies').select('*')).data?.length, 1);
    assert.equal(
      (await current.client.from('companies').select('*').eq('id', other.id)).data?.length,
      0,
    );
    assert.equal(
      (await current.client.from('fleet_profiles').select('*').eq('company_id', other.id)).data
        ?.length,
      0,
    );
    assert.ok((await current.client.rpc('approve_company', { cid: current.id })).error);
    assert.ok(
      (await current.client.from('profiles').update({ role: 'ADMIN' }).eq('role', 'COMPANY_USER'))
        .error,
    );
    await current.client.auth.signOut();
  }
  // Intentionally no hard deletion of audited business history. Discard the local test stack after the run.
});
