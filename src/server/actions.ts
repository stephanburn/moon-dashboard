'use server';

import 'server-only';
import { normalizeIP } from '@better-auth/core/utils/ip';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SaveResult } from '@/lib/account';
import { AUTO_TIMEZONE, canonicalZone, listedZoneFor } from '@/lib/timezones';
import { WHEEL_CHOICES, type WheelChoice } from '@/lib/wheel';
import { requestInfo } from './activity';
import { accountsEnabled, getAuth, getCurrentUser, requireAdmin, requireUser } from './auth';
import { getDb } from './db';
import { session as sessionTable, user as userTable } from './db/schema';
import { consumeRateLimit, RATE_LIMITS } from './rateLimit';
import { setUserTimezone, setUserWheel } from './settings';

// Each sign-in stores a state row, so it is limited per address, counting an
// IPv6 /64 (what one visitor usually holds) as one address, as Better Auth
// does. Locally there may be no x-forwarded-for; on Vercel there always is.
export async function signInWithDiscord(): Promise<void> {
  if (!accountsEnabled()) redirect('/');
  const requestHeaders = await headers();
  const { ipAddress } = requestInfo(requestHeaders);
  if (ipAddress && !(await consumeRateLimit(`sign-in:${normalizeIP(ipAddress)}`, RATE_LIMITS.signIn))) {
    redirect('/signin?error=rate_limited');
  }
  const { url } = await getAuth().api.signInSocial({
    body: { provider: 'discord', callbackURL: '/', errorCallbackURL: '/signin' },
    headers: requestHeaders,
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
// 'rate-limited' means too many saves in a row (the client tries again).
// Database failures throw, so callers can tell them apart.
// `timezone` is an IANA zone or AUTO_TIMEZONE (follow each device).
export async function saveTimezone(timezone: string): Promise<SaveResult> {
  const valid = timezone === AUTO_TIMEZONE || (typeof timezone === 'string' && timezone.length <= 64 && !!canonicalZone(timezone));
  if (!valid) return 'invalid';
  const user = await getCurrentUser();
  if (!user) return 'signed-out';
  if (!(await consumeRateLimit(`timezone:${user.id}`, RATE_LIMITS.saveSetting))) return 'rate-limited';
  await setUserTimezone(user.id, timezone === AUTO_TIMEZONE ? timezone : (listedZoneFor(timezone) ?? timezone));
  return 'saved';
}

export async function saveWheel(wheel: WheelChoice): Promise<SaveResult> {
  if (!WHEEL_CHOICES.includes(wheel)) return 'invalid';
  const user = await getCurrentUser();
  if (!user) return 'signed-out';
  if (!(await consumeRateLimit(`wheel:${user.id}`, RATE_LIMITS.saveSetting))) return 'rate-limited';
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
