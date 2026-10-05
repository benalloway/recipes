import type { APIRoute } from 'astro';
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
    return context.redirect('/login?error=invalid', 303);
  }
  const email = normalizeEmail(String(form.get('email') ?? ''));
  if (!isValidEmail(email)) {
    return context.redirect('/login?error=invalid', 303);
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

  const link = `${context.url.origin}/auth/verify?token=${encodeURIComponent(token)}`;
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
    return context.redirect('/login?error=email', 303);
  }

  return context.redirect('/login?sent=ok', 303);
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
 * Palette duplicates `@theme` in src/styles/global.css (no new colors);
 * keep the hexes in sync if the tokens ever change.
 */
function rateLimitedPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Too many requests — Recipes</title>
<style>body{margin:0;background:#fbfbf9;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}main{max-width:26rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;padding:0 1.5rem}section{background:#fff;border:1px solid #e3e3e0;padding:2.5rem 2rem}.micro{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#8a8a86}h1{font-weight:300;font-size:1.375rem;margin:.75rem 0 0}p{font-size:.9375rem}a{color:#9a8c7c;text-decoration:none}</style>
</head>
<body><main><section>
<p class="micro">429 — Slow down</p>
<h1>Link already sent</h1>
<p>Only one sign-in link per email every 30 seconds. Wait a moment, then try again — or use the link already in your inbox.</p>
<p><a href="/login">← Back to sign in</a></p>
</section></main></body>
</html>`;
}
