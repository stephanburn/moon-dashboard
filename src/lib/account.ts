// Shared between the dashboard (client) and /api/me (server).

// Accounts are switched on per deployment, so the dashboard stays exactly as
// it was until the database and Discord app are set up.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS === '1';

export interface AccountUser {
  name: string;
  image: string | null;
}

export interface MeResponse {
  user: AccountUser | null;
  timezone: string | null; // the user's synced choice, if they have made one
}
