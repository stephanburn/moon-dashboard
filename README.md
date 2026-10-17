# Moon Dashboard

A personal moon / sabbat dashboard — moon phases, zodiac transits, and the Wheel of the Year, computed locally with no external data APIs. The page shell is statically prerendered (ISR, hourly, so the date-stamped OG tag advances); everything time-dependent is computed only in the browser. Vercel Analytics records anonymous page views.

Optional member accounts (Discord sign-in for members of one server, Postgres) sync preferences across devices. The dashboard never needs them: signed out, or with accounts switched off, it works the same, and it learns about the visitor only after it has rendered.

**Live:** [moon.terriblerealms.com](https://moon.terriblerealms.com)

## What it does

- **Hero moon** — a photographic lunar disc masked by a translucent shadow computed from true illuminated fraction and hemisphere, with the current phase name and peak time ("peaks today at 17:49" / "peaks tomorrow" / "peaked yesterday", else the date).
- **Cycle spine** — a single vertical timeline: a "Now" node (Sun sign, Venus sign, today's sabbat) followed by upcoming events — moon phases, sun sign ingresses, sabbats, Venus ingresses (including retrograde re-entries), Mercury retrograde (with its shadow period), Hekate's Deipnon — each with relative-time labels and an inline detail panel of correspondences (colours, crystals, herbs, ritual notes).
- **Timezone-correct days** — opens in the browser's own timezone (any IANA zone, not just the listed ones) unless the viewer has picked one. Every date is the calendar day in that zone, so e.g. the September 2026 equinox is Mabon on 22 Sep in New York and 23 Sep in London. Daylight saving comes from the browser's tz database; a time in the repeated hour after clocks go back carries its zone ("01:30 BST" / "01:30 GMT").
- **Seasonal wheel** — the Wheel of the Year follows the timezone by default (a Southern Hemisphere zone inverts the sabbat calendar and its date notes), or can be set to Northern or Southern from any sabbat panel, independently of the zone used for times. The moon is always drawn for the timezone's hemisphere.
- **Daily Craft** — a suggested activity for the day, drawn from the moon, sun sign, day ruler and nearby sabbats, with a re-roll.
- **Mercury retrograde** badge, plus the current retrograde or post-shadow period in the Now node; dynamic OG image for link previews; deploy commit hash in the footer.
- **Member accounts** (when configured) — sign in with Discord if you're in the server; timezone and seasonal wheel follow you to every device. See [Accounts and privacy](#accounts-and-privacy).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `astronomy-engine` for all astronomical calculations, Vitest and Playwright for tests. Accounts: Better Auth (Discord), Drizzle ORM, Postgres (Neon). Deployed on Vercel, with a daily Vercel Cron job.

## Accounts and privacy

Accounts switch on only in builds where `DATABASE_URL`, `BETTER_AUTH_SECRET` and the three `DISCORD_` variables are all set; otherwise the account routes 404. Setup and the longer plan are in [docs/accounts-plan.md](docs/accounts-plan.md).

- Sign-in is limited to members of one Discord server, checked at every sign-in. Sessions last 30 days from sign-in and are not extended by use, so membership is checked again at least monthly. An admin can sign a member out everywhere from `/admin`.
- Stored for each member: Discord name and avatar, saved timezone and seasonal wheel, sign-in times with IP address and browser, and a count of dashboard visits per day. Refused sign-ins (not in the server) are logged with the Discord name and ID where known, plus IP address and browser.
- Sign-in and visit logs are deleted after 90 days (`/api/cron/purge-logs`, daily). Deleting an account removes everything linked to it at once; refused-sign-in rows have no account and age out with the logs.
- There is no export yet; it has to exist before any personal writing is stored.

## Architecture

```
src/
  app/
    page.tsx              -- thin server shell, renders <Dashboard /> (ISR, revalidate 1h)
    layout.tsx            -- root layout, fonts, Vercel Analytics
    globals.css           -- design tokens, starfield, spine styling
    error.tsx             -- error boundary (on the dashboard, offers to clear the stored timezone)
    opengraph-image.tsx   -- dynamic, date-stamped Open Graph image
    signin/ settings/ admin/      -- account pages (404 when accounts are off)
    api/me/               -- who is signed in, plus their synced settings (fetched after mount)
    api/auth/[...all]/    -- Better Auth handler
    api/cron/purge-logs/  -- daily 90-day log purge (CRON_SECRET)
  lib/
    ephemeris.ts          -- ecliptic longitude, sign changes, stations, longitude crossings
    moon.ts               -- moon phase, peaks, upcoming quarters
    moonDisc.ts           -- SVG geometry for the lit portion of the lunar disc
    astro.ts              -- sun sign and ingresses, moon sign and ingresses
    sabbats.ts            -- Wheel of the Year (hemisphere-aware; solstices/equinoxes from Seasons())
    planets.ts            -- Mercury retrogrades with shadows, Venus ingresses (cached per day)
    events.ts             -- SpineEvent union; merges all event kinds into one sorted list
    dashboardModel.ts     -- pure (now, timezone, wheel) -> everything the dashboard shows
    wheel.ts              -- seasonal wheel choice ('auto' | 'north' | 'south')
    craft.ts              -- Daily Craft context and picks
    account.ts            -- account types shared by client and server; ACCOUNTS_ENABLED
    days.ts               -- CalendarDay ('YYYY-MM-DD') vs instants; dayOf(instant, tz)
    names.ts              -- SignName / SabbatName / PhaseName unions used as content keys
    timezones.ts          -- selectable zones, browser-zone detection, hemisphere lookup, stored-value validation
    format.ts             -- all date/time formatting
    storage.ts            -- localStorage helpers that never throw
    config.ts             -- DEFAULT_TZ
    __tests__/            -- Vitest suite
  data/
    *Correspondences.ts   -- correspondence content, keyed by SignName / SabbatName / PhaseName
  components/
    Dashboard.tsx         -- main client component, holds all app state
    CycleSpine.tsx        -- the "Now" node + upcoming-event timeline
    MoonDisc.tsx          -- photographic moon + phase-shadow mask
    DetailPanel.tsx       -- expand/collapse panel chrome (animation, close button)
    details.tsx           -- the content of every detail panel
    eventKinds.tsx        -- per-event-kind icon, title and detail (the registry)
    DashboardSkeleton.tsx -- what the server renders: layout placeholders, no dates
    TimezoneSelector.tsx  -- zone <select>, plus the browser's zone if unlisted (persistence is handled in Dashboard)
    WheelSelector.tsx     -- seasonal wheel <select>, shown in sabbat panels and settings
    useAccount.ts         -- account state after mount, timezone/wheel sync, failure states
    AccountButton.tsx     -- avatar link to /settings
  server/                 -- server-only: Drizzle schema and pool (db/), Better Auth (auth.ts),
                             Discord membership check, Server Actions, settings, activity logs,
                             admin queries, cron
drizzle/                  -- SQL migrations (applied by vercel-build before each build)
```

Every astronomical value is computed with `astronomy-engine`; there are no hand-maintained tables and nothing expires. `ephemeris.test.ts` checks the results against published almanac values.

## Development

```bash
npm install
npm run dev
npm test          # Vitest, device TZ pinned to Europe/London
npm run test:tz   # the suite under four device timezones
npm run test:e2e  # Playwright smoke tests against a production build
                  # (first time locally: npx playwright install chromium)
```

Before committing: `npx tsc --noEmit`, `npx eslint` and `npm run test:tz` should all be clean (plus `npm run test:e2e` for UI changes). CI (`.github/workflows/ci.yml`) runs the same checks plus the Playwright tests (which include `next build`) on every push, with a Postgres service so the account tests run too.

### With accounts

Without account variables the app runs with accounts off, which is all most changes need. To work on accounts locally:

```bash
cp .env.example .env.local   # then fill in DATABASE_URL, BETTER_AUTH_SECRET and the DISCORD_ values
npm run db:migrate           # reads .env.local; fails if DATABASE_URL is missing
npm run dev
```

After changing `src/server/db/schema.ts`, run `npm run db:generate` and commit the new migration in `drizzle/`. Migrations must keep working with the previous deployment, since `vercel-build` applies them before the new build goes live.

The account e2e tests seed sessions directly, so they need a disposable Postgres, never a real one: `E2E_DATABASE_URL=postgres://... npm run test:e2e`. Without `E2E_DATABASE_URL`, the e2e server runs with accounts explicitly off and no migrations, whatever `.env.local` holds.
