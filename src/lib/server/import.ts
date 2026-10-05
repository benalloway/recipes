// @ts-check

/**
 * AI import stub — reserved interface, deliberately NOT implemented in MVP.
 * Issue #7 (M8). LLM output schema will match the recipe-draft shape below.
 * The flag comes from the Worker env binding (cloudflare:workers), same as
 * all other runtime config.
 */
import { env } from 'cloudflare:workers';

export function isAiImportEnabled() {
  return env.AI_IMPORT_ENABLED === 'true';
}

/**
 * @param {string} url
 * @returns {Promise<never>}
 */
export async function importFromUrl(url) {
  throwUnimplemented('importFromUrl', url);
}

/**
 * @param {string} blobKey
 * @returns {Promise<never>}
 */
export async function importFromImage(blobKey) {
  throwUnimplemented('importFromImage', blobKey);
}

/** @param {string} fn @param {string} arg */
function throwUnimplemented(fn, arg) {
  if (!isAiImportEnabled()) {
    throw new Error(`AI import is not enabled (${fn})`);
  }
  throw new Error(`AI import not implemented yet (${fn}: ${arg})`);
}
