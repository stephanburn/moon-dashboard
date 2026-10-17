// Sign-in is limited to members of one Discord server (DISCORD_GUILD_ID).
// Membership is checked with the user's own OAuth token and the
// `guilds.members.read` scope, so no bot is needed.

import 'server-only';

const DISCORD_API = 'https://discord.com/api/v10';
// A stalled Discord call would otherwise hold the sign-in callback open for
// the platform's whole request allowance.
const DISCORD_TIMEOUT_MS = 5000;

export type FetchLike = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

// True only on a definite yes. Anything else (not a member, Discord down, rate
// limited, timed out, misconfigured guild) fails closed and the sign-in is
// refused.
export async function isGuildMember(
  accessToken: string,
  guildId: string | undefined,
  fetchImpl: FetchLike = fetch,
  timeoutMs = DISCORD_TIMEOUT_MS,
): Promise<boolean> {
  if (!guildId) {
    console.error('DISCORD_GUILD_ID is not set; refusing all sign-ins');
    return false;
  }
  try {
    const res = await fetchImpl(`${DISCORD_API}/users/@me/guilds/${encodeURIComponent(guildId)}/member`, {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    // 404 is Discord's answer for "not a member of this server".
    if (res.status !== 200 && res.status !== 404) {
      console.error(`Discord membership check failed with HTTP ${res.status}`);
    }
    return res.status === 200;
  } catch (err) {
    console.error('Discord membership check failed', err);
    return false;
  }
}
