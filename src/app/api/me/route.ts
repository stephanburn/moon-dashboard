import { after } from 'next/server';
import { recordVisit } from '@/server/activity';
import { getCurrentUser } from '@/server/auth';
import { getUserSettings } from '@/server/settings';
import type { MeResponse } from '@/lib/account';

// What the dashboard needs about the visitor, fetched after it mounts. A
// signed-out visitor gets `user: null` (not a 401), which is the normal case.
export async function GET(): Promise<Response> {
  const user = await getCurrentUser();
  // Logged once the response has gone, so it never slows the dashboard.
  if (user) after(() => recordVisit(user.id));
  const body: MeResponse = user
    ? {
        user: { name: user.name, image: user.image ?? null },
        timezone: (await getUserSettings(user.id)).timezone,
      }
    : { user: null, timezone: null };
  return Response.json(body, { headers: { 'cache-control': 'private, no-store' } });
}
