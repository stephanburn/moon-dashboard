// Settings shared by playwright.config.ts and the account test helpers.

export const E2E_PORT = 3100;
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
export const E2E_SECRET = 'e2e-secret-not-for-production-0123456789';

// Environment for the server under test. Without a test database, the account
// variables are set empty: Next's .env loading never overrides a variable that
// is already set, so this keeps accounts off whatever .env.local holds.
export function accountsServerEnv(): Record<string, string> {
  if (!E2E_DATABASE_URL) {
    return { DATABASE_URL: '', BETTER_AUTH_SECRET: '', DISCORD_CLIENT_ID: '', DISCORD_CLIENT_SECRET: '', DISCORD_GUILD_ID: '' };
  }
  return {
    DATABASE_URL: E2E_DATABASE_URL,
    BETTER_AUTH_SECRET: E2E_SECRET,
    BETTER_AUTH_URL: `http://localhost:${E2E_PORT}`,
    DISCORD_CLIENT_ID: 'e2e-client-id',
    DISCORD_CLIENT_SECRET: 'e2e-client-secret',
    DISCORD_GUILD_ID: '1',
  };
}
