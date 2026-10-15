import { defineMiddleware } from 'astro:middleware';
import { u } from './lib/base';
import { getDb } from './lib/adapters/db';
import { SESSION_COOKIE, loadSessionByToken } from './lib/auth';

// The app root is public (logged-out landing with login CTA); all other
// pages gate to login. The app serves from subdomain root, so `pathname`
// needs no base stripping.
const OPEN_PATHS = new Set(['/', '/login', '/api/health', '/favicon.ico', '/robots.txt']);

// Compat for pre-rename nested URLs (/recipes/*, from when resource routes
// lived at plural /recipes/* before the singular /recipe/* rename): 308
// preserves the method for any stale form posts. Runs before the auth gate
// so old bookmarks canonicalize first.
// Note: `/recipes/new` is covered by the pattern (`[^/]+` matches `new`).
const LEGACY_RECIPE_PREFIX = '/recipes';
const LEGACY_RECIPE_PATH = /^\/recipes\/[^/]+(\/(edit|favorite|delete))?$/;

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.session = undefined;

  const { pathname } = context.url;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    context.locals.session = await loadSessionByToken(getDb(context.locals), token);
  }

  if (LEGACY_RECIPE_PATH.test(pathname)) {
    return context.redirect(u(`/recipe${pathname.slice(LEGACY_RECIPE_PREFIX.length)}`), 308);
  }

  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const open =
    OPEN_PATHS.has(normalized) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_astro/');
  if (!open && !context.locals.session) {
    return context.redirect(u('/login'), 302);
  }
  return next();
});
