// @ts-check

/**
 * Deploy-base-aware URLs. The app is served under `/recipes` (Astro `base`),
 * so every app-absolute link, form action, and redirect target must go
 * through `u()`. With no base configured this is the identity function,
 * which keeps local/preview setups working unchanged.
 */
const RAW = import.meta.env.BASE_URL ?? '/';

const ROOT = RAW.length > 1 && RAW.endsWith('/') ? RAW.slice(0, -1) : RAW === '/' ? '' : RAW;

/** The deploy base root (`''` or `'/recipes'`). */
export const BASE = ROOT;

/**
 * @param {string} path app-absolute path starting with `/`
 */
export function u(path) {
  return `${ROOT}${path}`;
}
