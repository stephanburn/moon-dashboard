import 'server-only';
import { lt, sql } from 'drizzle-orm';
import { addDays, dayOf, type CalendarDay } from '@/lib/days';
import { getDb, type Db } from './db';
import { signInLog, visitLog } from './db/schema';

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

export function requestInfo(headers: Headers | undefined): RequestInfo {
  return {
    // Vercel puts the visitor's address first.
    ipAddress: headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: headers?.get('user-agent') || null,
  };
}

export function recordSignIn(userId: string, info: RequestInfo): Promise<void> {
  return quietly('sign-in', () => getDb().insert(signInLog).values({ outcome: 'signed-in', userId, ...info }));
}

export function recordRefusedSignIn(discordId: string | null, discordName: string | null, info: RequestInfo): Promise<void> {
  return quietly('refused sign-in', () =>
    getDb().insert(signInLog).values({ outcome: 'refused', discordId, discordName, ...info }),
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

// Unlike the writes above, this throws on failure, so the cron run shows as
// failed.
export async function purgeOldLogs(
  now: Date = new Date(),
  db: Db = getDb(),
): Promise<{ signIns: number; visits: number }> {
  const { signInBefore, visitDayBefore } = logCutoffs(now);
  const signIns = await db.delete(signInLog).where(lt(signInLog.at, signInBefore));
  const visits = await db.delete(visitLog).where(lt(visitLog.day, visitDayBefore));
  return { signIns: signIns.rowCount ?? 0, visits: visits.rowCount ?? 0 };
}
