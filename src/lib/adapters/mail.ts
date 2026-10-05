// @ts-check

/**
 * Mail adapter — the only file that knows about Resend.
 * Runtime config comes from the Worker env binding (`cloudflare:workers`),
 * never `process.env` — Workers don't have one at runtime.
 * (Cloudflare Email Service can replace this with a one-file change
 * when/if the account moves to Workers Paid.)
 */
import { env } from 'cloudflare:workers';

const FROM = 'login@benalloway.com';

/**
 * @param {{ to: string; subject: string; html: string; text?: string }} args
 * @returns {Promise<{ delivered: boolean }>}
 */
export async function sendMail(args) {
  const key = env.RESEND_API_KEY;
  if (!key) {
    // Dev-only fallback (issue #5): log instead of sending so the magic-link
    // flow is testable without #6 (Resend domain/secret wiring). Production
    // always has the secret, so real sends never take this path.
    console.log(
      `[dev-fallback] mail NOT sent (RESEND_API_KEY unset) — to: ${args.to} — subject: ${args.subject}`,
    );
    if (args.text) console.log(`[dev-fallback] body:\n${args.text}`);
    return { delivered: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }

  return { delivered: true };
}
