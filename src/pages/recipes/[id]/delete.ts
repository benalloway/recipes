import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapters/db';
import { softDelete } from '../../../lib/recipes';

/**
 * Recipe delete: form post, no fields (id from path). Null from
 * `softDelete` means missing / not owned / already deleted — all read
 * as 404. Success 303s to the dashboard. No `?error=` codes: 404 is the
 * only failure mode.
 */
export const POST: APIRoute = async (context) => {
  const session = context.locals.session;
  if (!session) {
    return context.redirect('/login', 302);
  }
  const id = Number(context.params.id);
  const db = getDb(context.locals);
  const deleted = await softDelete(db, session.userId, id);
  if (deleted === null) {
    return new Response(notFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return context.redirect('/', 303);
};

/**
 * Self-contained 404 page — same style as the 404 in
 * `src/pages/recipes/[id]/favorite.ts`. Palette duplicates `@theme` in
 * src/styles/global.css (no new colors); keep the hexes in sync.
 */
function notFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Not found — Recipes</title>
<style>body{margin:0;background:#fbfbf9;color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}main{max-width:26rem;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;padding:0 1.5rem}section{background:#fff;border:1px solid #e3e3e0;padding:2.5rem 2rem}.micro{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#8a8a86}h1{font-weight:300;font-size:1.375rem;margin:.75rem 0 0}p{font-size:.9375rem}a{color:#9a8c7c;text-decoration:none}</style>
</head>
<body><main><section>
<p class="micro">404 — Not found</p>
<h1>Not found</h1>
<p>That recipe does not exist, was deleted, or belongs to someone else.</p>
<p><a href="/">← Back to recipes</a></p>
</section></main></body>
</html>`;
}
