// Shared between the dashboard (client) and /api/me (server).

import type { WheelChoice } from './wheel';

// Set by next.config.ts: on only in builds where the database and Discord app
// are configured, so until then the dashboard stays exactly as it was.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS === '1';

export interface AccountUser {
  name: string;
  image: string | null;
}

export type SaveResult = 'saved' | 'signed-out' | 'invalid';

export interface MeResponse {
  user: AccountUser | null;
  timezone: string | null; // the account's zone, once it has one
  wheel: WheelChoice | null; // the account's seasonal wheel, once chosen
}
