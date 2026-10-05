import type { APIRoute } from 'astro';
import { getDb } from '../../lib/adapters/db';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  consumeMagicToken,
  createSession,
} from '../../lib/auth';

/** Consume a magic link (single-use) → session cookie → dashboard. */
export const GET: APIRoute = async (context) => {
  const db = getDb(context.locals);
  const token = context.url.searchParams.get('token') ?? '';

  const userId = await consumeMagicToken(db, token);
  if (userId === null) {
    return context.redirect('/login?error=link', 303);
  }

  const session = await createSession(db, userId);
  context.cookies.set(SESSION_COOKIE, session.token, {
    path: '/',
    httpOnly: true,
    secure: context.url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
  });
  return context.redirect('/', 303);
};
