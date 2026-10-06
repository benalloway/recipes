// @ts-check

/**
 * Blob storage adapter — the only file that knows about R2.
 * Swap to S3 or a plain directory to port the app elsewhere.
 */
import { getRuntime } from '../runtime';

/** @param {App.Locals} [locals] */
export function getBlobs(locals) {
  const runtime = getRuntime(locals);
  if (!runtime.MEDIA) {
    throw new Error('Binding MEDIA missing — check wrangler.jsonc');
  }
  return runtime.MEDIA;
}
