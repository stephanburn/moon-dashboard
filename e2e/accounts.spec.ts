import { test, expect, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { userSettings, user as userTable } from '../src/server/db/schema';
import { E2E_DATABASE_URL, seedSignedInUser, testDb } from './accounts';

// Runs only when E2E_DATABASE_URL points at a migrated Postgres (CI sets it).
test.skip(!E2E_DATABASE_URL, 'E2E_DATABASE_URL not set');

function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    if (msg.location().url.includes('/_vercel/insights')) return;
    if (msg.text().startsWith('Failed to load resource')) return;
    errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

async function syncedTimezone(userId: string) {
  const [row] = await testDb().select().from(userSettings).where(eq(userSettings.userId, userId));
  return row?.timezone ?? null;
}

test.describe('signed out', () => {
  test('dashboard offers sign-in and settings needs an account', async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto('/');
    await expect(page.getByRole('link', { name: "Members' sign in" })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Account/ })).toHaveCount(0);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole('button', { name: 'Continue with Discord' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('sign-in sends the user to Discord asking for server membership', async ({ page }) => {
    await page.route('https://discord.com/**', route => route.fulfill({ body: 'discord' }));
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Continue with Discord' }).click();
    await page.waitForURL(/^https:\/\/discord\.com\//);
    const url = new URL(page.url());
    expect(url.searchParams.get('client_id')).toBe('e2e-client-id');
    expect(url.searchParams.get('scope')?.split(' ')).toEqual(
      expect.arrayContaining(['identify', 'email', 'guilds.members.read']),
    );
  });

  test('a refused sign-in explains why', async ({ page }) => {
    await page.goto('/signin?error=unable_to_get_user_info');
    await expect(page.getByRole('alert').filter({ hasText: "isn't a member of the server" })).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('timezone choice syncs to the account and follows to a new device', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Morgana');

    const laptop = await browser.newContext({ timezoneId: 'Europe/London' });
    await laptop.addCookies(cookies);
    const page = await laptop.newPage();
    const errors = watchForErrors(page);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Morgana' })).toBeVisible();
    await expect(page.getByRole('link', { name: "Members' sign in" })).toHaveCount(0);

    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Australia/Sydney');
    await expect.poll(() => syncedTimezone(user.id)).toBe('Australia/Sydney');
    expect(errors).toEqual([]);
    await laptop.close();

    // A different device: nothing in localStorage, browser in another zone.
    const phone = await browser.newContext({ timezoneId: 'America/Los_Angeles' });
    await phone.addCookies(cookies);
    const phonePage = await phone.newPage();
    await phonePage.goto('/');
    await expect(phonePage.getByRole('combobox', { name: 'Timezone' })).toHaveValue('Australia/Sydney');
    await phone.close();
  });

  test('a device choice made before signing up is uploaded', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Tamsin');
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('moon-dashboard-timezone', 'Asia/Tokyo'));
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Tamsin' })).toBeVisible();
    await expect.poll(() => syncedTimezone(user.id)).toBe('Asia/Tokyo');
    await context.close();
  });

  test('settings page signs out', async ({ browser }) => {
    const { cookies } = await seedSignedInUser('Rowan');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Rowan' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: "Members' sign in" })).toBeVisible();
    await context.close();
  });

  test('deleting the account removes it', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Hazel');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/settings');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await expect(page).toHaveURL(/\/$/);
    const rows = await testDb().select().from(userTable).where(eq(userTable.id, user.id));
    expect(rows).toEqual([]);
    await context.close();
  });
});
