import { purgeOldLogs } from '@/server/activity';
import { accountsEnabled } from '@/server/auth';
import { isCronRequest } from '@/server/cron';

// Run daily by Vercel Cron (vercel.json): deletes sign-in and visit logs past
// their retention period.
export async function GET(request: Request): Promise<Response> {
  if (!accountsEnabled()) return new Response(null, { status: 404 });
  if (!process.env.CRON_SECRET) console.error('CRON_SECRET is not set; refusing the log purge');
  if (!isCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response(null, { status: 401 });
  }
  const deleted = await purgeOldLogs();
  return Response.json({ deleted }, { headers: { 'cache-control': 'no-store' } });
}
