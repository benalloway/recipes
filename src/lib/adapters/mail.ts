// @ts-check

/**
 * Mail adapter — the only file that knows about Resend.
 * Cloudflare Email Service can replace this with a one-file change
 * when/if the account moves to Workers Paid.
 */
const FROM = 'login@benalloway.com';

/**
 * @param {{ to: string; subject: string; html: string; text?: string }} args
 */
export async function sendMail(args) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');

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
}
