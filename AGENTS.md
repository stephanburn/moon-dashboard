<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project orientation

A personal moon / sabbat dashboard. Single page, no backend, no DB, no external data APIs — everything is computed locally. The page is statically prerendered with ISR (`revalidate = 3600`) and hydrated; all real values are recomputed in the browser. Aesthetic and astronomical/spiritual accuracy matter more than generic SaaS patterns.

**Stack:** Next.js 16 (App Router), React 19, Tailwind v4, `astronomy-engine` (moon phases/illumination), Vitest. Deployed on Vercel with Vercel Analytics.

**Shape:**
- `src/app/page.tsx` is a thin server shell; the whole app is `src/components/Dashboard.tsx` (one `'use client'` component holding all state).
- `src/lib/` = calculations (moon, moonDisc, astro, sabbats, planets), `events.ts` (the `SpineEvent` union), `dashboardModel.ts` (pure `buildDashboardModel(now, timezone)`: everything the UI shows), `days.ts` (calendar days), `names.ts` (name unions), `timezones.ts`, `format.ts` (all formatting), `config.ts`. Tests in `src/lib/__tests__/`.
- `src/data/` = correspondence content (phases, signs, sabbats, Venus, moon-in-sign), kept separate from logic so content is editable in isolation.
- `src/components/CycleSpine.tsx` renders the Now node + upcoming-event timeline; `DetailPanel.tsx` is the panel chrome, `details.tsx` the panel contents, and `eventKinds.tsx` maps each event kind to its icon, title and detail. Adding an event kind = extend `SpineEvent` + one `EVENT_KINDS` entry; `TimezoneSelector.tsx` is a plain `<select>` (Dashboard persists the choice in `localStorage`).

**Watch out for:**
- `planets.ts` Mercury/Venus tables are hand-maintained and expire end of 2027 (`PLANET_DATA_EXPIRY`). They are lookup data, not computed; `planetsTruth.test.ts` cross-checks them against `astronomy-engine`. Sun-sign dates (`astro.ts`) and solstice/equinox dates (`sabbats.ts`) are also fixed tables.
- Hemisphere (N/S) is derived from the selected timezone via a hardcoded `SOUTHERN_TIMEZONES` set in `src/lib/timezones.ts` (a test checks it stays a subset of the selector list).
- Time model (`src/lib/days.ts`): **instants** are `Date`s; **calendar days** are `CalendarDay` strings (`'YYYY-MM-DD'`). An instant becomes a day only via `dayOf(instant, selectedTimezone)`. Never construct a "day" as a device-local midnight `Date`, and format days with `formatDay` (UTC-based). `npm run test:tz` runs the suite under four device zones to catch violations.
- `.next/` sometimes accumulates duplicate `* 2.ts` / `* 3.ts` files (Finder/iCloud) that break `tsc`; delete `.next` if you see a spurious `Duplicate identifier` error.

**Before committing:** run `npx tsc --noEmit` (must be clean), `npx eslint` and `npm run test:tz`. CI runs these plus `next build`.
