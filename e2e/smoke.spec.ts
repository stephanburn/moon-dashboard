import { test, expect, type Page } from '@playwright/test';

const PHASE_NAME = /^(New Moon|Waxing Crescent|First Quarter|Waxing Gibbous|Full Moon|Waning Gibbous|Last Quarter|Waning Crescent)$/;

// Collect everything that would indicate a broken page: uncaught errors
// (including React hydration errors) and console errors. Vercel Analytics'
// script only exists on Vercel, so its local 404 is expected.
function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    if (msg.location().url.includes('/_vercel/insights')) return;
    if (msg.text().startsWith('Failed to load resource')) return;
    errors.push(`console: ${msg.text()}`);
  });
  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('/_vercel/insights')) {
      errors.push(`http ${res.status()}: ${res.url()}`);
    }
  });
  return errors;
}

for (const timezoneId of ['UTC', 'America/Los_Angeles', 'Australia/Sydney']) {
  test.describe(`browser in ${timezoneId}`, () => {
    test.use({ timezoneId });

    test('renders without errors', async ({ page }) => {
      const errors = watchForErrors(page);
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
      await expect(page.getByText('Now', { exact: true })).toBeVisible();
      const spine = page.getByRole('region', { name: 'Cycle of sacred time' });
      await expect(spine.getByRole('button', { expanded: false }).nth(4)).toBeVisible();

      // Open a spine event and the hero panel.
      await spine.getByRole('button', { expanded: false }).nth(3).click();
      await expect(page.locator('.detail-panel')).toHaveCount(1);
      await page.getByRole('button', { name: /^Moon in / }).click();
      await expect(page.getByText(/^Moon in \w+$/).first()).toBeVisible();

      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
    });
  });
}

test('remembers the selected timezone across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Timezone').selectOption('Australia/Sydney');
  await page.reload();
  await expect(page.getByLabel('Timezone')).toHaveValue('Australia/Sydney');
});

test('still renders when site storage is blocked', async ({ page }) => {
  const errors = watchForErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
  await page.getByLabel('Timezone').selectOption('America/New_York');
  await page.getByRole('button', { name: /^Moon in / }).click();
  expect(errors).toEqual([]);
});
