/**
 * Image-input island (plain TS, no framework — the only island in M3d).
 *
 * Trigger/API: any `<input type="file" data-image-input>` on the page opts
 * in. On submit the island downscales the chosen file on a canvas so the
 * long edge is `<= 1600px`, encodes `image/jpeg` at 0.82 quality, and
 * swaps the form's `File` before the real submit. Downscale failures
 * (non-image file, canvas error) fall through to the original file — the
 * server re-validates the received bytes either way. No-JS fallback: the
 * listener never attaches and the raw file uploads untouched.
 * Include once per page with:
 * `<script>import "../../components/image-input.ts";</script>`.
 */

const MAX_LONG_EDGE = 1600;

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
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  } finally {
    bitmap.close();
  }
}

for (const input of document.querySelectorAll<HTMLInputElement>('input[data-image-input][type="file"]')) {
  const form = input.form;
  if (!form) continue;
  form.addEventListener('submit', (event) => {
    const file = input.files?.[0];
    if (!file || file.size === 0) return;
    // Async work first: hold the submit, then post for real. `form.submit()`
    // bypasses this listener, so no submit loop.
    event.preventDefault();
    void downscale(file).then((blob) => {
      if (blob) {
        const name = file.name.replace(/\.[^.]*$/, '') || 'photo';
        const transfer = new DataTransfer();
        transfer.items.add(new File([blob], `${name}.jpg`, { type: 'image/jpeg' }));
        input.files = transfer.files;
      }
      form.submit();
    });
  });
}
