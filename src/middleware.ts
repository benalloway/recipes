import { defineMiddleware } from 'astro:middleware';
import { BASE, u } from './lib/base';
import { getDb } from './lib/adapters/db';
import { SESSION_COOKIE, loadSessionByToken } from './lib/auth';

// The app root is public (logged-out landing with login CTA); all other
// pages gate to login. Paths are matched with the deploy base stripped.
const OPEN_PATHS = new Set(['/', '/login', '/api/health', '/favicon.ico', '/robots.txt']);

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.session = undefined;

  const { pathname, search } = context.url;

  // Canonicalize bare `/recipes` → `/recipes/` (308) before reading the session:
  // `verify.ts` sets the session cookie with `Path=/recipes/` (`u('/')`). Per
  // RFC 6265 §5.1.4, browsers omit a `Path=/recipes/` cookie on bare `/recipes`
  // requests, which otherwise makes `/recipes` look logged-out while `/recipes/`
  // is logged-in.
  if (BASE && pathname === BASE) {
    return context.redirect(`${u('/')}${search}`, 308);
  }

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    context.locals.session = await loadSessionByToken(getDb(context.locals), token);
  }

  const stripped =
    BASE && pathname.startsWith(BASE)
      ? pathname.slice(BASE.length) || '/'
      : pathname;

  // Compat for pre-rename nested URLs (/recipes/* under the /recipes base):
  // Astro strips `base` twice when the stripped remainder itself starts
  // with the base segment, so resource routes live at singular /recipe/*.
  // 308 preserves the method for any stale form posts. Runs before the
  // auth gate so old bookmarks canonicalize first.
  if (stripped === '/recipes/new' || /^\/recipes\/[^/]+(\/(edit|favorite|delete))?$/.test(stripped)) {
    return context.redirect(u(`/recipe${stripped.slice('/recipes'.length)}`), 308);
  }
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
