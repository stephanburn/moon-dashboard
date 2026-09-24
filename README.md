# Moon Dashboard

A personal moon / sabbat dashboard — moon phases, zodiac transits, and the Wheel of the Year, computed locally. No backend, no database, no external data APIs. The page is statically prerendered (ISR, hourly) and all values are recomputed in the browser; Vercel Analytics records page views.

**Live:** [moon.terriblerealms.com](https://moon.terriblerealms.com)

## What it does

- **Hero moon** — a photographic lunar disc masked by a translucent shadow computed from true illuminated fraction and hemisphere, with the current phase name and peak time ("peaked yesterday" / "peaks in 3 days").
- **Cycle spine** — a single vertical timeline: a "Now" node (Sun sign, Venus sign, today's sabbat) followed by upcoming events — moon phases, sun sign ingresses, sabbats, Venus ingresses, Mercury retrograde, Hekate's Deipnon — each with relative-time labels and an inline detail panel of correspondences (colours, crystals, herbs, ritual notes).
- **Hemisphere-aware Wheel of the Year** — switching timezone to a Southern Hemisphere city automatically inverts the sabbat calendar.
- **Mercury retrograde badge**, dynamic OG image for link previews, deploy commit hash in the footer.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `astronomy-engine` for moon phase timing and illumination, Vitest for tests. Deployed on Vercel.

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
    moon.ts               -- moon phase, peaks, upcoming quarters, Deipnon (astronomy-engine)
    moonDisc.ts           -- SVG geometry for the lit portion of the lunar disc
    astro.ts              -- sun sign (fixed date table) + moon sign (Meeus approximation)
    sabbats.ts            -- Wheel of the Year calendar (hemisphere-aware)
    planets.ts            -- Mercury retrograde + Venus ingress lookup tables
    events.ts             -- SpineEvent union; merges all event kinds into one sorted list
    dashboardModel.ts     -- pure (now, timezone) -> everything the dashboard shows
    days.ts               -- CalendarDay ('YYYY-MM-DD') vs instants; dayOf(instant, tz)
    names.ts              -- SignName / SabbatName / PhaseName unions used as content keys
    timezones.ts          -- selectable zones, hemisphere lookup, stored-value validation
    format.ts             -- all date/time formatting
    config.ts             -- DEFAULT_TZ, PLANET_DATA_EXPIRY, SABBAT_DATA_EXPIRY
    __tests__/            -- Vitest suite
  data/
    *Correspondences.ts   -- correspondence content, kept separate from logic
  components/
    Dashboard.tsx         -- main client component, holds all app state
    CycleSpine.tsx        -- the "Now" node + upcoming-event timeline
    MoonDisc.tsx          -- photographic moon + phase-shadow mask
    DetailPanel.tsx       -- expand/collapse panel chrome (animation, close button)
    details.tsx           -- the content of every detail panel
    eventKinds.tsx        -- per-event-kind icon, title and detail (the registry)
    TimezoneSelector.tsx  -- zone <select> (persistence is handled in Dashboard)
```

`planets.ts` is a hand-maintained lookup table that expires end of 2027 (`PLANET_DATA_EXPIRY` in `config.ts`). The tables are cross-checked against `astronomy-engine` by `planetsTruth.test.ts`.

## Development

```bash
npm install
npm run dev
npm test          # Vitest, device TZ pinned to Europe/London
npm run test:tz   # the suite under four device timezones
```

Before committing: `npx tsc --noEmit`, `npx eslint` and `npm run test:tz` should all be clean. CI (`.github/workflows/ci.yml`) runs the same checks plus `next build` on every push.
