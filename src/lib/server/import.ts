// @ts-check

/**
 * AI import stub — reserved interface, deliberately NOT implemented in MVP.
 * Issue #7 (M8). LLM output schema will match the recipe-draft shape below.
 */

export const AI_IMPORT_ENABLED =
  process.env.AI_IMPORT_ENABLED === 'true';

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
  if (!AI_IMPORT_ENABLED) {
    throw new Error(`AI import is not enabled (${fn})`);
  }
  throw new Error(`AI import not implemented yet (${fn}: ${arg})`);
}
