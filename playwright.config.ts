import { defineConfig, devices } from '@playwright/test';
import { E2E_DATABASE_URL, E2E_PORT as PORT, accountsServerEnv } from './e2e/env';

// Smoke tests against a production build. The server runs with TZ=UTC and a
// non-English LANG, so any server/browser formatting difference that would
// break hydration shows up here rather than in production. With
// E2E_DATABASE_URL set (as in CI), accounts are switched on and the account
// tests run against that database too; without it, accounts are switched off
// explicitly and no migration runs, so the tests can't reach a database
// configured in the shell or .env.local.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `${E2E_DATABASE_URL ? 'npm run db:migrate && ' : ''}npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { TZ: 'UTC', LANG: 'ja_JP.UTF-8', ...accountsServerEnv() },
  },
});
