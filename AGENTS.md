<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project orientation

A personal moon / sabbat dashboard. Single page, no backend, no DB, no external APIs — everything is computed locally and rendered client-side. Aesthetic and astronomical/spiritual accuracy matter more than generic SaaS patterns.

**Stack:** Next.js 16 (App Router), React 19, Tailwind v4, `suncalc`. Deployed on Vercel.

**Shape:**
- `src/app/page.tsx` is a thin server shell; the whole app is `src/components/Dashboard.tsx` (one `'use client'` component holding all state).
- `src/lib/` = calculations (moon, astro, sabbats, planets, upcomingEvents) + `config.ts` constants.
- `src/data/` = correspondence content (phases, signs, sabbats, Venus, moon-in-sign), kept separate from logic so content is editable in isolation.
- `src/components/DetailPanel.tsx` renders every expandable detail type; `TimezoneSelector.tsx` persists choice in `localStorage`.

**Watch out for:**
- `planets.ts` Mercury/Venus tables are hand-maintained and expire end of 2027 (`PLANET_DATA_EXPIRY`). They are lookup data, not computed.
- Hemisphere (N/S) is derived from the selected timezone via a hardcoded `SOUTHERN_TIMEZONES` set in `Dashboard.tsx`.
- Timezone handling is manual (`Intl.DateTimeFormat` part-parsing in `Dashboard.tsx`) — tread carefully around date-boundary logic.
- `.next/` sometimes accumulates duplicate `* 2.ts` / `* 3.ts` files (Finder/iCloud) that break `tsc`; delete `.next` if you see a spurious `Duplicate identifier` error.

**Before committing:** run `npx tsc --noEmit` (must be clean) and `npx eslint`.
