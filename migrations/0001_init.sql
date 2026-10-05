-- 0001_init.sql — full initial schema (M1, issue #3)
-- Constraints: plain SQLite (portable beyond D1), no D1-only syntax,
-- no PRAGMAs (foreign-key enablement is a connection setting, handled by D1).
-- Timestamps: RFC3339 UTC via strftime.
-- Naming: snake_case tables/columns; slugs are lowercase kebab-case.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Magic-link login tokens. We store SHA-256(token), never the raw token.
CREATE TABLE magic_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_magic_tokens_expires ON magic_tokens(expires_at);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Git-style versioning: recipes are pointers, recipe_versions are immutable
-- full snapshots. head_version_id always points at the current version.
-- App invariant: every recipe has >= 1 version; revert = append a new version;
-- fork = new recipe row whose forked_from_* points at the source.
CREATE TABLE recipe_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  n INTEGER NOT NULL,
  title TEXT NOT NULL,
  servings REAL,
  instructions TEXT NOT NULL, -- JSON array of step strings, validated app-side
  image_key TEXT,
  edit_note TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (recipe_id, n)      -- also covers the required (recipe_id, n) index
);

CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  head_version_id INTEGER REFERENCES recipe_versions(id),
  forked_from_recipe_id INTEGER REFERENCES recipes(id),
  forked_from_version_id INTEGER REFERENCES recipe_versions(id),
  deleted_at TEXT,           -- soft delete: set timestamp, never DELETE
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_recipes_owner ON recipes(owner_user_id);

-- Canonical ingredient registry — the join keys for capsule meal planning.
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT -- produce | protein | dairy | grain | spice | pantry (advisory; may extend)
);

-- Ingredients are versioned with the recipe: diffing across versions falls out
-- of set-differences on this table. Quantity NULL = unmeasured ("to taste").
CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_version_id INTEGER NOT NULL REFERENCES recipe_versions(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity REAL,
  unit TEXT,
  note TEXT,
  position INTEGER NOT NULL
);
CREATE INDEX idx_recipe_ingredients_version ON recipe_ingredients(recipe_version_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE recipe_tags (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- The user's list of recipe ids (their bookshelf), with favorite flag.
CREATE TABLE user_recipes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, recipe_id)
);
CREATE INDEX idx_user_recipes_user ON user_recipes(user_id);
