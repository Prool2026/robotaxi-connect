import { createClient } from '@supabase/supabase-js';
import { setTimeout } from 'node:timers/promises';
import nextEnv from '@next/env';
import { getSupabaseConfig, appUrl } from '../src/lib/env';
import { createEmailTransport, safeEmailError } from '../src/lib/email/transport';
import type { EmailTemplate } from '../src/lib/email/templates';
import type { Locale } from '../src/lib/domain';

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
const { renderEmail, templateNames } = await import('../src/lib/email/templates');
const config = getSupabaseConfig();
const secret = process.env.ROBOTAXI_SUPABASE_SECRET_KEY;
const from = process.env.ROBOTAXI_EMAIL_FROM;
if (!secret || !from) throw new Error('EMAIL_CONFIGURATION_MISSING');
const db = createClient(config.url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const transport = createEmailTransport();
if ((await db.rpc('robotaxi_identity')).data !== 'robotaxi-connect/v1')
  throw new Error('ROBOTAXI_DATABASE_IDENTITY_MISMATCH');
type Job = {
  id: string;
  recipient: string;
  template: EmailTemplate;
  locale: Locale;
  payload: Record<string, unknown>;
  lock_token: string;
  dedupe_key: string;
};
let stopping = false;
process.on('SIGTERM', () => {
  stopping = true;
});
process.on('SIGINT', () => {
  stopping = true;
});
while (!stopping) {
  const { data, error } = await db.rpc('claim_email_batch', { batch_size: 5 });
  if (error) {
    console.error('EMAIL_QUEUE_UNAVAILABLE');
    await setTimeout(15000);
    continue;
  }
  for (const job of (data || []) as Job[]) {
    const { data: attemptId, error: startError } = await db.rpc('start_email_attempt', {
      log_id: job.id,
      token: job.lock_token,
    });
    if (startError) {
      console.error('EMAIL_LEASE_UNAVAILABLE');
      continue;
    }
    let messageId: string | null = null;
    let failure: string | null = null;
    try {
      if (!templateNames.includes(job.template)) throw new Error('EMAIL_INVALID_RESPONSE');
      const content = renderEmail(job.template, job.locale, job.payload, appUrl());
      messageId = (
        await transport.send({
          to: job.recipient,
          from,
          ...content,
          idempotencyKey: job.dedupe_key,
        })
      ).messageId;
    } catch (error) {
      failure = safeEmailError(error);
    }
    const { error: finishError } = await db.rpc('finish_email_attempt', {
      log_id: job.id,
      token: job.lock_token,
      attempt_id: attemptId,
      message_id: messageId,
      failure,
    });
    if (finishError) console.error('EMAIL_COMPLETION_UNAVAILABLE');
  }
  if (process.argv.includes('--once')) break;
  if (!stopping) await setTimeout(15000);
}
