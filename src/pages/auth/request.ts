import type { APIRoute } from 'astro';
import { u } from '../../lib/base';
import { getDb } from '../../lib/adapters/db';
import { sendMail } from '../../lib/adapters/mail';
import {
  EMAIL_RATE_LIMIT_MS,
  createMagicToken,
  deleteMagicToken,
  getOrCreateUserId,
  isValidEmail,
  lastTokenSentAt,
  normalizeEmail,
} from '../../lib/auth';

/** Issue a magic link: validate → rate-limit (1/email/30s) → token → mail. */
export const POST: APIRoute = async (context) => {
  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return context.redirect(u('/login?error=invalid'), 303);
  }
  const email = normalizeEmail(String(form.get('email') ?? ''));
  if (!isValidEmail(email)) {
    return context.redirect(u('/login?error=invalid'), 303);
  }

  const db = getDb(context.locals);

  const lastSent = await lastTokenSentAt(db, email);
  if (lastSent && Date.now() - Date.parse(lastSent) < EMAIL_RATE_LIMIT_MS) {
    return new Response(rateLimitedPage(), {
      status: 429,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const userId = await getOrCreateUserId(db, email);
  const { token } = await createMagicToken(db, userId);

  const link = `${context.url.origin}${u('/auth/verify')}?token=${encodeURIComponent(token)}`;
  try {
    await sendMail({
      to: email,
      subject: 'Sign in to Recipes',
      html: `<p>Sign in to Recipes:</p><p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p><p>This link expires in 15 minutes and can be used once.</p>`,
      text: `Sign in to Recipes:\n\n${link}\n\nThis link expires in 15 minutes and can be used once.`,
    });
  } catch (err) {
    console.error('magic-link send failed', err);
    // Don't leave a live token behind: the user gets an error page, so their
    // immediate retry must not hit the 30s rate-limit trap.
    await deleteMagicToken(db, token).catch((deleteErr) => {
      console.error('magic-link token cleanup failed', deleteErr);
    });
    return context.redirect(u('/login?error=email'), 303);
  }

  return context.redirect(u('/login?sent=ok'), 303);
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Self-contained 429 page — no Tailwind dependency inside endpoint responses.
 * Palette follows the Oatmeal olive tokens in src/styles/global.css;
 * keep the hexes in sync if the tokens ever change.
 */
function rateLimitedPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Too many requests — Recipes</title>
<style>body{margin:0;background:#f2f2ec;color:#23281a;font-family:Inter,system-ui,sans-serif}main{max-width:26rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;padding:0 1.5rem}section{background:#fff;border:1px solid rgba(35,40,26,.1);border-radius:1rem;padding:2.5rem 2rem}.micro{font-size:.875rem;font-weight:600;color:#4a5240}h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:2rem;margin:.5rem 0 0}p{font-size:1rem}a{color:#23281a;font-weight:500}</style>
</head>
<body><main><section>
<p class="micro">429 — Slow down</p>
<h1>Link already sent</h1>
<p>Only one sign-in link per email every 30 seconds. Wait a moment, then try again — or use the link already in your inbox.</p>
<p><a href="${u('/login')}">← Back to sign in</a></p>
</section></main></body>
</html>`;
}
