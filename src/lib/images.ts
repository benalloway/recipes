/**
 * Recipe photo validation — pure byte sniffing, no platform imports.
 *
 * The server only trusts the received bytes: the client island downscales
 * for UX, but type and size are re-checked here. Extension always comes
 * from the sniffed type, never from the client filename.
 */
import { RecipeValidationError } from './recipes';

export const MAX_IMAGE_BYTES = 5_000_000;

export type ImageExtension = 'jpg' | 'png' | 'webp';

/**
 * Sniff jpeg (`ffd8ff`), png (`89504e47`), or webp (`RIFF....WEBP`)
 * magic bytes. Returns the extension to store, or null when unknown.
 */
export function sniffImageExtension(bytes: Uint8Array): ImageExtension | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

export function contentTypeForExtension(extension: ImageExtension): string {
  return extension === 'jpg' ? 'image/jpeg' : extension === 'png' ? 'image/png' : 'image/webp';
}

export interface ImageUpload {
  bytes: Uint8Array;
  extension: ImageExtension;
}

/**
 * Read the optional `image` file field. No file chosen (missing field,
 * non-file value, or zero-byte file) returns null — the caller keeps
 * current behavior (NULL on create, head key carried forward on edit).
 * Otherwise validates the received bytes: magic type first, then the
 * 5 MB cap. Throws `RecipeValidationError('image-type' | 'image-size')`.
 */
export async function readImageUpload(form: FormData): Promise<ImageUpload | null> {
  const value = form.get('image');
  if (!(value instanceof File) || value.size === 0) return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  const extension = sniffImageExtension(bytes);
  if (!extension) {
    throw new RecipeValidationError('image-type');
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new RecipeValidationError('image-size');
  }
  return { bytes, extension };
}
