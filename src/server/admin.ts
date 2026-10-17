import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from './db';
import { session, signInLog, user, userSettings, visitLog } from './db/schema';

export async function listMembers() {
  return getDb()
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
    .leftJoin(visitLog, eq(visitLog.userId, user.id))
    .groupBy(user.id, userSettings.timezone)
    .orderBy(desc(user.createdAt));
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
