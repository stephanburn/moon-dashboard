import 'server-only';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { addDays, dayOf } from '@/lib/days';
import { LOG_RETENTION_DAYS } from './activity';
import { getDb } from './db';
import { session, signInLog, user, userSettings, visitLog } from './db/schema';

export const MEMBERS_PAGE_SIZE = 50;

export async function countMembers(): Promise<number> {
  const [row] = await getDb().select({ n: count() }).from(user);
  return row.n;
}

/**
 * One page of members, newest first, with their visits over the retention
 * window. `after` is the id of the last member on the previous page;
 * `nextAfter` is set when there is another page.
 */
export async function listMembers(after?: string) {
  const since = addDays(dayOf(new Date(), 'UTC'), -LOG_RETENTION_DAYS);
  // Compared in SQL, so created_at keeps its full precision.
  const cursor = after
    ? sql`(${user.createdAt}, ${user.id}) < (select ${user.createdAt}, ${user.id} from ${user} where ${user.id} = ${after})`
    : undefined;
  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      joinedAt: user.createdAt,
      timezone: userSettings.timezone,
      lastSeenAt: sql<Date | null>`max(${visitLog.lastAt})`.mapWith(v => (v ? new Date(v) : null)),
      daysVisited: sql<number>`count(${visitLog.day})`.mapWith(Number),
      visits: sql<number>`coalesce(sum(${visitLog.count}), 0)`.mapWith(Number),
      activeSessions: sql<number>`(select count(*) from ${session} where ${session.userId} = ${user.id} and ${session.expiresAt} > now())`.mapWith(Number),
    })
    .from(user)
    .leftJoin(userSettings, eq(userSettings.userId, user.id))
    .leftJoin(visitLog, and(eq(visitLog.userId, user.id), gte(visitLog.day, since)))
    .where(cursor)
    .groupBy(user.id, userSettings.timezone)
    .orderBy(desc(user.createdAt), desc(user.id))
    .limit(MEMBERS_PAGE_SIZE + 1);
  const members = rows.slice(0, MEMBERS_PAGE_SIZE);
  return { members, nextAfter: rows.length > MEMBERS_PAGE_SIZE ? members[members.length - 1].id : null };
}

export async function recentSignIns(limit = 100) {
  return getDb()
    .select({
      id: signInLog.id,
      at: signInLog.at,
      outcome: signInLog.outcome,
      name: sql<string | null>`coalesce(${user.name}, ${signInLog.discordName})`,
      discordId: signInLog.discordId,
      ipAddress: signInLog.ipAddress,
      userAgent: signInLog.userAgent,
    })
    .from(signInLog)
    .leftJoin(user, eq(user.id, signInLog.userId))
    .orderBy(desc(signInLog.at))
    .limit(limit);
}
