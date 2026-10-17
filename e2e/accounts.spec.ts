import { test, expect, type Page, type Route } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { purgeOldLogs } from '../src/server/activity';
import { session as sessionTable, signInLog, userSettings, user as userTable, visitLog } from '../src/server/db/schema';
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
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('scope')?.split(' ')).toEqual(
      expect.arrayContaining(['identify', 'email', 'guilds.members.read']),
    );
  });

  test('a refused sign-in explains why', async ({ page }) => {
    await page.goto('/signin?error=unable_to_get_user_info');
    await expect(page.getByRole('alert').filter({ hasText: "isn't in our server" })).toBeVisible();
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

  test('the seasonal wheel syncs to the account and follows to a new device', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Seren');
    const laptop = await browser.newContext({ timezoneId: 'Europe/London' });
    await laptop.addCookies(cookies);
    const page = await laptop.newPage();
    await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Seren' })).toBeVisible();
    await page.getByRole('button', { name: /^Samhain/ }).click();
    await page.getByRole('combobox', { name: 'Seasonal wheel' }).selectOption('south');
    const syncedWheel = async () => {
      const [row] = await testDb().select().from(userSettings).where(eq(userSettings.userId, user.id));
      return row?.wheel ?? null;
    };
    await expect.poll(syncedWheel).toBe('south');
    await laptop.close();

    const phone = await browser.newContext({ timezoneId: 'Europe/London' });
    await phone.addCookies(cookies);
    const phonePage = await phone.newPage();
    await phonePage.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
    await phonePage.goto('/');
    await expect(phonePage.getByRole('button', { name: /^Beltane/ })).toBeVisible();
    await phone.close();
  });

  test("an account with no zone keeps the one the dashboard shows", async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Niamh');
    // Nothing saved anywhere: the dashboard shows the browser's own zone.
    const context = await browser.newContext({ timezoneId: 'Australia/Sydney' });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Niamh' })).toBeVisible();
    await expect.poll(() => syncedTimezone(user.id)).toBe('Australia/Sydney');
    await context.close();
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

  test('dashboard visits are counted per day', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Elspeth');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    for (let i = 0; i < 2; i++) {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Account: Elspeth' })).toBeVisible();
    }
    const visits = () => testDb().select().from(visitLog).where(eq(visitLog.userId, user.id));
    await expect.poll(async () => (await visits()).map(v => v.count)).toEqual([2]);
    await context.close();
  });

  test('settings page keeps the zone this device is already using', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Brigid');
    const context = await browser.newContext({ timezoneId: 'Europe/London' });
    await context.addCookies(cookies);
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await page.goto('/settings');
    await expect(page.getByText('This one is using Europe/London.')).toBeVisible();

    await page.getByRole('button', { name: 'Use Europe/London everywhere' }).click();
    await expect(page.getByText('used on every device you sign in on')).toBeVisible();
    expect(await syncedTimezone(user.id)).toBe('Europe/London');

    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Asia/Tokyo');
    await expect.poll(() => syncedTimezone(user.id)).toBe('Asia/Tokyo');
    expect(errors).toEqual([]);
    await context.close();
  });

  test('the admin page is invisible to members', async ({ browser }) => {
    const { cookies } = await seedSignedInUser('Ffion');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/settings');
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
    const res = await page.goto('/admin');
    expect(res?.status()).toBe(404);
    await context.close();
  });

  test('admins see members and refused sign-ins', async ({ browser }) => {
    // Unique names: the e2e database keeps earlier runs' rows.
    const name = `Isolde ${crypto.randomUUID().slice(0, 8)}`;
    const stranger = `stranger_${crypto.randomUUID().slice(0, 8)}`;
    const { user, cookies } = await seedSignedInUser(name);
    await testDb().update(userTable).set({ isAdmin: true }).where(eq(userTable.id, user.id));
    await testDb().insert(signInLog).values({
      outcome: 'refused',
      discordId: '42',
      discordName: stranger,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1',
    });
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await page.goto('/settings');
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible();
    const members = page.getByRole('region', { name: /^Members/ });
    await expect(members.getByText(name)).toBeVisible();
    const signIns = page.getByRole('region', { name: /^Sign-ins/ });
    const refusedRow = signIns.getByRole('listitem').filter({ hasText: stranger });
    await expect(refusedRow).toContainText('refused, not in the server');
    await expect(refusedRow).toContainText('Safari on iPhone');
    expect(errors).toEqual([]);
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

  test('sessions do not renew, so membership is checked again after 30 days', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Bronwen');
    // 29 days in: a renewing session would be pushed out to 30 days again.
    const day = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + day);
    await testDb()
      .update(sessionTable)
      .set({ expiresAt, createdAt: new Date(Date.now() - 29 * day), updatedAt: new Date(Date.now() - 29 * day) })
      .where(eq(sessionTable.userId, user.id));
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const me = await (await context.request.get('/api/me')).json();
    expect(me.user?.name).toBe('Bronwen');
    const [row] = await testDb().select().from(sessionTable).where(eq(sessionTable.userId, user.id));
    expect(row.expiresAt.getTime()).toBe(expiresAt.getTime());
    await context.close();
  });

  test('an admin can sign a member out everywhere', async ({ browser }) => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const member = await seedSignedInUser(`Gwen ${suffix}`);
    const admin = await seedSignedInUser(`Admin ${suffix}`);
    await testDb().update(userTable).set({ isAdmin: true }).where(eq(userTable.id, admin.user.id));
    const context = await browser.newContext();
    await context.addCookies(admin.cookies);
    const page = await context.newPage();
    await page.goto('/admin');
    const revoke = page.getByRole('button', { name: `Sign out everywhere: Gwen ${suffix}` });
    await revoke.click();
    await expect(revoke).toHaveCount(0);
    const sessions = await testDb().select().from(sessionTable).where(eq(sessionTable.userId, member.user.id));
    expect(sessions).toEqual([]);
    await context.close();
  });

  test('a save that finds the session gone signs the dashboard out', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Linnea');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Linnea' })).toBeVisible();
    await testDb().delete(sessionTable).where(eq(sessionTable.userId, user.id));
    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Asia/Tokyo');
    await expect(page.getByRole('link', { name: "Members' sign in" })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Account: Linnea' })).toHaveCount(0);
    await context.close();
  });

  test('settings says so when a save finds the session cookie expired', async ({ browser }) => {
    const { cookies } = await seedSignedInUser('Eira');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Eira' })).toBeVisible();
    await context.clearCookies();
    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Asia/Tokyo');
    await expect(page.getByRole('alert').filter({ hasText: "You've been signed out" })).toBeVisible();
    await context.close();
  });

  // Better Auth clears the cookie of a session it can't find, which makes
  // Next re-render the page, and settings then sends the visitor to sign in.
  test('settings sends a revoked session to sign in on the next save', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Carys');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Carys' })).toBeVisible();
    await testDb().delete(sessionTable).where(eq(sessionTable.userId, user.id));
    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Asia/Tokyo');
    await expect(page).toHaveURL(/\/signin$/);
    await context.close();
  });

  test('an account check that keeps failing says so and can be retried', async ({ browser }) => {
    const { cookies } = await seedSignedInUser('Saoirse');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    await context.route('**/api/me', route => route.fulfill({ status: 503, body: '' }));
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText("Members' accounts can't be reached right now.")).toBeVisible({ timeout: 10_000 });
    await context.unroute('**/api/me');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('link', { name: 'Account: Saoirse' })).toBeVisible();
    await context.close();
  });

  test('a timezone that fails to sync says so and can be retried', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Morwenna');
    const context = await browser.newContext({ timezoneId: 'Europe/London' });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Morwenna' })).toBeVisible();
    await expect.poll(() => syncedTimezone(user.id)).toBe('Europe/London');

    const failActions = (route: Route) =>
      route.request().headers()['next-action'] ? route.abort() : route.fallback();
    await page.route('**/*', failActions);
    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('Asia/Tokyo');
    const notice = page.getByRole('status').filter({ hasText: "Couldn't save that" });
    await expect(notice).toBeVisible();

    await page.unroute('**/*', failActions);
    await notice.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => syncedTimezone(user.id)).toBe('Asia/Tokyo');
    await expect(notice).toHaveCount(0);
    await context.close();
  });
});

test.describe('log retention', () => {
  test('the purge endpoint refuses requests without the cron secret', async ({ request }) => {
    // The server under test has no CRON_SECRET, so even this is refused.
    const res = await request.get('/api/cron/purge-logs', { headers: { authorization: 'Bearer undefined' } });
    expect(res.status()).toBe(401);
  });

  test('logs older than 90 days are purged, newer ones kept', async () => {
    const { user } = await seedSignedInUser('Maren');
    const now = new Date('2026-10-17T12:00:00Z');
    await testDb().insert(signInLog).values([
      { outcome: 'signed-in', userId: user.id, at: new Date('2026-07-19T11:00:00Z') },
      { outcome: 'signed-in', userId: user.id, at: new Date('2026-07-19T13:00:00Z') },
    ]);
    await testDb().insert(visitLog).values([
      { userId: user.id, day: '2026-07-18' },
      { userId: user.id, day: '2026-07-19' },
    ]);
    await purgeOldLogs(now, testDb());
    const signIns = await testDb().select().from(signInLog).where(eq(signInLog.userId, user.id));
    expect(signIns.map(r => r.at.toISOString())).toEqual(['2026-07-19T13:00:00.000Z']);
    const visits = await testDb().select().from(visitLog).where(eq(visitLog.userId, user.id));
    expect(visits.map(r => r.day)).toEqual(['2026-07-19']);
  });
});
