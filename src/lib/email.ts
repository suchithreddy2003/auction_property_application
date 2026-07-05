// Resend-backed email sender with a dev fallback that logs to console.
// Keeps the rest of the codebase from importing the SDK directly so we can
// swap to SES or another provider later without touching call sites.

import { emailEnabled, isProd } from '@/lib/env';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type EmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!emailEnabled()) {
    if (!isProd()) {
      console.log('[email:dev]', {
        to: msg.to,
        subject: msg.subject,
        preview: msg.text.slice(0, 200),
      });
    }
    return { ok: true, id: 'dev-no-op' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        reply_to: msg.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
