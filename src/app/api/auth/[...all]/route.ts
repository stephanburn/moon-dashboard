import { toNextJsHandler } from 'better-auth/next-js';
import { accountsEnabled, getAuth } from '@/server/auth';
import { isAllowedAuthPath } from '@/server/authRoutes';

function handle(request: Request): Promise<Response> {
  if (!accountsEnabled() || !isAllowedAuthPath(request.url)) {
    return Promise.resolve(new Response(null, { status: 404 }));
  }
  return getAuth().handler(request);
}

export const { GET, POST } = toNextJsHandler(handle);
