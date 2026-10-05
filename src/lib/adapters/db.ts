// @ts-check

/**
 * DB adapter — the only file that knows about D1.
 * Swap this file (plus env.d.ts) to port the app to any other SQL database.
 */
import { getRuntime } from '../runtime';

/** @param {App.Locals} [locals] */
export function getDb(locals) {
  return getRuntime(locals).DB;
}
