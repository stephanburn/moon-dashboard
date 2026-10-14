'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { canonicalZone } from '@/lib/timezones';
import { accountsEnabled, getAuth, getCurrentUser, requireUser } from './auth';
import { getDb } from './db';
import { user as userTable } from './db/schema';
import { setUserTimezone } from './settings';

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

// Called from the dashboard when a signed-in user picks a zone. Silently
// ignores signed-out callers: the choice is still kept in localStorage.
export async function saveTimezone(timezone: string): Promise<void> {
  if (typeof timezone !== 'string' || timezone.length > 64 || !canonicalZone(timezone)) return;
  const user = await getCurrentUser();
  if (!user) return;
  await setUserTimezone(user.id, timezone);
}
