import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { userSettings } from './db/schema';

export interface UserSettings {
  timezone: string | null;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [row] = await getDb()
    .select({ timezone: userSettings.timezone })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return { timezone: row?.timezone ?? null };
}

export async function setUserTimezone(userId: string, timezone: string): Promise<void> {
  const updatedAt = new Date();
  await getDb()
    .insert(userSettings)
    .values({ userId, timezone, updatedAt })
    .onConflictDoUpdate({ target: userSettings.userId, set: { timezone, updatedAt } });
}
