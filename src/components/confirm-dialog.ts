/**
 * Confirm-dialog island (plain TS, no framework — the only island in M3e).
 *
 * Trigger/API: any `<form data-confirm="Prompt text">` on the page opts in.
 * The island intercepts that form's first submit, shows a native `<dialog>`
 * with the `data-confirm` text, and only submits on Confirm — Cancel (or
 * Esc, or backdrop click) closes without submitting. `form.submit()` is
 * used for the confirmed post so the submit-event interceptor does not
 * re-fire. No-JS fallback: the listener never attaches, the form posts
 * immediately. Include once per page with:
 * `<script>import "../../components/confirm-dialog.ts";</script>`.
 */

// One shared dialog for every opted-in form on the page.
const dialog = document.createElement('dialog');
dialog.setAttribute('aria-label', 'Confirm');
const promptText = document.createElement('p');
const confirmButton = document.createElement('button');
confirmButton.type = 'button';
confirmButton.textContent = 'Delete';
const cancelButton = document.createElement('button');
cancelButton.type = 'button';
cancelButton.textContent = 'Cancel';
dialog.append(promptText, confirmButton, cancelButton);
document.body.append(dialog);

let pendingForm: HTMLFormElement | null = null;

confirmButton.addEventListener('click', () => {
  const form = pendingForm;
  pendingForm = null;
  dialog.close();
  // Native submit: bypasses the submit listener, so no confirm loop.
  form?.submit();
});

cancelButton.addEventListener('click', () => {
  pendingForm = null;
  dialog.close();
});

dialog.addEventListener('click', (event) => {
  // Backdrop click closes without submitting.
  if (event.target === dialog) {
    pendingForm = null;
    dialog.close();
  }
});

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-confirm]')) {
  form.addEventListener('submit', (event) => {
    if (pendingForm === form) return; // Confirmed via the dialog — let it post.
    event.preventDefault();
    pendingForm = form;
    promptText.textContent = form.dataset.confirm ?? 'Are you sure?';
    dialog.showModal();
  });
}
