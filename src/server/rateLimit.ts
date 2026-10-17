import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, type Db } from './db';
import { rateLimit } from './db/schema';

export interface RateLimitRule {
  window: number; // seconds
  max: number; // requests allowed per window
}

// Requests to Server Actions don't pass through Better Auth's route handler,
// so its limiter never sees them; they are counted here instead, in the same
// table and with the same rule: a request is allowed when the window since the
// last allowed one has passed, or fewer than `max` have been allowed in it.
// Windows must stay within Better Auth's longest (60 s), since it prunes rows
// older than that.
export const RATE_LIMITS = {
  signIn: { window: 60, max: 10 },
  saveSetting: { window: 10, max: 10 },
} satisfies Record<string, RateLimitRule>;

/** Counts one request against `key`; false means refuse it. One atomic statement. */
export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
  db: Db = getDb(),
): Promise<boolean> {
  const windowStart = now - rule.window * 1000;
  const rows = await db
    .insert(rateLimit)
    .values({ id: crypto.randomUUID(), key: `app:${key}`, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} <= ${windowStart} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: now,
      },
      setWhere: sql`${rateLimit.lastRequest} <= ${windowStart} or ${rateLimit.count} < ${rule.max}`,
    })
    .returning({ id: rateLimit.id });
  return rows.length > 0;
}
