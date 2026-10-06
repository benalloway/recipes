/**
 * Recipe reads — dashboard, detail, tag, and favorites queries plus the
 * favorite toggle.
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
