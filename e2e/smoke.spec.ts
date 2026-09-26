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

// First visit, nothing saved: the page should follow the browser's zone.
// Asia/Calcutta is the legacy name Chrome reports for India; the selector
// lists Asia/Kolkata. Phoenix has no listed equivalent (no DST), and UTC is
// treated as a privacy setting.
for (const [timezoneId, expected] of [
  ['America/Los_Angeles', 'America/Los_Angeles'],
  ['Australia/Sydney', 'Australia/Sydney'],
  ['Asia/Calcutta', 'Asia/Kolkata'],
  ['America/Phoenix', 'America/Phoenix'],
  ['UTC', 'Europe/London'],
] as const) {
  test.describe(`first visit from ${timezoneId}`, () => {
    test.use({ timezoneId });

    test(`selects ${expected}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
      await expect(page.getByLabel('Timezone')).toHaveValue(expected);
    });
  });
}

test.describe('first visit from a zone outside the list', () => {
  test.use({ timezoneId: 'America/Phoenix' });

  test('offers it as "your timezone" and can switch back to it', async ({ page }) => {
    await page.goto('/');
    const select = page.getByLabel('Timezone');
    await expect(select.locator('option:checked')).toHaveText('America/Phoenix (your timezone)');
    await select.selectOption('America/Denver');
    await select.selectOption('America/Phoenix');
    await page.reload();
    await expect(select).toHaveValue('America/Phoenix');
  });
});

test.describe('a saved choice', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });

  test('beats the browser zone on a later visit from elsewhere', async ({ page, browser }) => {
    await page.goto('/');
    await page.getByLabel('Timezone').selectOption('Asia/Tokyo');
    const storageState = await page.context().storageState();

    const elsewhere = await browser.newContext({ timezoneId: 'Australia/Sydney', storageState });
    const later = await elsewhere.newPage();
    await later.goto(page.url());
    await expect(later.getByLabel('Timezone')).toHaveValue('Asia/Tokyo');
    await elsewhere.close();
  });
});

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

test('every disclosure shows a visible chevron and opens a panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
  const disclosures = page.locator('main button[aria-expanded]');
  const count = await disclosures.count();
  expect(count).toBeGreaterThan(5);
  for (let i = 0; i < count; i++) {
    const button = disclosures.nth(i);
    await expect(button.locator('[data-chevron]')).toBeVisible();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`#${await button.getAttribute('aria-controls')}`)).toBeVisible();
  }
});

test('the tap hint stays until something in the timeline is opened', async ({ page }) => {
  const hint = page.getByText(/reveal its meaning/);
  await page.goto('/');
  await expect(hint).toBeVisible();

  // Opening the moon alone doesn't prove the timeline has been found.
  await page.getByRole('button', { name: /^Moon in / }).click();
  await expect(hint).toBeVisible();

  const spine = page.getByRole('region', { name: 'Cycle of sacred time' });
  await spine.getByRole('button', { expanded: false }).nth(2).click();
  await expect(hint).toBeHidden();

  await page.reload();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
  await expect(hint).toBeHidden();
});

test('daily craft shows an activity and draws another', async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: "Today's craft" }).click();
  const panel = page.locator('#spine-panel-craft');
  const activity = panel.locator('p[aria-live]');
  const first = await activity.textContent();
  expect(first?.length).toBeGreaterThan(20);
  expect(first!.length).toBeLessThanOrEqual(130);

  await panel.getByRole('button', { name: 'Draw another' }).click();
  await expect(activity).not.toHaveText(first!);
  const second = await activity.textContent();

  // The re-rolled choice is kept across a reload.
  await page.reload();
  await page.getByRole('button', { name: "Today's craft" }).click();
  await expect(page.locator('#spine-panel-craft p[aria-live]')).toHaveText(second!);
  expect(errors).toEqual([]);
});
