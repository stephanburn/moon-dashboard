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
    // With nosniff, Chrome also reports the 404 as a script it refused to run.
    if (msg.location().url.includes('/_vercel/insights') || msg.text().includes('/_vercel/insights')) return;
    if (msg.text().startsWith('Failed to load resource')) return;
    // WebKit notes that the report-only CSP has nowhere to send reports.
    if (msg.text().includes("does not specify a 'report-to'")) return;
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

// First visit, nothing saved: the page follows the browser's zone, shown as
// the selector's "Automatic" option.
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

    test(`selects ${expected}`, async ({ page, browserName }) => {
      // WebKit's Intl keeps legacy zone names as given instead of
      // canonicalising them, so canonicalZone can't match Asia/Calcutta to
      // the listed Asia/Kolkata there.
      test.fixme(browserName === 'webkit' && timezoneId === 'Asia/Calcutta', 'legacy zone names unmatched in WebKit');
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(PHASE_NAME);
      const select = page.getByLabel('Timezone');
      await expect(select).toHaveValue('auto');
      await expect(select.locator('option:checked')).toHaveText(`Automatic (${expected.replace(/_/g, ' ')})`);
    });
  });
}

test.describe('first visit from a zone outside the list', () => {
  test.use({ timezoneId: 'America/Phoenix' });

  test('offers it as "your timezone" and can switch back to it', async ({ page }) => {
    await page.goto('/');
    const select = page.getByLabel('Timezone');
    await expect(select.locator('option:checked')).toHaveText('Automatic (America/Phoenix)');
    await expect(select.locator('option[value="America/Phoenix"]')).toHaveText('America/Phoenix (your timezone)');
    await select.selectOption('America/Denver');
    await select.selectOption('America/Phoenix');
    await page.reload();
    await expect(select).toHaveValue('America/Phoenix');
  });
});

test('choosing Automatic follows the device again', async ({ page, browser }) => {
  await page.goto('/');
  const select = page.getByLabel('Timezone');
  await select.selectOption('Asia/Tokyo');
  await select.selectOption('auto');
  const storageState = await page.context().storageState();

  // A later visit from another zone uses that zone, not Tokyo.
  const elsewhere = await browser.newContext({ timezoneId: 'Australia/Sydney', storageState });
  const later = await elsewhere.newPage();
  await later.goto(page.url());
  const laterSelect = later.getByLabel('Timezone');
  await expect(laterSelect).toHaveValue('auto');
  await expect(laterSelect.locator('option:checked')).toHaveText('Automatic (Australia/Sydney)');
  await elsewhere.close();
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

test('every disclosure shows a visible chevron and opens a panel', async ({ page, browserName }) => {
  // Opens every panel in turn; CI's WebKit takes about 3 s for each.
  test.slow(browserName === 'webkit');
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
    const panel = page.locator(`#${await button.getAttribute('aria-controls')}`);
    await expect(panel).toBeVisible();
    // Let the panel finish opening before the next click. At the bottom of the
    // page, scroll anchoring holds the next row still for a few frames of the
    // transition and then lets it move, so a click there can pass Playwright's
    // stability check and still have its pointerup land off the button.
    await panel.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
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

test('an active Mercury retrograde opens from the Now node', async ({ page }) => {
  // Mercury stationed retrograde on 24 Oct 2026, so its spine event has passed.
  await page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'));
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Mercury ℞ retrograde · until / });
  await trigger.click();
  const panel = page.locator('#spine-panel-mercury');
  await expect(panel).toContainText('Retrograde');
});

test('closing a panel returns focus to its trigger', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Moon in / });
  await trigger.click();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('detail panels do not animate with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /^Moon in / }).click();
  const duration = await page.locator('#detail-panel-hero-sign')
    .evaluate(el => getComputedStyle(el).transitionDuration);
  expect(duration).toBe('0s');
});

test('the seasonal wheel can be chosen apart from the timezone', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
  await page.goto('/');
  await page.getByLabel('Timezone').selectOption('Europe/London');
  await page.getByRole('button', { name: /^Samhain/ }).click();
  const wheel = page.getByRole('combobox', { name: 'Seasonal wheel' });
  await expect(wheel).toHaveValue('auto');
  await expect(wheel.locator('option[value="auto"]')).toHaveText('From timezone (Northern)');
  await wheel.selectOption('south');

  // Southern Beltane (1 November) replaces Samhain; times stay in London.
  await expect(page.getByRole('button', { name: /^Samhain/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Timezone')).toHaveValue('Europe/London');
  await page.getByRole('button', { name: /^Beltane/ }).click();
  await expect(page.getByRole('combobox', { name: 'Seasonal wheel' })).toHaveValue('south');
});

test.describe('event panels', () => {
  test.use({ timezoneId: 'Europe/London' });

  // Expected times are USNO's published values: Full Moon 26 Sep 2026 16:49
  // UTC, September equinox 23 Sep 00:05 UTC, New Moon 11 Sep (so the Deipnon
  // is today). The hero, not the spine, shows the New Moon itself.
  test('show when the event happens in the selected timezone', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-10T12:00:00Z'));
    await page.goto('/');
    const spine = page.getByRole('region', { name: 'Cycle of sacred time' });

    await spine.getByRole('button', { name: /^Full Moon/ }).click();
    await expect(page.locator('.detail-panel time')).toHaveText('Saturday 26 September 2026 at 17:49 BST');

    await spine.getByRole('button', { name: /^Autumn Equinox/ }).click();
    await expect(page.locator('.detail-panel time'))
      .toHaveText('Wednesday 23 September 2026, equinox at 01:05 BST');

    // An all-day observance shows the date alone.
    await spine.getByRole('button', { name: "Hekate's Deipnon Today" }).click();
    await expect(page.locator('.detail-panel time')).toHaveText('Thursday 10 September 2026');
  });
});

test('the footer explains how dates are calculated', async ({ page }) => {
  await page.goto('/');
  await page.getByText('How dates are calculated').click();
  await expect(page.getByText(/calendar day before the astronomical new moon/)).toBeVisible();
});

test('sends the security headers and breaks no content security rule', async ({ page }) => {
  // Report-only violations never block anything, so collect them directly.
  await page.addInitScript(() => {
    const w = window as unknown as { cspViolations: string[] };
    w.cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => {
      w.cspViolations.push(`${e.effectiveDirective}: ${e.blockedURI}`);
    });
  });
  const res = await page.goto('/');
  const headers = res!.headers();
  expect(headers['content-security-policy-report-only']).toContain("default-src 'self'");
  expect(headers['content-security-policy']).toBe("frame-ancestors 'none'");
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

  const spine = page.getByRole('region', { name: 'Cycle of sacred time' });
  await spine.getByRole('button', { expanded: false }).nth(3).click();
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([]);
});

test('the Open Graph image is a 1200x630 PNG', async ({ page, request }) => {
  await page.goto('/');
  const url = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(url).toBeTruthy();
  const res = await request.get(new URL(url!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/png');
  const png = await res.body();
  // PNG signature, then the IHDR chunk's width and height.
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
