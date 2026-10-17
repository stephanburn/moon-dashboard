import { purgeOldLogs } from '@/server/activity';
import { accountsEnabled } from '@/server/auth';
import { isCronRequest, pingHeartbeat } from '@/server/cron';
import { reportProblem } from '@/server/ops';

// Run daily by Vercel Cron (vercel.json): deletes sign-in and visit logs past
// their retention period, and stale rate-limit counts. A failure answers 500
// and logs `log-purge-failed`; a success pings the heartbeat monitor.
export async function GET(request: Request): Promise<Response> {
  if (!accountsEnabled()) return new Response(null, { status: 404 });
  if (!process.env.CRON_SECRET) reportProblem('cron-secret-unset');
  if (!isCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response(null, { status: 401 });
  }
  let deleted;
  try {
    deleted = await purgeOldLogs();
  } catch (err) {
    reportProblem('log-purge-failed', {}, err);
    return new Response(null, { status: 500 });
  }
  await pingHeartbeat(process.env.CRON_HEARTBEAT_URL);
  return Response.json({ deleted }, { headers: { 'cache-control': 'no-store' } });
}
