import { test, expect, type Page, type Route } from '@playwright/test';
import { eq } from 'drizzle-orm';
import './serverOnly';
import { purgeOldLogs } from '../src/server/activity';
import { consumeRateLimit } from '../src/server/rateLimit';
import { rateLimit, session as sessionTable, signInLog, userSettings, user as userTable, visitLog } from '../src/server/db/schema';
import { E2E_DATABASE_URL, seedSignedInUser, testDb } from './accounts';
import { E2E_PORT } from './env';

// Runs only when E2E_DATABASE_URL points at a migrated Postgres (CI sets it).
test.skip(!E2E_DATABASE_URL, 'E2E_DATABASE_URL not set');

function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    // With nosniff, Chrome also reports the 404 as a script it refused to run.
    if (msg.location().url.includes('/_vercel/insights') || msg.text().includes('/_vercel/insights')) return;
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

  test('dashboard loads close together count as one visit', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Elspeth');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    const row = async () => (await testDb().select().from(visitLog).where(eq(visitLog.userId, user.id)))[0];
    const load = async () => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Account: Elspeth' })).toBeVisible();
    };

    await load();
    await expect.poll(async () => (await row())?.count).toBe(1);
    const firstLast = (await row()).lastAt.getTime();
    await load();
    // The second load is recorded (last_at moves) but not counted.
    await expect.poll(async () => (await row()).lastAt.getTime()).toBeGreaterThan(firstLast);
    expect((await row()).count).toBe(1);

    // After a 30-minute gap, the next load is a new visit.
    await testDb()
      .update(visitLog)
      .set({ lastAt: new Date(Date.now() - 31 * 60_000) })
      .where(eq(visitLog.userId, user.id));
    await load();
    await expect.poll(async () => (await row()).count).toBe(2);
    await context.close();
  });

  test('the database rejects values the app never writes', async () => {
    const insertOutcome = testDb()
      .insert(signInLog)
      .values({ outcome: 'bogus' as 'refused', discordName: 'check-constraint test' });
    await expect(insertOutcome).rejects.toThrow();
    const { user } = await seedSignedInUser('Wren');
    const badWheel = testDb()
      .insert(userSettings)
      .values({ userId: user.id, wheel: 'east' as 'north' });
    await expect(badWheel).rejects.toThrow();
  });

  test('the admin member list pages', async ({ browser }) => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const admin = await seedSignedInUser(`Pagekeeper ${suffix}`);
    await testDb().update(userTable).set({ isAdmin: true }).where(eq(userTable.id, admin.user.id));
    // 51 members older than anyone else, so they need at least two pages.
    // Members other tests add meanwhile are newer and can't break the order.
    const names = Array.from({ length: 51 }, (_, i) => `Pager ${suffix} ${String(i).padStart(2, '0')}`);
    await testDb().insert(userTable).values(
      names.map((name, i) => ({
        id: `page-${suffix}-${i}`,
        name,
        email: `page-${suffix}-${i}@example.test`,
        createdAt: new Date(Date.UTC(2000, 0, 1) + i * 1000),
      })),
    );
    const context = await browser.newContext();
    await context.addCookies(admin.cookies);
    const page = await context.newPage();
    await page.goto('/admin');
    const members = page.getByRole('region', { name: /^Members/ });
    const seen: string[] = [];
    for (let pages = 1; ; pages++) {
      const items = members.getByRole('listitem');
      expect(await items.count()).toBeLessThanOrEqual(50);
      for (const text of await items.allInnerTexts()) {
        const name = names.find(n => text.includes(n));
        if (name) seen.push(name);
      }
      const older = page.getByRole('link', { name: 'Older members →' });
      if ((await older.count()) === 0) break;
      expect(pages).toBeLessThan(100);
      const current = page.url();
      await older.click();
      await page.waitForURL(url => url.toString() !== current);
    }
    // Every member exactly once, newest first.
    expect(seen).toEqual([...names].reverse());
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

test.describe('auth API surface', () => {
  test('a signed-in user cannot change their profile through Better Auth directly', async ({ request }) => {
    const { user, cookies } = await seedSignedInUser('Wren');
    // Sent the way a browser on the site would send it, so only the route
    // allowlist stands in the way.
    const res = await request.post('/api/auth/update-user', {
      headers: {
        cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
        origin: `http://localhost:${E2E_PORT}`,
      },
      data: { name: 'Not Wren', image: 'https://example.test/me.png' },
    });
    expect(res.status()).toBe(404);
    const [row] = await testDb().select().from(userTable).where(eq(userTable.id, user.id));
    expect(row.name).toBe('Wren');
    expect(row.image ?? null).toBe(user.image ?? null);
  });

  test('routes the app does not use answer 404', async ({ request }) => {
    for (const path of ['/api/auth/delete-user', '/api/auth/list-sessions', '/api/auth/ok']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});

test.describe('rate limits', () => {
  test('a key is refused past its limit until the window has passed', async () => {
    const key = `e2e:${crypto.randomUUID()}`;
    const rule = { window: 10, max: 3 };
    // An hour ahead, where Better Auth's own pruning (of rows over a minute
    // old) can't remove the row while other tests run.
    const start = Date.now() + 60 * 60_000;
    const at = (seconds: number) => consumeRateLimit(key, rule, start + seconds * 1000, testDb());
    expect([await at(0), await at(1), await at(2), await at(3)]).toEqual([true, true, true, false]);
    expect(await consumeRateLimit(`${key}:other`, rule, start + 3000, testDb())).toBe(true);
    expect(await at(13)).toBe(true);
  });

  test('Discord callbacks from one address are limited', async ({ request }) => {
    // A fresh address (Better Auth counts IPv6 per /64) each run, so earlier
    // runs don't count.
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16);
    const ip = `2001:db8:${hex()}:${hex()}::1`;
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request.get('/api/auth/callback/discord', { headers: { 'x-forwarded-for': ip }, maxRedirects: 0 });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 10)).not.toContain(429);
    expect(statuses[10]).toBe(429);
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

  test('rate-limit counts older than a day are purged', async () => {
    // A purge run long ago, so it can't touch rows other tests are using.
    const now = new Date('2026-01-01T12:00:00Z');
    const key = (name: string) => `e2e-purge:${crypto.randomUUID()}:${name}`;
    const stale = key('stale');
    const fresh = key('fresh');
    await testDb().insert(rateLimit).values([
      { id: crypto.randomUUID(), key: stale, count: 1, lastRequest: Date.parse('2025-12-31T11:59:00Z') },
      // In the future, out of reach of Better Auth's own pruning.
      { id: crypto.randomUUID(), key: fresh, count: 1, lastRequest: Date.now() + 60 * 60_000 },
    ]);
    await purgeOldLogs(now, testDb());
    const keys = (await testDb().select({ key: rateLimit.key }).from(rateLimit)).map(r => r.key);
    expect(keys).not.toContain(stale);
    expect(keys).toContain(fresh);
  });

  test('Automatic is kept on the account and each device follows its own zone', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Ottilie');
    const laptop = await browser.newContext({ timezoneId: 'Europe/London' });
    await laptop.addCookies(cookies);
    const page = await laptop.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Account: Ottilie' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Timezone' }).selectOption('auto');
    await expect.poll(() => syncedTimezone(user.id)).toBe('auto');
    await laptop.close();

    const phone = await browser.newContext({ timezoneId: 'Asia/Tokyo' });
    await phone.addCookies(cookies);
    const phonePage = await phone.newPage();
    await phonePage.goto('/');
    const select = phonePage.getByRole('combobox', { name: 'Timezone' });
    await expect(phonePage.getByRole('link', { name: 'Account: Ottilie' })).toBeVisible();
    await expect(select).toHaveValue('auto');
    await expect(select.locator('option:checked')).toHaveText('Automatic (Asia/Tokyo)');
    await phone.close();
  });

  test('signing out in one tab signs the dashboard out in another', async ({ browser }) => {
    const { cookies } = await seedSignedInUser('Bryony');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const dashboard = await context.newPage();
    await dashboard.goto('/');
    await expect(dashboard.getByRole('link', { name: 'Account: Bryony' })).toBeVisible();

    const settings = await context.newPage();
    await settings.goto('/settings');
    await settings.getByRole('button', { name: 'Sign out' }).click();
    await expect(settings).toHaveURL(/\/$/);

    await expect(dashboard.getByRole('link', { name: "Members' sign in" })).toBeVisible({ timeout: 10_000 });
    await expect(dashboard.getByRole('link', { name: 'Account: Bryony' })).toHaveCount(0);
    await context.close();
  });

  test('an open tab checking again does not count a visit', async ({ browser }) => {
    const { user, cookies } = await seedSignedInUser('Linden');
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const me = await (await context.request.get('/api/me?check=1')).json();
    expect(me.user?.name).toBe('Linden');
    // Give after() time to write, had it been going to.
    await new Promise(resolve => setTimeout(resolve, 1000));
    const visits = await testDb().select().from(visitLog).where(eq(visitLog.userId, user.id));
    expect(visits).toEqual([]);
    await context.close();
  });
});
