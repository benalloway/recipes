/**
 * Recipe photo validation — pure byte sniffing, no platform imports.
 *
 * The server only trusts the received bytes: the client island downscales
 * for UX, but type and size are re-checked here. Extension always comes
 * from the sniffed type, never from the client filename.
 */
import type { getDb } from './adapters/db';
import { RecipeValidationError, setHeadImageKey } from './recipes';

export const MAX_IMAGE_BYTES = 5_000_000;

export type ImageExtension = 'jpg' | 'png' | 'webp';

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_MARK = [0x57, 0x45, 0x42, 0x50];
const WEBP_MARK_OFFSET = 8;

/** True when `bytes` starts with `magic` at `offset`. */
function matchesMagic(bytes: Uint8Array, magic: number[], offset = 0): boolean {
  if (bytes.length < offset + magic.length) return false;
  return magic.every((byte, i) => bytes[offset + i] === byte);
}

/**
 * Sniff jpeg (`ffd8ff`), png (`89504e47`), or webp (`RIFF....WEBP`)
 * magic bytes. Returns the extension to store, or null when unknown.
 */
export function sniffImageExtension(bytes: Uint8Array): ImageExtension | null {
  if (matchesMagic(bytes, JPEG_MAGIC)) return 'jpg';
  if (matchesMagic(bytes, PNG_MAGIC)) return 'png';
  if (matchesMagic(bytes, WEBP_RIFF) && matchesMagic(bytes, WEBP_MARK, WEBP_MARK_OFFSET)) {
    return 'webp';
  }
  return null;
}

export function contentTypeForExtension(extension: ImageExtension): string {
  switch (extension) {
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'image/webp';
  }
}

export interface ImageUpload {
  bytes: Uint8Array;
  extension: ImageExtension;
}

/** Shared `?error=` copy for the create/edit forms. */
export const IMAGE_ERROR_MESSAGES = {
  'image-type': 'Photo must be JPEG, PNG, or WebP.',
  'image-size': 'Photos must be 5 MB or smaller.',
} as const;

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

/** Minimal R2 surface `storeRecipeImage` needs — structural so this file stays portable. */
export interface BlobStore {
  put(
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

type Db = ReturnType<typeof getDb>;

/** R2 key shape for a recipe photo. */
export function buildImageKey(recipeId: number, extension: ImageExtension): string {
  return `recipes/${recipeId}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Persist an upload to R2 and stamp it on the head version. Returns the key.
 * Old R2 bytes are retained on replace (no cleanup in MVP).
 */
export async function storeRecipeImage(
  db: Db,
  blobs: BlobStore,
  recipeId: number,
  upload: ImageUpload,
): Promise<string> {
  const key = buildImageKey(recipeId, upload.extension);
  await blobs.put(key, upload.bytes, {
    httpMetadata: { contentType: contentTypeForExtension(upload.extension) },
  });
  await setHeadImageKey(db, recipeId, key);
  return key;
}
