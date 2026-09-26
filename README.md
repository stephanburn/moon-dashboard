# Moon Dashboard

A personal moon / sabbat dashboard — moon phases, zodiac transits, and the Wheel of the Year, computed locally. No backend, no database, no external data APIs. The page shell is statically prerendered (ISR, hourly, so the date-stamped OG tag advances); everything time-dependent is computed only in the browser. Vercel Analytics records page views.

**Live:** [moon.terriblerealms.com](https://moon.terriblerealms.com)

## What it does

- **Hero moon** — a photographic lunar disc masked by a translucent shadow computed from true illuminated fraction and hemisphere, with the current phase name and peak time ("peaked yesterday" / "peaks in 3 days").
- **Cycle spine** — a single vertical timeline: a "Now" node (Sun sign, Venus sign, today's sabbat) followed by upcoming events — moon phases, sun sign ingresses, sabbats, Venus ingresses (including retrograde re-entries), Mercury retrograde (with its shadow period), Hekate's Deipnon — each with relative-time labels and an inline detail panel of correspondences (colours, crystals, herbs, ritual notes).
- **Timezone-correct days** — opens in the browser's own timezone (any IANA zone, not just the listed ones) unless the viewer has picked one. Every date is the calendar day in that zone, so e.g. the September 2026 equinox is Mabon on 22 Sep in New York and 23 Sep in London. Daylight saving comes from the browser's tz database; a time in the repeated hour after clocks go back carries its zone ("01:30 BST" / "01:30 GMT").
- **Hemisphere-aware Wheel of the Year** — switching timezone to a Southern Hemisphere city automatically inverts the sabbat calendar and its date notes.
- **Mercury retrograde badge**, dynamic OG image for link previews, deploy commit hash in the footer.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `astronomy-engine` for all astronomical calculations, Vitest for tests. Deployed on Vercel.

## Architecture

```
src/
  app/
    page.tsx              -- thin server shell, renders <Dashboard /> (ISR, revalidate 1h)
    layout.tsx            -- root layout, fonts, Vercel Analytics
    globals.css           -- design tokens, starfield, spine styling
    error.tsx             -- error boundary (offers to clear the stored timezone)
    opengraph-image.tsx   -- dynamic, date-stamped Open Graph image
  lib/
    ephemeris.ts          -- ecliptic longitude, sign changes, stations, longitude crossings
    moon.ts               -- moon phase, peaks, upcoming quarters
    moonDisc.ts           -- SVG geometry for the lit portion of the lunar disc
    astro.ts              -- sun sign and ingresses, moon sign and ingresses
    sabbats.ts            -- Wheel of the Year (hemisphere-aware; solstices/equinoxes from Seasons())
    planets.ts            -- Mercury retrogrades with shadows, Venus ingresses (cached per day)
    events.ts             -- SpineEvent union; merges all event kinds into one sorted list
    dashboardModel.ts     -- pure (now, timezone) -> everything the dashboard shows
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

Before committing: `npx tsc --noEmit`, `npx eslint` and `npm run test:tz` should all be clean (plus `npm run test:e2e` for UI changes). CI (`.github/workflows/ci.yml`) runs the same checks plus the Playwright smoke tests (which include `next build`) on every push.
