import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationEnabled } from '../src/lib/env';
test('released registration requires configuration and honours the operational pause', () => {
  const keys = ['NODE_ENV','ROBOTAXI_SUPABASE_URL','ROBOTAXI_SUPABASE_PROJECT_REF','ROBOTAXI_SUPABASE_PUBLISHABLE_KEY','ROBOTAXI_REGISTRATION_PAUSED','ROBOTAXI_LEGAL_READY'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, { NODE_ENV:'production', ROBOTAXI_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst', ROBOTAXI_SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co', ROBOTAXI_SUPABASE_PUBLISHABLE_KEY:'test-key', ROBOTAXI_LEGAL_READY:'false' });
    delete process.env.ROBOTAXI_REGISTRATION_PAUSED;
    assert.equal(registrationEnabled(), true);
    process.env.ROBOTAXI_REGISTRATION_PAUSED='true';
    assert.equal(registrationEnabled(), false);
    process.env.ROBOTAXI_REGISTRATION_PAUSED='false';
    delete process.env.ROBOTAXI_SUPABASE_PUBLISHABLE_KEY;
    assert.equal(registrationEnabled(), false);
  } finally {
    for (const key of keys) { if(previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
