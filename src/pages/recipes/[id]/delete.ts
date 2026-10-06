import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapters/db';
import { recipeNotFoundPage } from '../../../lib/not-found';
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
    return new Response(recipeNotFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return context.redirect('/', 303);
};
