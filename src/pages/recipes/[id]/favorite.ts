import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapters/db';
import { recipeNotFoundPage } from '../../../lib/not-found';
import { toggleFavorite } from '../../../lib/recipes';

/**
 * Favorite toggle: form post, no fields (id from path). Null from the
 * toggle means missing / not owned / deleted — all read as 404.
 * Success 303s back to the same-origin referer, else the detail page
 * (never redirect to a foreign origin).
 */
export const POST: APIRoute = async (context) => {
  const session = context.locals.session;
  if (!session) {
    return context.redirect('/login', 302);
  }
  const id = Number(context.params.id);
  const db = getDb(context.locals);
  const next = await toggleFavorite(db, session.userId, id);
  if (next === null) {
    return new Response(recipeNotFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const referer = context.request.headers.get('referer');
  let target = `/recipes/${id}`;
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === context.url.origin) {
        target = url.pathname + url.search + url.hash;
      }
    } catch {
      // Malformed referer — fall through to the detail page.
    }
  }
  return context.redirect(target, 303);
};
