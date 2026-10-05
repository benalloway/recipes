// @ts-check

/**
 * Health endpoint — M0 acceptance check.
 * Verifies the Worker boots and D1 binding responds.
 */
import { getDb } from '../../lib/adapters/db';

export const GET = async () => {
  try {
    const db = getDb(undefined);
    const t0 = Date.now();
    await db.exec('SELECT 1');
    return Response.json({
      ok: true,
      db: 'up',
      latencyMs: Date.now() - t0,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
};
