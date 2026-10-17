import 'server-only';

// The only Better Auth routes reachable over HTTP. Sign-in, sign-out and
// session reads normally happen server-side through `getAuth().api`, which
// never passes through the route handler; Discord's redirect back
// (/callback/discord) is the one route the app strictly needs in the browser.
// Everything else Better Auth ships, such as /update-user (profile comes from
// Discord), /delete-user or /link-social, answers 404. An allowlist rather
// than Better Auth's `disabledPaths`, so routes added by a Better Auth
// upgrade stay closed until someone opens them here.
const AUTH_BASE_PATH = '/api/auth';
const ALLOWED_AUTH_PATHS = new Set([
  '/sign-in/social',
  '/callback/discord',
  '/sign-out',
  '/get-session',
  // Better Auth's own error page, where a sign-in that fails before our
  // errorCallbackURL is known ends up.
  '/error',
]);

export function isAllowedAuthPath(requestUrl: string): boolean {
  const pathname = new URL(requestUrl).pathname.replace(/\/+$/, '');
  if (!pathname.startsWith(`${AUTH_BASE_PATH}/`)) return false;
  return ALLOWED_AUTH_PATHS.has(pathname.slice(AUTH_BASE_PATH.length));
}
