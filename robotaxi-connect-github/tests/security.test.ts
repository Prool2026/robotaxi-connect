import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin } from '../src/lib/domain';
import { getSupabaseConfig, isDemo } from '../src/lib/env';
import { credentialsSchema, referralSchema, validateUpload, safeNext } from '../src/lib/validation';
test('roles fail closed for company, provider, and unknown roles', () => {
  assert.equal(isAdmin('ADMIN'), true);
  assert.equal(isAdmin('ADMIN_EMPLOYEE'), true);
  for (const role of ['COMPANY_USER', 'PROVIDER_USER', 'admin', '', 'SUPER_ADMIN'])
    assert.equal(isAdmin(role), false);
});
test('Robotaxi never falls back to PAN environment names', () => {
  assert.throws(
    () =>
      getSupabaseConfig({
        PUBLIC_SUPABASE_URL: 'https://pan.supabase.co',
        PUBLIC_SUPABASE_ANON_KEY: 'x',
      }),
    /MISSING/,
  );
  assert.throws(
    () =>
      getSupabaseConfig({
        ROBOTAXI_SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
        ROBOTAXI_SUPABASE_PUBLISHABLE_KEY: 'x',
        ROBOTAXI_SUPABASE_PROJECT_REF: 'bbbbbbbbbbbbbbbbbbbb',
      }),
    /MISMATCH/,
  );
  assert.throws(
    () =>
      getSupabaseConfig({
        NODE_ENV: 'production',
        ROBOTAXI_SUPABASE_URL: 'http://localhost:55321',
        ROBOTAXI_SUPABASE_PUBLISHABLE_KEY: 'x',
        ROBOTAXI_SUPABASE_PROJECT_REF: 'local',
      }),
    /HTTPS/,
  );
});
test('production cannot enable demo', () => {
  assert.equal(isDemo({ NODE_ENV: 'production', ROBOTAXI_DEMO: 'true' }), false);
});
test('password policy, redirect allowlist and file signatures', () => {
  assert.equal(
    credentialsSchema.safeParse({ email: 'user@company.test', password: 'short' }).success,
    false,
  );
  assert.equal(safeNext('https://evil.example', 'de'), '/de/portal');
  assert.equal(safeNext('//evil.example', 'en'), '/en/portal');
  assert.equal(safeNext('reset-password', 'en'), '/en/reset-password');
  assert.throws(() =>
    validateUpload(new TextEncoder().encode('<script>alert(1)</script>'), 'application/pdf'),
  );
  assert.equal(
    validateUpload(new TextEncoder().encode('%PDF-1.7\nhello'), 'application/pdf', true),
    'pdf',
  );
  assert.throws(() => validateUpload(new Uint8Array(10485761), 'application/pdf'));
});
test('referral rejects forged IDs, empty disclosure and conflicting commissions', () => {
  const valid = {
    request_id: crypto.randomUUID(),
    company_id: crypto.randomUUID(),
    provider_id: crypto.randomUUID(),
    provider_contact_id: crypto.randomUUID(),
    estimated_vehicles: 12,
    desired_start: '2028-01-01',
    shared_fields: ['name'],
    customer_visible: false,
    customer_protection_months: 12,
    commission_initial: 5,
    commission_recurring: 0,
    commission_fixed: 0,
    currency: 'EUR',
    internal_notes: '',
  };
  assert.equal(referralSchema.safeParse(valid).success, true);
  assert.equal(referralSchema.safeParse({ ...valid, commission_fixed: 500 }).success, false);
  assert.equal(referralSchema.safeParse({ ...valid, shared_fields: [] }).success, false);
  assert.equal(referralSchema.safeParse({ ...valid, company_id: 'foreign' }).success, false);
});
