// Shared between the dashboard (client) and /api/me (server).

import type { WheelChoice } from './wheel';

// Set by next.config.ts: on only in builds where the database and Discord app
// are configured, so until then the dashboard stays exactly as it was.
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS === '1';

export interface AccountUser {
  name: string;
  image: string | null;
}

export type SaveResult = 'saved' | 'signed-out' | 'invalid' | 'rate-limited';

export interface MeResponse {
  user: AccountUser | null;
  timezone: string | null; // the account's zone, once it has one
  wheel: WheelChoice | null; // the account's seasonal wheel, once chosen
}

// Tabs tell each other when the account changes (sign-out, deletion, a save
// that found the session gone), so every open dashboard checks again.
const ACCOUNT_CHANNEL = 'moon-dashboard-account';

export function announceAccountChange(): void {
  try {
    const channel = new BroadcastChannel(ACCOUNT_CHANNEL);
    channel.postMessage('changed');
    channel.close();
  } catch {
    // BroadcastChannel unavailable: other tabs catch up when next shown.
  }
}

/** Calls `onChange` when another tab announces an account change. */
export function onAccountChange(onChange: () => void): () => void {
  try {
    const channel = new BroadcastChannel(ACCOUNT_CHANNEL);
    channel.onmessage = onChange;
    return () => channel.close();
  } catch {
    return () => {};
  }
}
