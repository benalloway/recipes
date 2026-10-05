import { defineMiddleware } from 'astro:middleware';
import { getDb } from './lib/adapters/db';
import { SESSION_COOKIE, loadSessionByToken } from './lib/auth';

const OPEN_PATHS = new Set(['/login', '/api/health']);

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.session = undefined;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    context.locals.session = await loadSessionByToken(getDb(context.locals), token);
  }

  const { pathname } = context.url;
  const open =
    OPEN_PATHS.has(pathname) || pathname.startsWith('/auth/') || pathname.startsWith('/_astro/');
  if (!open && !context.locals.session) {
    return context.redirect('/login', 302);
  }
  return next();
});
