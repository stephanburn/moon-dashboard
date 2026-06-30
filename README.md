# Moon Dashboard

A personal moon / sabbat dashboard — moon phases, zodiac transits, and the Wheel of the Year, computed locally and rendered client-side. No backend, no database, no external APIs.

**Live:** [moon.terriblerealms.com](https://moon.terriblerealms.com)

## What it does

- **Hero moon** — a photographic lunar disc masked by a translucent shadow computed from true illuminated fraction and hemisphere, with the current phase name and peak time ("peaked yesterday" / "peaks in 3 days").
- **Cycle spine** — a single vertical timeline: a "Now" node (Sun sign, Venus sign, today's sabbat) followed by upcoming events — moon phases, sun sign ingresses, sabbats, Venus ingresses, Mercury retrograde, Hekate's Deipnon — each with relative-time labels and an inline detail panel of correspondences (colours, crystals, herbs, ritual notes).
- **Hemisphere-aware Wheel of the Year** — switching timezone to a Southern Hemisphere city automatically inverts the sabbat calendar.
- **Mercury retrograde badge**, dynamic OG image for link previews, deploy commit hash in the footer.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `suncalc` + `astronomy-engine` for lunar calculations. Deployed on Vercel.

## Architecture

```
src/
  app/
    page.tsx          -- thin server shell, renders <Dashboard />
    layout.tsx         -- root layout, fonts
    globals.css         -- design tokens, starfield, glass cards
    api/og/             -- dynamic Open Graph image route
  lib/
    moon.ts             -- moon phase calculations (suncalc + astronomy-engine)
    moonDisc.ts          -- illuminated fraction / shadow geometry for the lunar disc
    astro.ts             -- sun sign + moon sign (ecliptic longitude)
    sabbats.ts            -- Wheel of the Year calendar (hemisphere-aware)
    planets.ts             -- Mercury retrograde + Venus ingress lookup tables
    upcomingEvents.ts       -- merges all event types into one sorted list
    config.ts                -- DEFAULT_TZ + PLANET_DATA_EXPIRY constants
  data/
    *Correspondences.ts       -- correspondence content, kept separate from logic
  components/
    Dashboard.tsx               -- main client component, holds all app state
    MoonDisc.tsx                  -- photographic moon + phase-shadow mask
    DetailPanel.tsx                -- expand/collapse correspondence panel
    TimezoneSelector.tsx
```

`planets.ts` is a hand-maintained lookup table that expires end of 2027 (`PLANET_DATA_EXPIRY` in `config.ts`).

## Development

```bash
npm install
npm run dev
```

Before committing: `npx tsc --noEmit` and `npx eslint` should both be clean.
