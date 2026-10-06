/**
 * Recipe reads + create path — dashboard, detail, tag, and favorites
 * queries, the favorite toggle, and the M3b create pipeline
 * (validate → parse form → insert recipe + head version + rows).
 *
 * No platform imports: the db adapter only, so this file stays portable
 * (same rule as `src/lib/auth.ts`). Ownership is always enforced here —
 * non-owned, missing, and soft-deleted recipes read as not-found, callers
 * never distinguish.
 */
import type { getDb } from './adapters/db';

/** D1 handle type, derived from the adapter — app code never names platform types. */
type Db = ReturnType<typeof getDb>;

export interface RecipeTag {
  name: string;
  slug: string;
}

export interface RecipeCard {
  id: number;
  title: string;
  imageKey: string | null;
  tags: RecipeTag[];
  isFavorite: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
}

export interface RecipeDetail {
  id: number;
  title: string;
  servings: number | null;
  instructions: string[];
  imageKey: string | null;
  ingredients: RecipeIngredient[];
  tags: RecipeTag[];
  isFavorite: boolean;
}

interface CardRow {
  id: number;
  title: string;
  image_key: string | null;
  is_favorite: number | null;
  tag_name: string | null;
  tag_slug: string | null;
}

function toCards(rows: CardRow[]): RecipeCard[] {
  const byId = new Map<number, RecipeCard>();
  for (const row of rows) {
    let card = byId.get(row.id);
    if (!card) {
      card = {
        id: row.id,
        title: row.title,
        imageKey: row.image_key,
        tags: [],
        isFavorite: row.is_favorite === 1,
      };
      byId.set(row.id, card);
    }
    if (row.tag_slug && row.tag_name) {
      card.tags.push({ name: row.tag_name, slug: row.tag_slug });
    }
  }
  return [...byId.values()];
}

/** One row per (recipe, tag): callers group with `toCards`. */
const CARD_SELECT = `
  SELECT r.id AS id, v.title AS title, v.image_key AS image_key,
    ur.is_favorite AS is_favorite,
    t.name AS tag_name, t.slug AS tag_slug
  FROM recipes r
  JOIN recipe_versions v ON v.id = r.head_version_id
  LEFT JOIN user_recipes ur ON ur.user_id = ? AND ur.recipe_id = r.id
  LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
  LEFT JOIN tags t ON t.id = rt.tag_id`;

function positiveInt(value: number): number | null {
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** Own, non-deleted recipes newest-first. Reads only. */
export async function getDashboard(db: Db, userId: number): Promise<RecipeCard[]> {
  const { results } = await db
    .prepare(
      `${CARD_SELECT}
       WHERE r.owner_user_id = ? AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC, t.name LIMIT 200`,
    )
    .bind(userId, userId)
    .all<CardRow>();
  return toCards(results ?? []);
}

/** Head-version detail, or null when missing / not owned / deleted. */
export async function getRecipeDetail(db: Db, id: number, userId: number): Promise<RecipeDetail | null> {
  if (positiveInt(id) === null || positiveInt(userId) === null) return null;
  const head = await db
    .prepare(
      `SELECT r.id AS id, v.title AS title, v.servings AS servings,
        v.instructions AS instructions, v.image_key AS image_key,
        ur.is_favorite AS is_favorite
       FROM recipes r
       JOIN recipe_versions v ON v.id = r.head_version_id
       LEFT JOIN user_recipes ur ON ur.user_id = ? AND ur.recipe_id = r.id
       WHERE r.id = ? AND r.owner_user_id = ? AND r.deleted_at IS NULL`,
    )
    .bind(userId, id, userId)
    .first<{ id: number; title: string; servings: number | null; instructions: string; image_key: string | null; is_favorite: number | null }>();
  if (!head) return null;

  const { results: ingredients } = await db
    .prepare(
      `SELECT i.name AS name, ri.quantity AS quantity, ri.unit AS unit, ri.note AS note
       FROM recipe_ingredients ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       JOIN recipe_versions v ON v.id = ri.recipe_version_id
       WHERE v.recipe_id = ? AND v.id = (SELECT head_version_id FROM recipes WHERE id = ?)
       ORDER BY ri.position`,
    )
    .bind(id, id)
    .all<RecipeIngredient>();

  const { results: tags } = await db
    .prepare(
      `SELECT t.name AS name, t.slug AS slug
       FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id = ?
       ORDER BY t.name`,
    )
    .bind(id)
    .all<RecipeTag>();

  let instructions: string[];
  try {
    const parsed: unknown = JSON.parse(head.instructions);
    instructions = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    instructions = [];
  }

  return {
    id: head.id,
    title: head.title,
    servings: head.servings,
    instructions,
    imageKey: head.image_key,
    ingredients: ingredients ?? [],
    tags: tags ?? [],
    isFavorite: head.is_favorite === 1,
  };
}

/** Tag row by slug — null when unknown. Keeps SQL in the lib, not pages. */
export async function getTagBySlug(db: Db, slug: string): Promise<RecipeTag | null> {
  const row = await db
    .prepare('SELECT name, slug FROM tags WHERE slug = ?')
    .bind(slug)
    .first<RecipeTag>();
  return row ?? null;
}

/** Own, non-deleted recipes carrying the tag — null when the tag is unknown. */
export async function listByTag(db: Db, userId: number, slug: string): Promise<RecipeCard[] | null> {
  const tag = await db
    .prepare('SELECT id FROM tags WHERE slug = ?')
    .bind(slug)
    .first<{ id: number }>();
  if (!tag) return null;
  const { results } = await db
    .prepare(
      `${CARD_SELECT}
       WHERE r.owner_user_id = ? AND r.deleted_at IS NULL
         AND EXISTS (SELECT 1 FROM recipe_tags rt WHERE rt.recipe_id = r.id AND rt.tag_id = ?)
       ORDER BY r.created_at DESC, t.name LIMIT 200`,
    )
    .bind(userId, userId, tag.id)
    .all<CardRow>();
  return toCards(results ?? []);
}

/** Favorited own, non-deleted recipes, most-recently-added first. */
export async function listFavorites(db: Db, userId: number): Promise<RecipeCard[]> {
  const { results } = await db
    .prepare(
      `${CARD_SELECT}
       WHERE r.owner_user_id = ? AND r.deleted_at IS NULL AND ur.is_favorite = 1
       ORDER BY ur.added_at DESC, t.name LIMIT 200`,
    )
    .bind(userId, userId)
    .all<CardRow>();
  return toCards(results ?? []);
}

/**
 * Flip the favorite flag. Returns the new state, or null when the recipe
 * is missing, not owned, or deleted. Single UPSERT so concurrent toggles
 * cannot collide on the (user_id, recipe_id) key — absent rows insert at 1.
 */
export async function toggleFavorite(db: Db, userId: number, recipeId: number): Promise<boolean | null> {
  if (positiveInt(recipeId) === null || positiveInt(userId) === null) return null;
  const owned = await db
    .prepare('SELECT id FROM recipes WHERE id = ? AND owner_user_id = ? AND deleted_at IS NULL')
    .bind(recipeId, userId)
    .first<{ id: number }>();
  if (!owned) return null;

  await db
    .prepare(
      `INSERT INTO user_recipes (user_id, recipe_id, is_favorite)
       VALUES (?, ?, 1)
       ON CONFLICT (user_id, recipe_id) DO UPDATE SET is_favorite = 1 - user_recipes.is_favorite`,
    )
    .bind(userId, recipeId)
    .run();
  const row = await db
    .prepare('SELECT is_favorite FROM user_recipes WHERE user_id = ? AND recipe_id = ?')
    .bind(userId, recipeId)
    .first<{ is_favorite: number }>();
  return row ? row.is_favorite === 1 : null;
}

/** `2.0` renders `2`; non-integers keep their shortest form. */
export function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(Math.trunc(quantity)) : String(quantity);
}

/**
 * `"<qty> <unit> <name> (<note>)"` with null parts omitted and whitespace
 * collapsed. Same strings feed the detail list and the JSON-LD.
 */
export function formatIngredient(ingredient: RecipeIngredient): string {
  const parts: string[] = [];
  if (ingredient.quantity !== null) parts.push(formatQuantity(ingredient.quantity));
  if (ingredient.unit) parts.push(ingredient.unit);
  parts.push(ingredient.name);
  let line = parts.join(' ');
  if (ingredient.note) line += ` (${ingredient.note})`;
  return line.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Create path (M3b). Validation is pure; only `createRecipe` touches the db.
// ---------------------------------------------------------------------------

export interface IngredientInput {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
}

export interface RecipeInput {
  title: string;
  servings: number | null;
  instructions: string[];
  ingredients: IngredientInput[];
  tagSlugs: string[];
}

export class RecipeValidationError extends Error {
  constructor(readonly code: 'title' | 'servings' | 'ingredients' | 'instructions') {
    super(code);
  }
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_SERVINGS = 1000;
export const MAX_INSTRUCTION_LINES = 100;
export const MAX_INSTRUCTION_LENGTH = 2000;
export const MAX_INGREDIENT_ROWS = 50;
export const MAX_INGREDIENT_NAME_LENGTH = 100;
export const MAX_UNIT_LENGTH = 20;
export const MAX_NOTE_LENGTH = 200;
export const MAX_QUANTITY = 1e6;
export const INGREDIENT_FORM_ROWS = 8;

/**
 * Canonical slug: lowercase, non-alphanumeric runs become `-`, no leading
 * or trailing dashes. Non-ASCII runs become `-` (documented; revisit only
 * if capsule queries need it).
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Keeps order, dedups, drops anything not in `known`. */
export function filterKnownSlugs(candidates: string[], known: Set<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of candidates) {
    if (known.has(candidate) && !seen.has(candidate)) {
      seen.add(candidate);
      out.push(candidate);
    }
  }
  return out;
}

function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_QUANTITY) {
    throw new RecipeValidationError('ingredients');
  }
  return value;
}

/**
 * Reads the new-recipe form: `title`, `servings`, `instructions` (textarea,
 * one step per line), up to MAX_INGREDIENT_ROWS indexed ingredient rows,
 * repeated `tags` checkboxes filtered to known slugs (unknowns ignored). Fully-blank ingredient rows
 * are skipped; a partially-filled row with a blank name is invalid.
 * Throws `RecipeValidationError(code)` on any violation.
 */
export function parseRecipeForm(form: FormData, knownTagSlugs: Set<string>): RecipeInput {
  const title = String(form.get('title') ?? '').trim();
  if (title.length < 1 || title.length > MAX_TITLE_LENGTH) {
    throw new RecipeValidationError('title');
  }

  const servingsRaw = String(form.get('servings') ?? '').trim();
  let servings: number | null = null;
  if (servingsRaw !== '') {
    const value = Number(servingsRaw);
    if (!Number.isFinite(value) || value <= 0 || value > MAX_SERVINGS) {
      throw new RecipeValidationError('servings');
    }
    servings = value;
  }

  const instructions = String(form.get('instructions') ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (
    instructions.length < 1 ||
    instructions.length > MAX_INSTRUCTION_LINES ||
    instructions.some((line) => line.length > MAX_INSTRUCTION_LENGTH)
  ) {
    throw new RecipeValidationError('instructions');
  }

  const ingredients: IngredientInput[] = [];
  // Reads up to MAX_INGREDIENT_ROWS indexed rows: the new form renders
  // INGREDIENT_FORM_ROWS, the edit form renders existing + 4 blanks.
  for (let i = 0; i < MAX_INGREDIENT_ROWS; i++) {
    const name = String(form.get(`ing-name-${i}`) ?? '').trim();
    const qtyRaw = String(form.get(`ing-qty-${i}`) ?? '');
    const unitRaw = String(form.get(`ing-unit-${i}`) ?? '').trim();
    const noteRaw = String(form.get(`ing-note-${i}`) ?? '').trim();
    if (name === '' && qtyRaw.trim() === '' && unitRaw === '' && noteRaw === '') {
      continue;
    }
    if (name === '' || name.length > MAX_INGREDIENT_NAME_LENGTH || slugify(name) === '') {
      throw new RecipeValidationError('ingredients');
    }
    const quantity = parseQuantity(qtyRaw);
    const unit = unitRaw === '' ? null : unitRaw;
    if (unit !== null && unit.length > MAX_UNIT_LENGTH) throw new RecipeValidationError('ingredients');
    const note = noteRaw === '' ? null : noteRaw;
    if (note !== null && note.length > MAX_NOTE_LENGTH) throw new RecipeValidationError('ingredients');
    ingredients.push({ name, quantity, unit, note });
  }
  // The new form posts INGREDIENT_FORM_ROWS rows; the edit form can post
  // more (existing + 4 blanks), so the cap binds there instead.
  if (ingredients.length < 1 || ingredients.length > MAX_INGREDIENT_ROWS) {
    throw new RecipeValidationError('ingredients');
  }

  const tagSlugs = filterKnownSlugs(form.getAll('tags').map(String), knownTagSlugs);
  return { title, servings, instructions, ingredients, tagSlugs };
}

/**
 * Insert one recipe + its head version (n=1) + ingredient/tag rows, and
 * shelve it in the owner's bookshelf (not favorited). Sequential prepared
 * statements — D1 has no interactive transactions, matching the existing
 * `auth.ts` style. NULL-first head ordering is mandatory: `head_version_id`
 * is a real FK, so the recipe row lands with NULL before the version id
 * is patched in. New ingredient names get canonical rows with NULL
 * category (uncategorized). Returns the recipe id.
 *
 * Precondition: `input` passed `parseRecipeForm` (lengths/ranges validated).
 * Direct callers must validate first — this function asserts FK shape only.
 */
export async function createRecipe(db: Db, userId: number, input: RecipeInput): Promise<number> {
  const recipe = await db
    .prepare('INSERT INTO recipes (owner_user_id, head_version_id) VALUES (?, NULL)')
    .bind(userId)
    .run();
  const recipeId = Number(recipe.meta.last_row_id);

  const version = await db
    .prepare(
      `INSERT INTO recipe_versions
         (recipe_id, n, title, servings, instructions, image_key, edit_note, created_by)
       VALUES (?, 1, ?, ?, ?, NULL, NULL, ?)`,
    )
    .bind(recipeId, input.title, input.servings, JSON.stringify(input.instructions), userId)
    .run();
  const versionId = Number(version.meta.last_row_id);
  await db
    .prepare('UPDATE recipes SET head_version_id = ? WHERE id = ?')
    .bind(versionId, recipeId)
    .run();

  let position = 0;
  for (const ingredient of input.ingredients) {
    await insertIngredientRow(db, versionId, ingredient, position);
    position += 1;
  }

  await replaceRecipeTags(db, recipeId, input.tagSlugs);

  await db
    .prepare('INSERT OR IGNORE INTO user_recipes (user_id, recipe_id, is_favorite) VALUES (?, ?, 0)')
    .bind(userId, recipeId)
    .run();
  return recipeId;
}

/** One versioned ingredient row: canonical match by slug, else a new uncategorized row. */
async function insertIngredientRow(
  db: Db,
  versionId: number,
  ingredient: IngredientInput,
  position: number,
): Promise<void> {
  const slug = slugify(ingredient.name);
  await db
    .prepare('INSERT INTO ingredients (name, slug, category) VALUES (?, ?, NULL) ON CONFLICT (slug) DO NOTHING')
    .bind(ingredient.name, slug)
    .run();
  const row = await db
    .prepare('SELECT id FROM ingredients WHERE slug = ?')
    .bind(slug)
    .first<{ id: number }>();
  if (!row) throw new Error(`ingredient row missing after upsert: ${slug}`);
  await db
    .prepare(
      `INSERT INTO recipe_ingredients
         (recipe_version_id, ingredient_id, quantity, unit, note, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(versionId, row.id, ingredient.quantity, ingredient.unit, ingredient.note, position)
    .run();
}

/** Replace a recipe's tag set with the given known slugs. */
async function replaceRecipeTags(db: Db, recipeId: number, tagSlugs: string[]): Promise<void> {
  await db
    .prepare('DELETE FROM recipe_tags WHERE recipe_id = ?')
    .bind(recipeId)
    .run();
  for (const tagSlug of tagSlugs) {
    await db
      .prepare(
        `INSERT INTO recipe_tags (recipe_id, tag_id)
         SELECT ?, id FROM tags WHERE slug = ?`,
      )
      .bind(recipeId, tagSlug)
      .run();
  }
}

/**
 * Append a new immutable head version (n = head + 1) with fresh ingredient
 * rows and a replaced tag set. Old versions are never touched. Image key
 * carries forward unchanged (uploads land in M3d). `user_recipes` untouched.
 * Returns the new version's `n`, or null when missing / not owned / deleted.
 */
export async function appendVersion(
  db: Db,
  userId: number,
  recipeId: number,
  input: RecipeInput,
): Promise<number | null> {
  if (positiveInt(recipeId) === null || positiveInt(userId) === null) return null;
  const owned = await db
    .prepare('SELECT head_version_id FROM recipes WHERE id = ? AND owner_user_id = ? AND deleted_at IS NULL')
    .bind(recipeId, userId)
    .first<{ head_version_id: number }>();
  if (!owned) return null;

  const head = await db
    .prepare('SELECT n, image_key FROM recipe_versions WHERE id = ?')
    .bind(owned.head_version_id)
    .first<{ n: number; image_key: string | null }>();
  if (!head) throw new Error(`head version missing for recipe ${recipeId}`);

  const next = head.n + 1;
  const version = await db
    .prepare(
      `INSERT INTO recipe_versions
         (recipe_id, n, title, servings, instructions, image_key, edit_note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .bind(recipeId, next, input.title, input.servings, JSON.stringify(input.instructions), head.image_key, userId)
    .run();
  const versionId = Number(version.meta.last_row_id);

  let position = 0;
  for (const ingredient of input.ingredients) {
    await insertIngredientRow(db, versionId, ingredient, position);
    position += 1;
  }
  await replaceRecipeTags(db, recipeId, input.tagSlugs);

  await db
    .prepare('UPDATE recipes SET head_version_id = ? WHERE id = ?')
    .bind(versionId, recipeId)
    .run();
  return next;
}
