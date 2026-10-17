import { eq } from 'drizzle-orm';
import { getDb } from './db';
import type { WheelChoice } from '@/lib/wheel';
import { userSettings } from './db/schema';

export interface UserSettings {
  timezone: string | null;
  wheel: WheelChoice | null;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [row] = await getDb()
    .select({ timezone: userSettings.timezone, wheel: userSettings.wheel })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return { timezone: row?.timezone ?? null, wheel: row?.wheel ?? null };
}

export async function setUserWheel(userId: string, wheel: WheelChoice): Promise<void> {
  const updatedAt = new Date();
  await getDb()
    .insert(userSettings)
    .values({ userId, wheel, updatedAt })
    .onConflictDoUpdate({ target: userSettings.userId, set: { wheel, updatedAt } });
}

export async function setUserTimezone(userId: string, timezone: string): Promise<void> {
  const updatedAt = new Date();
  await getDb()
    .insert(userSettings)
    .values({ userId, timezone, updatedAt })
    .onConflictDoUpdate({ target: userSettings.userId, set: { timezone, updatedAt } });
}
