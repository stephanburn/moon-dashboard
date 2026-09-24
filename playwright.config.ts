import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Smoke tests against a production build. The server runs with TZ=UTC and a
// non-English LANG, so any server/browser formatting difference that would
// break hydration shows up here rather than in production.
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
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { TZ: 'UTC', LANG: 'ja_JP.UTF-8' },
  },
});
