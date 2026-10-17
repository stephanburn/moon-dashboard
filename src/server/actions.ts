'use server';

import 'server-only';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SaveResult } from '@/lib/account';
import { canonicalZone, listedZoneFor } from '@/lib/timezones';
import { WHEEL_CHOICES, type WheelChoice } from '@/lib/wheel';
import { accountsEnabled, getAuth, getCurrentUser, requireAdmin, requireUser } from './auth';
import { getDb } from './db';
import { session as sessionTable, user as userTable } from './db/schema';
import { setUserTimezone, setUserWheel } from './settings';

export async function signInWithDiscord(): Promise<void> {
  if (!accountsEnabled()) redirect('/');
  const { url } = await getAuth().api.signInSocial({
    body: { provider: 'discord', callbackURL: '/', errorCallbackURL: '/signin' },
    headers: await headers(),
  });
  if (!url) throw new Error('Discord sign-in URL missing');
  redirect(url);
}

export async function signOut(): Promise<void> {
  if (accountsEnabled()) {
    await getAuth().api.signOut({ headers: await headers() });
  }
  redirect('/');
}

// Deletes the account outright. Every app table cascades from user.id, so
// this removes sessions, the Discord link, settings and all saved data.
export async function deleteAccount(): Promise<void> {
  const user = await requireUser();
  await getAuth().api.signOut({ headers: await headers() });
  await getDb().delete(userTable).where(eq(userTable.id, user.id));
  redirect('/');
}

// Called when a signed-in user picks a zone. 'signed-out' means the session
// has gone (expired or revoked); the choice is still kept in localStorage.
// Database failures throw, so callers can tell them apart.
export async function saveTimezone(timezone: string): Promise<SaveResult> {
  if (typeof timezone !== 'string' || timezone.length > 64 || !canonicalZone(timezone)) return 'invalid';
  const user = await getCurrentUser();
  if (!user) return 'signed-out';
  await setUserTimezone(user.id, listedZoneFor(timezone) ?? timezone);
  return 'saved';
}

export async function saveWheel(wheel: WheelChoice): Promise<SaveResult> {
  if (!WHEEL_CHOICES.includes(wheel)) return 'invalid';
  const user = await getCurrentUser();
  if (!user) return 'signed-out';
  await setUserWheel(user.id, wheel);
  return 'saved';
}

// Signs a member out on every device. Revoking access for good also needs
// them out of the Discord server, since sign-in checks membership.
export async function revokeSessions(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = formData.get('userId');
  if (typeof userId !== 'string' || !userId) return;
  await getDb().delete(sessionTable).where(eq(sessionTable.userId, userId));
  revalidatePath('/admin');
}
