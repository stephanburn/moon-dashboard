<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project orientation

A personal moon / sabbat dashboard. Single page, no backend, no DB, no external data APIs — everything is computed locally. The page shell is statically prerendered with ISR (`revalidate = 3600`, which keeps the date-stamped OG meta tag current). `Dashboard` holds `now = null` during SSR and hydration and renders `DashboardSkeleton`; the real content is computed only in the browser, so server and client HTML always match. Aesthetic and astronomical/spiritual accuracy matter more than generic SaaS patterns.

**Stack:** Next.js 16 (App Router), React 19, Tailwind v4, `astronomy-engine` (all astronomy), Vitest. Deployed on Vercel with Vercel Analytics.

**Shape:**
- `src/app/page.tsx` is a thin server shell; the whole app is `src/components/Dashboard.tsx` (one `'use client'` component holding all state).
- `src/lib/` = calculations (moon, moonDisc, astro, sabbats, planets), `events.ts` (the `SpineEvent` union), `dashboardModel.ts` (pure `buildDashboardModel(now, timezone)`: everything the UI shows), `days.ts` (calendar days), `names.ts` (name unions), `timezones.ts`, `format.ts` (all formatting), `config.ts`. Tests in `src/lib/__tests__/`.
- `src/data/` = correspondence content (phases, signs, sabbats, Venus, moon-in-sign), kept separate from logic so content is editable in isolation.
- `src/components/CycleSpine.tsx` renders the Now node + upcoming-event timeline; `DetailPanel.tsx` is the panel chrome, `details.tsx` the panel contents, and `eventKinds.tsx` maps each event kind to its icon, title and detail. Adding an event kind = extend `SpineEvent` + one `EVENT_KINDS` entry; `TimezoneSelector.tsx` is a plain `<select>` (Dashboard persists the choice in `localStorage`).

**Watch out for:**
- All astronomy is computed with `astronomy-engine` through `src/lib/ephemeris.ts` (geocentric apparent tropical longitude; sign changes, stations and longitude crossings bisected to the minute). Don't reintroduce hand-maintained date tables. Tests in `ephemeris.test.ts` compare against *published* almanac values (sources listed in the file); never paste the code's own output in as a fixture.
- `planets.ts` caches its Venus/Mercury scans per UTC day; a cold model build is ~100 ms in Node, a refresh ~15 ms.
- Hemisphere (N/S) is derived from the selected timezone via a hardcoded `SOUTHERN_TIMEZONES` set in `src/lib/timezones.ts` (a test checks it stays a subset of the selector list).
- Time model (`src/lib/days.ts`): **instants** are `Date`s; **calendar days** are `CalendarDay` strings (`'YYYY-MM-DD'`). An instant becomes a day only via `dayOf(instant, selectedTimezone)`. Never construct a "day" as a device-local midnight `Date`, and format days with `formatDay` (UTC-based). `npm run test:tz` runs the suite under four device zones to catch violations.
- Never render time-, timezone- or locale-dependent text during SSR: it breaks hydration (React #418). To catch this locally, run the server with `TZ=UTC LANG=ja_JP.UTF-8` (as `npm run test:e2e` does); see `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
- Use `lib/storage.ts` (`safeGet`/`safeSet`), never `localStorage` directly: it throws when site storage is blocked.
- `.next/` sometimes accumulates duplicate `* 2.ts` / `* 3.ts` files (Finder/iCloud) that break `tsc`; delete `.next` if you see a spurious `Duplicate identifier` error.

**Before committing:** run `npx tsc --noEmit` (must be clean), `npx eslint`, `npm run test:tz`, and `npm run test:e2e` for UI changes. CI runs all of these.
