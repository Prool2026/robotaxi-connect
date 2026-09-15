export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};
export interface EmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}
export class ResendTransport implements EmailTransport {
  constructor(
    private apiKey: string,
    private fetcher: typeof fetch = fetch,
  ) {
    if (!apiKey) throw new Error('EMAIL_CONFIGURATION_MISSING');
  }
  async send(message: EmailMessage) {
    const response = await this.fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': message.idempotencyKey,
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`EMAIL_HTTP_${response.status}`);
    const data = (await response.json()) as { id?: string };
    if (!data.id) throw new Error('EMAIL_INVALID_RESPONSE');
    return { messageId: data.id };
  }
}
export function createEmailTransport(
  env: Record<string, string | undefined> = process.env,
): EmailTransport {
  if ((env.ROBOTAXI_EMAIL_PROVIDER || 'resend') !== 'resend')
    throw new Error('EMAIL_PROVIDER_UNSUPPORTED');
  return new ResendTransport(env.RESEND_API_KEY || '');
}
export function safeEmailError(error: unknown): string {
  if (
    error instanceof Error &&
    /^EMAIL_(HTTP_\d{3}|INVALID_RESPONSE|CONFIGURATION_MISSING|PROVIDER_UNSUPPORTED)$/.test(
      error.message,
    )
  )
    return error.message;
  return 'EMAIL_TRANSPORT_ERROR';
}
