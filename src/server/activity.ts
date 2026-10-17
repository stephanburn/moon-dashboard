import 'server-only';
import { isIP } from 'node:net';
import { lt, sql } from 'drizzle-orm';
import { addDays, dayOf, type CalendarDay } from '@/lib/days';
import { getDb, type Db } from './db';
import { rateLimit, signInLog, visitLog } from './db/schema';

// Logging must never break sign-in or the dashboard, so failures are only
// reported to the server log.
async function quietly(what: string, write: () => Promise<unknown>): Promise<void> {
  try {
    await write();
  } catch (err) {
    console.error(`Could not record ${what}`, err);
  }
}

export interface RequestInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

export const MAX_USER_AGENT_LENGTH = 512;

// The address is trusted only because Vercel sets x-forwarded-for itself,
// with the visitor's address first. Anything that isn't an IP address is
// dropped, and the user agent is cut short, before either is stored.
export function requestInfo(headers: Headers | undefined): RequestInfo {
  return boundedInfo({
    ipAddress: headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: headers?.get('user-agent') || null,
  });
}

export function boundedInfo({ ipAddress, userAgent }: RequestInfo): RequestInfo {
  return {
    ipAddress: ipAddress && isIP(ipAddress) ? ipAddress : null,
    userAgent: userAgent?.slice(0, MAX_USER_AGENT_LENGTH) || null,
  };
}

export function recordSignIn(userId: string, info: RequestInfo): Promise<void> {
  return quietly('sign-in', () =>
    getDb().insert(signInLog).values({ outcome: 'signed-in', userId, ...boundedInfo(info) }),
  );
}

export function recordRefusedSignIn(discordId: string | null, discordName: string | null, info: RequestInfo): Promise<void> {
  return quietly('refused sign-in', () =>
    getDb().insert(signInLog).values({ outcome: 'refused', discordId, discordName, ...boundedInfo(info) }),
  );
}

// Dashboard loads closer together than this are one visit, so reloading
// doesn't inflate the count.
export const VISIT_GAP_MINUTES = 30;

export function recordVisit(userId: string, now: Date = new Date()): Promise<void> {
  const newVisitIfBefore = new Date(now.getTime() - VISIT_GAP_MINUTES * 60_000).toISOString();
  return quietly('visit', () =>
    getDb()
      .insert(visitLog)
      .values({ userId, day: dayOf(now, 'UTC'), firstAt: now, lastAt: now })
      .onConflictDoUpdate({
        target: [visitLog.userId, visitLog.day],
        set: {
          lastAt: now,
          count: sql`case when ${visitLog.lastAt} <= ${newVisitIfBefore} then ${visitLog.count} + 1 else ${visitLog.count} end`,
        },
      }),
  );
}

// Sign-in and visit logs are kept this long, then deleted by the daily cron
// (app/api/cron/purge-logs). The sign-in page tells members so.
export const LOG_RETENTION_DAYS = 90;

export function logCutoffs(now: Date): { signInBefore: Date; visitDayBefore: CalendarDay } {
  return {
    signInBefore: new Date(now.getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    visitDayBefore: addDays(dayOf(now, 'UTC'), -LOG_RETENTION_DAYS),
  };
}

// Rate-limit rows hold addresses and user ids but matter for a minute at
// most. Better Auth prunes them only while its own routes are busy, so the
// daily purge clears whatever is left from before yesterday.
const RATE_LIMIT_KEEP_MS = 24 * 60 * 60 * 1000;

// Unlike the writes above, this throws on failure, so the cron run shows as
// failed.
export async function purgeOldLogs(
  now: Date = new Date(),
  db: Db = getDb(),
): Promise<{ signIns: number; visits: number; rateLimits: number }> {
  const { signInBefore, visitDayBefore } = logCutoffs(now);
  const signIns = await db.delete(signInLog).where(lt(signInLog.at, signInBefore));
  const visits = await db.delete(visitLog).where(lt(visitLog.day, visitDayBefore));
  const rateLimits = await db.delete(rateLimit).where(lt(rateLimit.lastRequest, now.getTime() - RATE_LIMIT_KEEP_MS));
  return { signIns: signIns.rowCount ?? 0, visits: visits.rowCount ?? 0, rateLimits: rateLimits.rowCount ?? 0 };
}
