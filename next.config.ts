import type { NextConfig } from "next";
import { execSync } from "child_process";

// Short commit hash shown in the footer for deploy verification. Vercel
// provides it directly; elsewhere, ask git.
const commitHash = (() => {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelSha) return vercelSha.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();

// Accounts switch on by themselves in any build that has everything they
// need, so there is no separate on/off variable to set.
const ACCOUNT_VARS = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_GUILD_ID'];
const accountsConfigured = ACCOUNT_VARS.every(name => !!process.env[name]);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT: commitHash,
    NEXT_PUBLIC_ACCOUNTS: accountsConfigured ? '1' : '0',
  },
  images: {
    // Discord avatars, shown for signed-in users.
    remotePatterns: [new URL('https://cdn.discordapp.com/**')],
  },
};

export default nextConfig;
