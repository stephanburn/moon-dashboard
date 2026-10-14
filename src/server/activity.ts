import { sql } from 'drizzle-orm';
import { dayOf } from '@/lib/days';
import { getDb } from './db';
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

export function recordVisit(userId: string, now: Date = new Date()): Promise<void> {
  return quietly('visit', () =>
    getDb()
      .insert(visitLog)
      .values({ userId, day: dayOf(now, 'UTC'), firstAt: now, lastAt: now })
      .onConflictDoUpdate({
        target: [visitLog.userId, visitLog.day],
        set: { lastAt: now, count: sql`${visitLog.count} + 1` },
      }),
  );
}
