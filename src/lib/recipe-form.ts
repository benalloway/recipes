/**
 * Shared recipe-form helpers — Cardstock 2 (issue #45).
 *
 * The new + edit pages re-render with submitted values + inline errors
 * instead of the old 303-wipe pattern. These helpers are pure (no platform
 * imports) so both pages stay thin:
 * - `snapshotRecipeForm` keeps the raw submitted strings when validation
 *   fails, so the re-render echoes exactly what was typed;
 * - `formStateForError` / `fieldForErrorCode` / `FORM_ERROR_MESSAGES` map a
 *   `RecipeValidationError` code to the field that owns it;
 * - `parseLinkedError` reads deep-linkable `?error=` codes;
 * - `blankRecipeFormValues` / `valuesFromDetail` build the GET defaults.
 */

import { IMAGE_ERROR_MESSAGES } from './images';
import {
  formatQuantity,
  INGREDIENT_FORM_ROWS,
  MAX_INGREDIENT_ROWS,
  type RecipeDetail,
  type RecipeValidationErrorCode,
} from './recipes';

/** Form field that owns an inline error. `image` is the file input. */
export type RecipeFormField = 'title' | 'servings' | 'instructions' | 'ingredients' | 'image';

/** One ingredient row of raw submitted strings (never parsed numbers). */
export interface IngredientRowValues {
  name: string;
  qty: string;
  unit: string;
  note: string;
}

/** Everything `RecipeForm` needs to repopulate after a failed submit. */
export interface RecipeFormValues {
  title: string;
  servings: string;
  instructions: string;
  ingredients: IngredientRowValues[];
  tagSlugs: string[];
}

/** Error codes the forms render: validation codes plus the `?error=` fallback. */
export type FormErrorCode = RecipeValidationErrorCode | 'unknown';

/** Shared render state for both forms: values plus inline + summary errors. */
export interface RecipeFormState {
  values: RecipeFormValues;
  fieldErrors: Partial<Record<RecipeFormField, string>>;
  summary: string;
}

/** Blank rows appended on the edit GET so additions need no island. */
const EDIT_BLANK_ROWS = 4;

/**
 * Single error vocabulary for both forms. Field copy lives with the
 * field; image copy stays canonical in `images.ts` (`?error=` deep links
 * reuse the same strings).
 */
export const FORM_ERROR_MESSAGES: Record<FormErrorCode, string> = {
  title: 'Title is required (1–200 characters).',
  servings: 'Servings must be a number above 0.',
  ingredients: 'Check ingredient rows: names required, quantities numeric.',
  instructions: 'At least one instruction step is required.',
  ...IMAGE_ERROR_MESSAGES,
  unknown: 'Something went wrong. Try again.',
};

/** Which field an error code belongs to (`unknown` has no field). */
export function fieldForErrorCode(code: FormErrorCode): RecipeFormField | null {
  switch (code) {
    case 'title':
    case 'servings':
    case 'instructions':
    case 'ingredients':
      return code;
    case 'image-type':
    case 'image-size':
      return 'image';
    default:
      return null;
  }
}

/** Bundle values with the message for `code` (field + summary share it). */
export function formStateForError(values: RecipeFormValues, code: FormErrorCode): RecipeFormState {
  const message = FORM_ERROR_MESSAGES[code];
  const field = fieldForErrorCode(code);
  return { values, fieldErrors: field ? { [field]: message } : {}, summary: message };
}

/** Parse a deep-linkable `?error=` value; unknown strings read as absent. */
export function parseLinkedError(value: string | null): FormErrorCode | null {
  if (value !== null && value in FORM_ERROR_MESSAGES) {
    return value as FormErrorCode;
  }
  return null;
}

export function blankIngredientRow(): IngredientRowValues {
  return { name: '', qty: '', unit: '', note: '' };
}

/** Pad rows with blanks up to `minimum` (capped at what the parser reads). */
export function padIngredientRows(rows: IngredientRowValues[], minimum: number): IngredientRowValues[] {
  const out = [...rows];
  while (out.length < Math.min(minimum, MAX_INGREDIENT_ROWS)) {
    out.push(blankIngredientRow());
  }
  return out;
}

/** GET defaults for the new form: blank fields, standard blank rows. */
export function blankRecipeFormValues(): RecipeFormValues {
  return {
    title: '',
    servings: '',
    instructions: '',
    ingredients: padIngredientRows([], INGREDIENT_FORM_ROWS),
    tagSlugs: [],
  };
}

/** GET defaults for the edit form: head-version values + blank add rows. */
export function valuesFromDetail(detail: RecipeDetail): RecipeFormValues {
  const rows: IngredientRowValues[] = detail.ingredients.map((ingredient) => ({
    name: ingredient.name,
    qty: ingredient.quantity !== null ? formatQuantity(ingredient.quantity) : '',
    unit: ingredient.unit ?? '',
    note: ingredient.note ?? '',
  }));
  const blankCount = Math.max(0, Math.min(EDIT_BLANK_ROWS, MAX_INGREDIENT_ROWS - rows.length));
  return {
    title: detail.title,
    servings: detail.servings !== null ? formatQuantity(detail.servings) : '',
    instructions: detail.instructions.join('\n'),
    ingredients: [...rows, ...Array.from({ length: blankCount }, blankIngredientRow)],
    tagSlugs: detail.tags.map((tag) => tag.slug),
  };
}

/**
 * Snapshot the raw submitted strings for re-render. Fully-blank ingredient
 * rows are compacted out (the parser skips them too); everything else is
 * kept verbatim, including the row that failed validation. File inputs
 * cannot be repopulated — the photo is simply chosen again.
 */
export function snapshotRecipeForm(form: FormData): RecipeFormValues {
  const ingredients: IngredientRowValues[] = [];
  for (let i = 0; i < MAX_INGREDIENT_ROWS; i++) {
    const name = String(form.get(`ing-name-${i}`) ?? '');
    const qty = String(form.get(`ing-qty-${i}`) ?? '');
    const unit = String(form.get(`ing-unit-${i}`) ?? '');
    const note = String(form.get(`ing-note-${i}`) ?? '');
    if (name.trim() === '' && qty.trim() === '' && unit.trim() === '' && note.trim() === '') {
      continue;
    }
    ingredients.push({ name, qty, unit, note });
  }
  return {
    title: String(form.get('title') ?? ''),
    servings: String(form.get('servings') ?? ''),
    instructions: String(form.get('instructions') ?? ''),
    ingredients,
    tagSlugs: form.getAll('tags').map(String),
  };
}

/**
 * Snapshot plus minimum-row padding for a failed-POST re-render, in one
 * step so callers never mutate a snapshot after the fact.
 */
export function snapshotForRerender(form: FormData, minimumRows: number): RecipeFormValues {
  const snapshot = snapshotRecipeForm(form);
  return { ...snapshot, ingredients: padIngredientRows(snapshot.ingredients, minimumRows) };
}
