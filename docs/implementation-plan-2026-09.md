# Implementation plan — fixing the September 2026 review

This plan fixes every finding in [code-review-2026-09.md](code-review-2026-09.md).
The work is split into five PRs. Each PR can ship on its own and leaves `main`
green (`tsc`, `eslint`, `npm test`, `next build`).

| PR | Title | Fixes | Size | Depends on |
|---|---|---|---|---|
| 1 | Hotfix: correct Venus and Mercury tables | P0-1, part of P1-1 | S | – |
| 2 | Foundations: day model, event union, typed content, multi-TZ tests | P0-3, P2-6, P2-7, rec. 2/4/5 | L | 1 |
| 3 | Compute astronomy with `astronomy-engine` | P1-1 to P1-4, P2-5, rec. 1 | L | 2 |
| 4 | Client-only rendering and state consolidation | P0-2, P2-1, rec. 3/6 | M | 2 (3 preferred) |
| 5 | Content, dependencies, copy and docs | P1-5, P2-2, P2-3, P2-4, P2-8, docs | M | 3, 4 |

**PR 1 must merge before 17 Oct 2026.** From that date the current table starts
showing Venus in the wrong sign.

The decisions that need your input are listed at the end. Each has a recommended
default, and the plan assumes those defaults.

---

## PR 1 — Hotfix: correct the Venus and Mercury tables

This is the smallest change that stops wrong data shipping. PR 3 deletes these
tables again, so no structural work goes in here.

**Changes**
- `src/lib/planets.ts`
  - Regenerate `VENUS_INGRESSES` for 2025–2027 from `astronomy-engine`, using the
    UTC date of each ingress. The 2026 retrograde re-entries are included: Libra
    25 Oct, Scorpio 4 Dec, Sagittarius 7 Jan 2027. The full list is in the review
    appendix.
  - Correct `MERCURY_RETROGRADES` dates and sign labels. For example, Oct 2026
    becomes 24 Oct – 13 Nov (Scorpio), and Jul 2026 becomes 29/30 Jun – 23/24 Jul
    (Cancer). Rewrite the Jul 2026 flavour text, since it partly describes Leo.
  - Replace the "KNOWN INACCURATE" comment with a note on where the data came from.
- `src/lib/__tests__/planets.test.ts` gets a **truth test**: for every day in
  2025–2027, the table's Venus sign must match the ephemeris, allowing ±1 day at
  each ingress. Each Mercury retrograde start and end must be within 1 day of an
  ephemeris station. This test is what would have caught the original error.
- Keep the one-off generator script out of the repo; PR 3 replaces it with real code.

**Done when** the Now node shows the correct Venus sign for every day through
2027, and the spine no longer shows "Venus enters Sagittarius" in October 2026.

---

## PR 2 — Foundations: day model, event union, typed content, multi-TZ tests

This reshapes the data flow once, so PR 3 and PR 4 only swap what goes in and how
it is rendered.

### 2a. A single time model: `src/lib/days.ts`

- Add `type CalendarDay = string`, branded as `'YYYY-MM-DD'`. **Instants** stay
  as `Date`.
- Add helpers:
  - `dayOf(instant, tz)`, which replaces `toLocalDate` (Dashboard) and
    `localDayIndex` (format.ts);
  - `addDays`, `diffDays` and `compareDays`;
  - `formatDay(day, opts)`. It always formats through `Date.UTC(...)` with
    `timeZone: 'UTC'`, so the output never depends on the device.
- Nothing may build a device-local midnight any more: remove every
  `new Date(y, m, d)` used as a "day". The planet and sabbat tables become
  `CalendarDay` literals.
- `formatRelativeDays(target: CalendarDay, today: CalendarDay)` becomes pure
  string arithmetic. This fixes P0-3 by construction.
- `getSabbatContext(today: CalendarDay, hemisphere)` compares strings;
  `isSameDay` goes away.
- `astro.ts` works on the month and day of a `CalendarDay`, until PR 3 replaces it.

### 2b. Discriminated event union: `src/lib/events.ts`

Replace `UpcomingEvent` and its optional-field bag with one union type:

```ts
type SpineEvent =
  | { kind: 'moon-phase';    key; day; at: Date; phase: MajorPhaseName }
  | { kind: 'deipnon';       key; day; newMoonAt: Date }
  | { kind: 'sun-ingress';   key; day; at?: Date; sign: SignName }
  | { kind: 'sabbat';        key; day; sabbat: SabbatName }
  | { kind: 'venus-ingress'; key; day; at?: Date; sign: SignName; retrograde: boolean }
  | { kind: 'mercury-rx';    key; day; period: MercuryPeriod };
```

- Sort by `day`, then by `at`.
- Add a **kind registry** in `src/components/eventKinds.tsx`. It maps each kind to
  `{ icon, title(event), Detail }`. `CycleSpine` and `DetailPanel` render through
  the registry. The long `panelContent` if-chain in `Dashboard.tsx` and the
  `DetailContent` union are removed. The "Now" subjects (moon, moon sign, sun
  sign, Venus, today's sabbat) become registry entries too.
- Adding an event type then means one registry entry plus its data.
- The `data-expiry` kind is kept until PR 3 removes it.

### 2c. Typed content keys: `src/lib/names.ts`

- Add `SignName`, `SabbatName`, `PhaseName` and `MajorPhaseName` string-literal unions.
- `src/data/*` changes from `Record<string, …>` to `Record<SignName, …>` and so
  on. Missing content becomes a compile error, and the "No data found for …"
  fallbacks are deleted.

### 2d. Dead code and duplication (P2-6, P2-7)

- Delete `getNextMoonPhases`, `SabbatContext.nearest`, `.next3` and
  `.daysUntilNext`, the moon `emoji` fields, and `SabbatCorrespondence.subtitle`.
- The duplicated day parsers are removed by 2a.

### 2e. Tests

- `vitest.setup.ts` becomes `process.env.TZ = process.env.TEST_TZ ?? 'Europe/London'`.
- Add `npm run test:tz`, which runs the suite in four separate processes with
  `TEST_TZ` set to Europe/London, Australia/Sydney, America/Los_Angeles and
  Pacific/Kiritimati (UTC+14).
  - Separate processes are needed because `TZ` is global to the process. Vitest
    projects sharing one process across threads could leak timezones between
    tests and make results flaky.
- Add the exact P0-3 scenario as a regression test: device London, selected New
  York, Samhain must be "in 2 days".
- Add unit tests for `days.ts`, including DST changeover days and year boundaries.
- Optional: add `.github/workflows/ci.yml` to run `tsc`, `eslint`, `test:tz` and
  `build` on every PR. The repo has no CI today, only Vercel's build.

**Done when** every date label is identical under all four device timezones for
the same selected zone, and no `Record<string, …>` remains in `src/data`.

---

## PR 3 — Compute astronomy with `astronomy-engine`

This PR replaces every hand-maintained table.

### 3a. `src/lib/ephemeris.ts`, a generic search layer

- `eclipticLongitude(body, t)` returns geocentric, apparent, tropical longitude
  of date. It uses `SunPosition` for the Sun, `EclipticGeoMoon` for the Moon, and
  `GeoVector(body, t, true)` rotated with `Rotation_EQJ_ECT` for the planets.
- `findSignChanges(body, from, to, step)` scans at a coarse step, then bisects to
  1 minute. The steps are 3 h for the Moon and 1 day for Venus. Mercury uses
  12 h, because Mercury is fast near perihelion.
- `findStations(body, from, to)` finds where the daily motion changes sign,
  bisected to 1 minute.
- `findLongitudeCrossing(body, lon, from, to)` is used for Mercury's shadow.
- The prototype in the review session found Venus stations at 3 Oct 07:10 and
  14 Nov 00:21 UTC, and Mercury stations at 24 Oct 07:15 and 13 Nov 15:52 UTC.
  The full 200-day scan took **about 57 ms** in Node.
- **Performance:** memoise results in a module-level cache keyed by UTC day,
  so the 5-minute refresh costs almost nothing. The scan window runs from 60 days
  back to 200 days ahead, so shadow periods that are already running resolve correctly.

### 3b. Callers

| Area | Before | After |
|---|---|---|
| Sun sign / ingresses (`astro.ts`) | fixed month/day table | `SunPosition` for the current sign; `SearchSunLongitude(30·k)` for ingresses (exact instants, converted with `dayOf`). The 200-day cap goes. |
| Solstices / equinoxes (`sabbats.ts`) | `approxDate` tables | `Seasons(year)` instants converted with `dayOf(…, tz)`, so the sabbat calendar now takes `tz`. The fixed festivals stay as `CalendarDay`s. The southern flip is unchanged. |
| Moon sign (`astro.ts`) | truncated Meeus | `EclipticGeoMoon` plus `findSignChanges` |
| Venus (`planets.ts`) | table | `findSignChanges` and `findStations`. An ingress made while retrograde is flagged, so the spine reads "Venus re-enters Libra ℞". |
| Mercury (`planets.ts`) | table, ±14-day shadow | Periods built from stations. The shadow runs from when Mercury first reaches the direct-station longitude, to when it gets back to the retrograde-station longitude. The sign label comes from the two station signs. `getMercuryStatus` works from instants, and the day-extension hack goes. |
| Deipnon (`moon.ts`) | new-moon instant − 24 h | `addDays(dayOf(newMoon, tz), -1)`: same meaning, now a calendar day |

### 3c. Mercury flavour text

Hand-written text for each period no longer fits computed periods. Add
`src/data/mercuryRetrogradeCorrespondences.ts`, keyed by the sign of the
retrograde station (12 entries). The existing texts seed 6 of them; the other 6
are new copy (decision D2). The Mercury panel also shows the shadow dates
(decision D3), which puts the pre- and post-shadow logic back to use.

### 3d. Deletions

- The `planets.ts` tables, `approxDate` and its four tables, the `ZODIAC_SIGNS`
  date ranges, and the Meeus function.
- `PLANET_DATA_EXPIRY` and `SABBAT_DATA_EXPIRY` in `config.ts`.
- The `data-expiry` event kind and `DataExpiryDetail` (this settles P2-5).
- The PR 1 truth test, which is superseded.
- `opengraph-image.tsx` moves to the new functions.

### 3e. Tests: fixtures, not self-comparison

Hard-code **published** values and test against them. The fixtures must be checked
against an independent source, such as the USNO almanac for the seasons or a
published ephemeris for stations and ingresses. Copying this implementation's own
output into the tests would prove nothing.

- Seasons 2025–2030, to within 2 min.
- Mercury and Venus stations 2025–2027, to within 30 min.
- Venus and Sun ingresses 2026–2027, to within 30 min.
- A sample of Moon ingresses, to within 5 min.
- The 23 Sep 2026 equinox is 22 Sep in America/New_York and 23 Sep in Europe/London.
- A performance budget: `buildEvents` for a 200-day horizon runs in under 150 ms
  in the test runner.

**Done when** no hard-coded astronomical dates remain in `src/lib`, and the app
keeps working with no expiry date.

---

## PR 4 — Client-only rendering and state consolidation

### 4a. A pure view model: `src/lib/dashboardModel.ts`

- Add `buildDashboardModel(now: Date, tz: string)`, which returns everything the
  UI shows: moon info, phase peak, moon sign and upcoming changes, sun, Venus,
  Mercury, sabbat context, spine events (with the hero-peak de-duplication), and
  the today label.
- It is pure, so it is unit-tested under `test:tz` with no React involved.

### 4b. `Dashboard.tsx` state

- State is reduced to `now: Date | null`, `timezone`, `expandedKey` and `showHint`.
- `model = useMemo(() => now && buildDashboardModel(now, timezone), [now, timezone])`.
- The mount effect reads the stored timezone and sets `now` in the same pass, so
  a returning user never sees a render with London data first.
- The interval and focus handlers only call `setNow(new Date())`.

### 4c. No time-dependent output during SSR (fixes P0-2)

- While `now === null` (the server render and the first client render), show a
  `DashboardSkeleton`. It keeps the real outer dimensions: the moon placeholder
  disc, the heading line, and the spine card with fixed placeholder rows. It
  contains no dates, times or phase names, so the server and client HTML are
  identical by construction.
- This is the "defer to effect" approach from
  `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
  That guide's inline-script technique suits one or two values, not a page where
  everything depends on time. The skeleton keeps the layout stable, so there is
  no layout shift.
- Keep `revalidate = 3600`, since the OG `<meta>` date stamp depends on it.
- Accepted trade-off: visitors without JavaScript see only the skeleton.

### 4d. Safe storage (P2-1)

- Add `src/lib/storage.ts` with `safeGet(key)` and `safeSet(key, value)`, which
  catch the error and return `null` or `false`.
- Use them in `Dashboard` and `error.tsx`.

### 4e. Formatters

Move `formatTime`, `formatInstantDate` (Dashboard) and `formatTransitTime`
(DetailPanel) into `format.ts`, next to `formatDay`.

### 4f. Smoke test

- Add `@playwright/test` as a dev dependency and `npm run test:e2e`, which builds
  and starts the app with `TZ=UTC LANG=ja_JP.UTF-8`.
- The test loads the page with the browser timezone set to UTC,
  America/Los_Angeles and Australia/Sydney. Each run fails on any console error
  (ignoring the `/_vercel/insights` 404 that happens locally). It asserts that the
  phase name, the Now node and at least one spine event are visible, and that the
  selected timezone survives a reload.
- On a local machine this needs `npx playwright install chromium` once.
- Add the `TZ=UTC LANG=… next dev` tip to AGENTS.md.

**Done when** the production build loads with zero console errors in all three
browser timezones, and a page whose storage is blocked still renders.

---

## PR 5 — Content, dependencies, copy and docs

- **Southern-hemisphere copy (P1-5).** `SabbatCorrespondence.dateDescription`
  becomes `{ north: string; south: string }`, with southern variants written for
  all 8 sabbats (for example "Fixed: 1st August in the Southern Hemisphere").
  `SabbatDetail` receives the hemisphere.
- **Em dashes (P2-8).** Rewrite the Venus-in-Gemini text. The five Mercury
  flavour texts were already rewritten in PR 3. Add a small test that fails on
  "—" in any `src/data` string.
- **Footer versus analytics (P2-2).** Apply decision D1.
- **Commit hash (P2-3).** In `next.config.ts`, use
  `VERCEL_GIT_COMMIT_SHA?.slice(0, 7)`, then `git rev-parse`, then `'dev'`.
- **Dependencies (P2-4).**
  - Read `node_modules/next/dist/docs/01-app/01-getting-started/18-upgrading.md` first.
  - Bump `next` to ^16.3.6 and `eslint-config-next` to match, run
    `npm audit fix`, and apply minor bumps (tailwind, types, vitest 4.1.x).
  - Hold back the major versions (TypeScript 7, ESLint 10, Vitest 5) for a
    separate PR.
  - Check with `build`, `test:tz` and `test:e2e`.
- **Docs.**
  - README and AGENTS.md: describe `days.ts`, `ephemeris.ts`, the event
    registry, `dashboardModel.ts` and the new test scripts. Remove the
    "known inaccurate" notes, the expiry notes and the instant-vs-day warning,
    which the new model makes unnecessary.
  - Add a "Status" column to the review doc, marking each finding with the PR
    that fixed it.

---

## Findings → PRs

| Finding | PR |
|---|---|
| P0-1 Venus table | 1 (data), 3 (computed) |
| P0-2 hydration | 4 |
| P0-3 relative days across TZs | 2 |
| P1-1 Mercury dates, labels, shadow | 1 (dates), 3 (computed shadow) |
| P1-2 sun ingresses vs sabbats | 3 |
| P1-3 equinox day depends on TZ | 3 (uses 2's `dayOf`) |
| P1-4 moon-sign ingress precision | 3 |
| P1-5 southern sabbat copy | 5 |
| P2-1 unguarded localStorage | 4 |
| P2-2 footer vs analytics | 5 |
| P2-3 commit hash source | 5 |
| P2-4 dependency advisories | 5 |
| P2-5 expiry warning timing | 3 (feature removed) |
| P2-6 dead code | 2 |
| P2-7 duplicated parsers and formatters | 2, 4 |
| P2-8 em dashes | 3, 5 |
| Test gaps (truth, TZ, render) | 1, 2, 3, 4 |
| Doc drift | 5 (and each PR keeps AGENTS.md current) |

## Risks

- **PR 2 is the largest refactor.** It touches Dashboard, CycleSpine,
  DetailPanel and every lib module. To limit risk, land the `test:tz` harness
  and characterisation tests of the current spine output in its first commit, so
  that behaviour changes show up in the diff.
- **Precision disagreements.** Astrology sites use varied ephemerides and
  sometimes local time, so times may differ by a few minutes from popular
  sources. The app shows times to the minute, which is honest at this precision.
- **Sabbat dates now depend on timezone** (for example Mabon 2026 falls on 22 Sep
  in New York). This is correct, but it is a visible change.
- **A skeleton flash on hard loads.** In practice this already happens today,
  because React throws away the server HTML.

---

## Decisions needed (the plan assumes the recommended defaults)

| # | Question | Recommended default | Alternative |
|---|---|---|---|
| D1 | The footer says "No tracking", but Vercel Analytics is installed | Keep analytics and reword the footer: "Calculated locally. Anonymous page-view counts only." | Remove `@vercel/analytics` |
| D2 | Per-sign Mercury retrograde text (6 new entries) | I draft them in the existing voice, with no em dashes, for your edit | You write them |
| D3 | Mercury shadow periods | Show the shadow dates in the Mercury panel | Drop the shadow logic entirely |
| D4 | Venus retrograde | Label re-entries with ℞ ("Venus re-enters Libra ℞") | Also add Venus station events to the spine (a new feature, not in scope) |
| D5 | Sun-sign "until" date | Show the ingress day ("until 23 Oct"), using the exact instant | Show the last full day in the sign |
| D6 | Browser smoke test | Add `@playwright/test` as a dev dependency | Skip it and rely on unit tests only |
| D7 | CI | Add a GitHub Actions workflow in PR 2 | Keep relying on Vercel builds |
