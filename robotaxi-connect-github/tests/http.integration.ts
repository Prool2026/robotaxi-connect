import { test } from 'node:test';
import assert from 'node:assert/strict';
const origin = process.env.ROBOTAXI_HTTP_URL || 'http://127.0.0.1:3101';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw new Error('HTTP checks are local-only.');
test('production HTTP routes, authentication gates and headers without credentials', async (t) => {
  await t.test('German and English documents carry correct lang and nonce CSP', async () => {
    for (const lang of ['de', 'en']) {
      const r = await fetch(`${origin}/${lang}`);
      assert.equal(r.status, 200);
      const html = await r.text();
      assert.ok(html.includes(`lang="${lang}"`));
      assert.ok(html.includes(lang === 'de' ? 'Ihre Flotte.' : 'Your fleet.'));
      assert.match(r.headers.get('content-security-policy') || '', /nonce-/);
      assert.equal(r.headers.get('x-frame-options'), 'DENY');
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.match(r.headers.get('cache-control') || '', /no-store/);
      assert.ok(!html.includes('DEMO ·'));
    }
  });
  await t.test('protected routes deny anonymous access in both languages', async () => {
    for (const route of [
      '/de/admin',
      '/en/admin/companies',
      '/de/portal',
      '/en/portal/contracts',
      '/de/register/company',
    ]) {
      const r = await fetch(origin + route);
      assert.equal(new URL(r.url).pathname, route.startsWith('/en') ? '/en/login' : '/de/login');
    }
    assert.equal(
      (await fetch(`${origin}/api/documents/00000000-0000-4000-8000-000000000001`)).status,
      401,
    );
    assert.equal((await fetch(`${origin}/api/export`)).status, 401);
  });
  await t.test('production demo stays disabled and invalid locales return 404', async () => {
    assert.equal((await fetch(`${origin}/de/demo/admin`)).status, 404);
    assert.equal((await fetch(`${origin}/fr`)).status, 404);
  });
  await t.test('process is healthy but deployment is not ready without credentials', async () => {
    assert.equal((await fetch(`${origin}/api/health`)).status, 200);
    assert.equal((await fetch(`${origin}/api/ready`)).status, 503);
  });
});
