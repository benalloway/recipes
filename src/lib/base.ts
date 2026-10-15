// @ts-check

/**
 * App-absolute URLs. The app is served at its root on
 * `recipes.benalloway.com` (no Astro `base`), so `u()` is the identity
 * function. Keep the module + call sites so a future base flip stays a
 * config-level choice.
 */

/** The deploy base root (always `''` while served from subdomain root). */
export const BASE = '';

/**
 * @param {string} path app-absolute path starting with `/`
 */
export function u(path) {
  return `${BASE}${path}`;
}
