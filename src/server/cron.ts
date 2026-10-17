import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { reportProblem } from './ops';

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. With no secret
// configured, nothing is accepted.
export function isCronRequest(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const HEARTBEAT_TIMEOUT_MS = 5000;

// After a successful purge, pings CRON_HEARTBEAT_URL (if set), so an external
// cron monitor alerts when a day passes without one (docs/runbook.md). A
// failed ping is logged but doesn't fail the purge.
export async function pingHeartbeat(
  url: string | undefined,
  fetchImpl: (url: string, init: { signal: AbortSignal }) => Promise<Response> = fetch,
  timeoutMs = HEARTBEAT_TIMEOUT_MS,
): Promise<void> {
  if (!url) return;
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) reportProblem('heartbeat-failed', { status: res.status });
  } catch (err) {
    reportProblem('heartbeat-failed', {}, err);
  }
}
