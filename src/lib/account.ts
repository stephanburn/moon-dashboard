// Shared between the dashboard (client) and /api/me (server).

// Set by next.config.ts: on only in builds where the database and Discord app
// are configured, so until then the dashboard stays exactly as it was.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS === '1';

export interface AccountUser {
  name: string;
  image: string | null;
}

export interface MeResponse {
  user: AccountUser | null;
  timezone: string | null; // the user's synced choice, if they have made one
}
