/**
 * Image-input island (plain TS, no framework).
 *
 * Any `<input type="file" data-image-input>` opts in. On submit the island
 * downscales the chosen file on a canvas so the long edge is `<= 1600px`,
 * encodes `image/jpeg`, and swaps the form's `File` before the real submit.
 * Downscale failures fall through to the original file — the server
 * re-validates the received bytes either way. Without JS the raw file
 * uploads untouched.
 */

const MAX_LONG_EDGE = 1600;
const JPEG_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.82;

/** Downscale `file` to a JPEG blob, or null when it cannot be decoded. */
async function downscale(file: File): Promise<Blob | null> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, JPEG_TYPE, JPEG_QUALITY));
  } finally {
    bitmap.close();
  }
}

/** Replace the input's file with the downscaled JPEG, keeping the base name. */
function swapInputFile(input: HTMLInputElement, original: File, blob: Blob): void {
  const name = original.name.replace(/\.[^.]*$/, '') || 'photo';
  const transfer = new DataTransfer();
  transfer.items.add(new File([blob], `${name}.jpg`, { type: JPEG_TYPE }));
  input.files = transfer.files;
}

/** Hold the submit for async downscale, then post for real. */
function attachDownscale(input: HTMLInputElement): void {
  const form = input.form;
  if (!form) return;
  form.addEventListener('submit', (event) => {
    const file = input.files?.[0];
    if (!file || file.size === 0) return;
    // `form.submit()` bypasses this listener, so no submit loop.
    event.preventDefault();
    void downscale(file).then((blob) => {
      if (blob) swapInputFile(input, file, blob);
      form.submit();
    });
  });
}

for (const input of document.querySelectorAll<HTMLInputElement>('input[data-image-input][type="file"]')) {
  attachDownscale(input);
}
