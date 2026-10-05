import type { APIRoute } from 'astro';
import { getDb } from '../../lib/adapters/db';
import { SESSION_COOKIE, deleteSession } from '../../lib/auth';

/** Delete the session row and clear the cookie, then back to sign in. */
export const POST: APIRoute = async (context) => {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(getDb(context.locals), token);
  }
  // Mirror the creation attributes so browsers reliably clear the cookie.
  context.cookies.delete(SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    secure: context.url.protocol === 'https:',
    sameSite: 'lax',
  });
  return context.redirect('/login', 303);
};
