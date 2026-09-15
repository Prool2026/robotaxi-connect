import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderEmail, renderSupabaseAuthTemplate, templateNames } from '../src/lib/email/templates';
import { ResendTransport, safeEmailError } from '../src/lib/email/transport';
import { de, en } from '../src/i18n/messages';
test('DE/EN dictionaries have complete matching keys', () => {
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
});
test('all transactional templates render both languages without internal information', () => {
  for (const template of templateNames)
    for (const locale of ['de', 'en'] as const) {
      const email = renderEmail(
        template,
        locale,
        {
          referral_id: 'REF-123',
          disclosure: {
            name: '<img src=x onerror=alert(1)>',
            commission_initial: 42,
            internal_notes: 'SECRET',
          },
        },
        'https://example.test',
      );
      assert.ok(email.subject);
      assert.ok(email.text);
      assert.ok(!email.html.includes('SECRET'));
      assert.ok(!email.html.includes('commission_initial'));
      assert.ok(!email.html.includes('<img src=x'));
      if (template === 'referral_provider') assert.ok(email.html.includes('&lt;img'));
    }
  assert.ok(renderSupabaseAuthTemplate('confirmation').includes('.TokenHash'));
  assert.ok(renderSupabaseAuthTemplate('recovery').includes('type=recovery'));
});
test('transport uses stable idempotency key and logs no raw provider error body', async () => {
  const fake: typeof fetch = async (_url, init) => {
    assert.equal((init!.headers as Record<string, string>)['Idempotency-Key'], 'referral:123');
    return new Response(JSON.stringify({ id: 'message-1' }), { status: 200 });
  };
  const transport = new ResendTransport('test-key', fake);
  assert.deepEqual(
    await transport.send({
      to: 'a@example.test',
      from: 'b@example.test',
      subject: 'Test',
      text: 'Test',
      html: '<p>Test</p>',
      idempotencyKey: 'referral:123',
    }),
    { messageId: 'message-1' },
  );
  assert.equal(safeEmailError(new Error('secret address@example.test')), 'EMAIL_TRANSPORT_ERROR');
  assert.equal(safeEmailError(new Error('EMAIL_HTTP_429')), 'EMAIL_HTTP_429');
});
