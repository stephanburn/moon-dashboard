import { test, expect, type Page } from '@playwright/test';
import { E2E_DATABASE_URL, seedSignedInUser } from './accounts';

// The narrowest phone in use (iPhone SE, small Android), with everything the
// header can hold: the Mercury retrograde badge (Mercury is retrograde from
// 24 Oct to 13 Nov 2026), the widest listed zone name and, signed in, the
// account button. `body` clips horizontal overflow, so it would never show as
// a scrollbar; these checks measure the elements instead.
const LONGEST_ZONE = 'America/Buenos_Aires';

test.use({ viewport: { width: 320, height: 640 } });

/** Elements reaching past either edge of the viewport. */
function elementsWiderThanViewport(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.body.querySelectorAll('*')]
      // The glow behind the moon is meant to spill off the page.
      .filter(el => !el.closest('.moon-glow'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < -0.5 || r.right > width + 0.5);
      })
      .map(el => `${el.tagName.toLowerCase()}.${el.className}: ${el.textContent?.slice(0, 40)}`);
  });
}

/**
 * Header elements that are cut off: outside the header, narrower than their
 * own content, or (for the select) squeezed below the width that fits its
 * longest option.
 */
function clippedInHeader(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')!;
    const bounds = header.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const clipped: string[] = [];
    for (const el of header.querySelectorAll<HTMLElement>('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const name = `${el.tagName.toLowerCase()} "${el.textContent?.slice(0, 30)}"`;
      if (r.left < Math.max(bounds.left, 0) - 0.5 || r.right > Math.min(bounds.right, width) + 0.5) {
        clipped.push(`${name} is outside the header`);
      }
      if (el instanceof HTMLSelectElement) {
        const style = el.style.cssText;
        el.style.maxWidth = 'none';
        el.style.flexShrink = '0';
        const natural = el.getBoundingClientRect().width;
        el.style.cssText = style;
        if (r.width < natural - 0.5) clipped.push(`${name} is ${r.width}px, needs ${natural}px`);
      } else if (el.scrollWidth > el.clientWidth + 1) {
        clipped.push(`${name} overflows itself`);
      }
    }
    return clipped;
  });
}

async function checkLayout(page: Page, signedIn = false) {
  await page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'));
  await page.goto('/');
  if (signedIn) await expect(page.getByRole('link', { name: 'Account: Morgana' })).toBeVisible();
  await page.getByLabel('Timezone').selectOption(LONGEST_ZONE);
  await expect(page.getByLabel(/^Mercury retrograde until /)).toBeVisible();

  expect(await clippedInHeader(page)).toEqual([]);
  expect(await elementsWiderThanViewport(page)).toEqual([]);

  // Today's moon panel lists when the moon changes sign: both the sign and
  // the date must fit on the row.
  await page.getByRole('button', { name: /About this phase/ }).click();
  const panel = page.locator('#detail-panel-hero');
  await panel.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  const row = page.getByRole('button', { name: /^Moon enters / }).first();
  await row.scrollIntoViewIfNeeded();
  const sign = row.locator('span').first();
  const date = row.locator('span').last();
  await expect(sign).toHaveText(/^Moon enters \w+/);
  await expect(date).toHaveText(/\d/);
  // Measured directly: toBeInViewport reports 0 in WebKit's phone emulation.
  const { width, height } = page.viewportSize()!;
  const [signBox, dateBox] = [(await sign.boundingBox())!, (await date.boundingBox())!];
  for (const box of [signBox, dateBox]) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
  }
  expect(signBox.x + signBox.width).toBeLessThanOrEqual(dateBox.x);

  expect(await elementsWiderThanViewport(page)).toEqual([]);
}

test('320 px signed out: nothing overflows and nothing is clipped', async ({ page }) => {
  await checkLayout(page);
});

test('320 px signed in: nothing overflows and nothing is clipped', async ({ page }) => {
  test.skip(!E2E_DATABASE_URL, 'E2E_DATABASE_URL not set');
  const { cookies } = await seedSignedInUser('Morgana');
  await page.context().addCookies(cookies);
  await checkLayout(page, true);
});
