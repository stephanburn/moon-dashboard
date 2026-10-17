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
  let body: MeResponse = { user: null, timezone: null, wheel: null };
  if (user) {
    const { timezone, wheel } = await getUserSettings(user.id);
    body = { user: { name: user.name, image: user.image ?? null }, timezone, wheel };
  }
  return Response.json(body, { headers: { 'cache-control': 'private, no-store' } });
}
