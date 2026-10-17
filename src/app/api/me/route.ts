import { after } from 'next/server';
import { recordVisit } from '@/server/activity';
import { getCurrentUser } from '@/server/auth';
import { getUserSettings } from '@/server/settings';
import type { MeResponse } from '@/lib/account';

// What the dashboard needs about the visitor, fetched after it mounts. A
// signed-out visitor gets `user: null` (not a 401), which is the normal case.
// `?check=1` is an open tab checking again, which isn't a visit.
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  const isCheck = new URL(request.url).searchParams.has('check');
  // Logged once the response has gone, so it never slows the dashboard.
  if (user && !isCheck) after(() => recordVisit(user.id));
  let body: MeResponse = { user: null, timezone: null, wheel: null };
  if (user) {
    const { timezone, wheel } = await getUserSettings(user.id);
    body = { user: { name: user.name, image: user.image ?? null }, timezone, wheel };
  }
  return Response.json(body, { headers: { 'cache-control': 'private, no-store' } });
}
