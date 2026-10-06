import type { APIRoute } from 'astro';
import { getBlobs } from '../../lib/adapters/blobs';
import { getDb } from '../../lib/adapters/db';
import { contentTypeForExtension, sniffImageExtension } from '../../lib/images';
import { recipeNotFoundPage } from '../../lib/not-found';

/**
 * Recipe photo serve: `GET /media/*`. Only the current (head) version's
 * photo is servable — any other key shape, missing / non-owned / deleted
 * recipe, key mismatch, or missing R2 bytes all read as the same
 * recipe 404 (never distinguish). Success serves the bytes with a
 * sniffed Content-Type and a private 1-year cache: these bytes are
 * auth-gated per user, so shared-cache immutability is wrong.
 */
function notFound(): Response {
  return new Response(recipeNotFoundPage(), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Extract the recipe id from a `recipes/<id>/<file>` key, or null when the
 * key does not have that exact shape.
 */
function parseMediaRecipeId(key: string): number | null {
  const parts = key.split('/');
  if (parts.length !== 3 || parts[0] !== 'recipes' || parts[2] === '' || parts[2].includes('..')) {
    return null;
  }
  if (!/^\d+$/.test(parts[1])) return null;
  return Number(parts[1]);
}

export const GET: APIRoute = async (context) => {
  const session = context.locals.session;
  if (!session) {
    return context.redirect('/login', 302);
  }
  const key = context.params.key ?? '';
  const recipeId = parseMediaRecipeId(key);
  if (recipeId === null) {
    return notFound();
  }
  const db = getDb(context.locals);
  const row = await db
    .prepare(
      `SELECT v.image_key AS image_key
       FROM recipes r
       JOIN recipe_versions v ON v.id = r.head_version_id
       WHERE r.id = ? AND r.owner_user_id = ? AND r.deleted_at IS NULL`,
    )
    .bind(recipeId, session.userId)
    .first<{ image_key: string | null }>();
  if (!row || row.image_key !== key) {
    return notFound();
  }
  const object = await getBlobs(context.locals).get(key);
  if (!object) {
    return notFound();
  }
  const bytes = new Uint8Array(await object.arrayBuffer());
  const extension = sniffImageExtension(bytes);
  if (!extension) {
    return notFound();
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentTypeForExtension(extension),
      'Cache-Control': 'private, max-age=3153600',
    },
  });
};
