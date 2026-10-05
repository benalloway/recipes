/**
 * Auth core — magic-link tokens + D1-backed sessions.
 *
 * No platform imports: Web Crypto + the db adapter only, so this file stays
 * portable. Raw tokens never touch the database — only their SHA-256 hashes.
 */
import { getDb } from './adapters/db';

/** D1 handle type, derived from the adapter — app code never names platform types. */
type Db = ReturnType<typeof getDb>;

export const SESSION_COOKIE = 'session';
export const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 minutes, single-use
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // ~30 days
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
export const EMAIL_RATE_LIMIT_MS = 30 * 1000; // 1 link per email per 30s
export const MAX_EMAIL_LENGTH = 320;

export function nowIso(): string {
  return new Date().toISOString();
}

export function expiryIso(msFromNow: number): string {
  return new Date(Date.now() + msFromNow).toISOString();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return (
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

/** 32 random bytes, base64url — safe in URLs and HTML without escaping. */
export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let base64 = '';
  for (const b of bytes) base64 += String.fromCharCode(b);
  return btoa(base64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Session the middleware resolved from the request cookie, if any. */
export function getSession(locals: App.Locals): App.Locals['session'] {
  return locals.session;
}

export async function getOrCreateUserId(db: Db, email: string): Promise<number> {
  const normalized = normalizeEmail(email);
  await db
    .prepare('INSERT INTO users (email) VALUES (?) ON CONFLICT (email) DO NOTHING')
    .bind(normalized)
    .run();
  const row = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalized)
    .first<{ id: number }>();
  if (!row) throw new Error('user row missing after upsert');
  return row.id;
}

/** Newest magic_tokens.created_at for this email (any state) — the rate-limit clock. */
export async function lastTokenSentAt(db: Db, email: string): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT mt.created_at AS created_at
       FROM magic_tokens mt JOIN users u ON u.id = mt.user_id
       WHERE u.email = ?
       ORDER BY mt.created_at DESC LIMIT 1`,
    )
    .bind(normalizeEmail(email))
    .first<{ created_at: string }>();
  return row ? row.created_at : null;
}

export async function createMagicToken(
  db: Db,
  userId: number,
): Promise<{ token: string; expiresAt: string }> {
  const token = newToken();
  const expiresAt = expiryIso(MAGIC_TTL_MS);
  await db
    .prepare('INSERT INTO magic_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
    .bind(userId, await sha256Hex(token), expiresAt)
    .run();
  // Expired links can never verify — prune opportunistically, table stays small.
  await db.prepare('DELETE FROM magic_tokens WHERE expires_at <= ?').bind(nowIso()).run();
  return { token, expiresAt };
}

/**
 * Single-use consume: the conditional UPDATE is the atomic gate, so exactly
 * one concurrent request can claim a token. Returns the user id, or null.
 */
export async function consumeMagicToken(db: Db, token: string): Promise<number | null> {
  if (!token || token.length > 128) return null;
  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const updated = await db
    .prepare(
      `UPDATE magic_tokens SET used_at = ?
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    )
    .bind(now, tokenHash, now)
    .run();
  if (!updated.meta.changes) return null;
  const row = await db
    .prepare('SELECT user_id FROM magic_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ user_id: number }>();
  if (!row) return null;
  // Consumed links can never verify again — remove the row outright.
  await db.prepare('DELETE FROM magic_tokens WHERE token_hash = ?').bind(tokenHash).run();
  return row.user_id;
}

export async function deleteMagicToken(db: Db, token: string): Promise<void> {
  await db
    .prepare('DELETE FROM magic_tokens WHERE token_hash = ?')
    .bind(await sha256Hex(token))
    .run();
}

export async function createSession(
  db: Db,
  userId: number,
): Promise<{ token: string; expiresAt: string }> {
  const token = newToken();
  const expiresAt = expiryIso(SESSION_TTL_MS);
  await db
    .prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
    .bind(userId, await sha256Hex(token), expiresAt)
    .run();
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(nowIso()).run();
  return { token, expiresAt };
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(await sha256Hex(token))
    .run();
}

export async function loadSessionByToken(
  db: Db,
  token: string,
): Promise<SessionInfo | undefined> {
  if (!token || token.length > 128) return undefined;
  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.user_id AS user_id, u.email AS email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(await sha256Hex(token), nowIso())
    .first<{ session_id: number; user_id: number; email: string }>();
  if (!row) return undefined;
  return { sessionId: row.session_id, userId: row.user_id, email: row.email };
}
