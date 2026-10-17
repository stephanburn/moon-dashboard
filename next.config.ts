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
const missingAccountVars = ACCOUNT_VARS.filter(name => !process.env[name]);
const accountsConfigured = missingAccountVars.length === 0;
// Names only, never values: shows in the Vercel build log why accounts are off.
console.log(
  accountsConfigured ? 'Accounts: on' : `Accounts: off (not set: ${missingAccountVars.join(', ')})`,
);

const isDev = process.env.NODE_ENV === 'development';

// Report-only for now: violations show in the browser console and nothing is
// blocked. `/` is prerendered (ISR), so there is no per-request nonce and
// Next's inline scripts need 'unsafe-inline'. Everything else is same-origin:
// next/font serves the fonts, next/image proxies Discord avatars through
// /_next/image, and Vercel Analytics loads from /_vercel/insights. Sign-in
// without JavaScript is a form post that redirects to Discord, hence
// form-action. frame-ancestors is ignored in a report-only policy, so it is
// sent enforcing on its own below. In development React needs eval and
// Vercel Analytics loads its debug script from its CDN.
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.discordapp.com",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://discord.com",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
