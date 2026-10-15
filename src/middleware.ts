import { defineMiddleware } from 'astro:middleware';
import { BASE, u } from './lib/base';
import { getDb } from './lib/adapters/db';
import { SESSION_COOKIE, loadSessionByToken } from './lib/auth';

// The app root is public (logged-out landing with login CTA); all other
// pages gate to login. Paths are matched with the deploy base stripped.
const OPEN_PATHS = new Set(['/', '/login', '/api/health', '/favicon.ico', '/robots.txt']);

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.session = undefined;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    context.locals.session = await loadSessionByToken(getDb(context.locals), token);
  }

  const { pathname } = context.url;
  const stripped =
    BASE && pathname.startsWith(BASE)
      ? pathname.slice(BASE.length) || '/'
      : pathname;
  const normalized = stripped.length > 1 ? stripped.replace(/\/+$/, '') : stripped;
  const open =
    OPEN_PATHS.has(normalized) ||
    stripped.startsWith('/auth/') ||
    stripped.startsWith('/_astro/');
  if (!open && !context.locals.session) {
    return context.redirect(u('/login'), 302);
  }
  return next();
});
