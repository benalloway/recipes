// @ts-check

/**
 * Blob storage adapter — the only file that knows about R2.
 * Swap to S3 or a plain directory to port the app elsewhere.
 */
import { getRuntime } from '../runtime';

/** @param {App.Locals} [locals] */
export function getBlobs(locals) {
  return getRuntime(locals).MEDIA;
}
