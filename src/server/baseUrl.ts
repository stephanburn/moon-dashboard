// The address Discord sends people back to after sign-in. It must match a
// redirect URL registered in the Discord app exactly.
//
// On Vercel it's worked out from the system variables: the production domain
// in production, and the branch's stable URL (not the per-deployment one) in
// previews. BETTER_AUTH_URL overrides it, and is how local dev sets it.

import 'server-only';

export function authBaseURL(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  const host =
    env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL
    : env.VERCEL_ENV === 'preview' ? env.VERCEL_BRANCH_URL
    : undefined;
  return host ? `https://${host}` : undefined;
}
