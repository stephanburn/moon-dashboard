import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { discord } from 'better-auth/social-providers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';
import * as schema from './db/schema';
import { isGuildMember } from './discord';

const SESSION_DAYS = 30;

function createAuth() {
  const clientId = process.env.DISCORD_CLIENT_ID ?? '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? '';
  // The stock Discord profile lookup, wrapped below with the membership check.
  const discordProfile = discord({ clientId, clientSecret });

  return betterAuth({
    appName: 'Moon & Sabbat',
    // baseURL and secret come from BETTER_AUTH_URL and BETTER_AUTH_SECRET.
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    socialProviders: {
      discord: {
        clientId,
        clientSecret,
        scope: ['guilds.members.read'],
        // Keep name and avatar in step with Discord on every sign-in.
        overrideUserInfoOnSignIn: true,
        // Returning null makes Better Auth refuse the sign-in (it redirects
        // with ?error=unable_to_get_user_info).
        getUserInfo: async (token) => {
          if (!token.accessToken) return null;
          if (!(await isGuildMember(token.accessToken, process.env.DISCORD_GUILD_ID))) return null;
          return discordProfile.getUserInfo(token);
        },
      },
    },
    account: {
      // We never call Discord after sign-in, but the tokens are stored anyway;
      // keep them encrypted at rest.
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * SESSION_DAYS,
    },
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

// Created on first use so that importing this module (for example during
// `next build`) needs no environment.
export function getAuth() {
  auth ??= createAuth();
  return auth;
}

export function accountsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ACCOUNTS === '1';
}

export async function getCurrentUser() {
  if (!accountsEnabled()) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// The real authorization check for pages and actions that need a user.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');
  return user;
}
