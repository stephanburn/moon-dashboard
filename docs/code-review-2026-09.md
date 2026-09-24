# Code & documentation review — September 2026

Baseline review at commit `0b8a824` (24 Sep 2026), ahead of expanding the app.

## Health check

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint` | clean |
| `npm test` | 47 / 47 pass |
| `next build` | succeeds; `/` is static with ISR (1h) |
| `npm audit --omit=dev` | 5 advisories (see P2-4) |

The code is tidy and well commented, and the lib / data / components split works.
The real risks are **data accuracy** and **time handling**, not code quality.

Astronomical claims below were checked against `astronomy-engine` (already a
dependency): geocentric, apparent, tropical ecliptic longitude of date, scanned
hourly for sign changes and every 6 hours for stations.

---

## P0 — wrong now, or within weeks

### P0-1. The Venus ingress table is wrong (`src/lib/planets.ts`)

Compared day by day with the ephemeris, `VENUS_INGRESSES` gives the wrong current
sign on **815 of the 1,095 days in 2025–2027**. The main cause is that it has no
Venus retrograde in 2026: Venus stations retrograde **3 Oct 2026 in Scorpio**,
re-enters Libra 25 Oct, stations direct **14 Nov 2026 in Libra**, returns to
Scorpio 4 Dec and reaches Sagittarius only on 7 Jan 2027.

- The table says **Sagittarius from 17 Oct 2026**, so the Now node and the Venus
  panel will be wrong **every day from 17 Oct 2026 to the end of 2027**.
- The cycle spine currently shows *"Venus enters Sagittarius ♐ — in 3 weeks"*,
  which will not happen.
- Today's value (Scorpio) is correct only by coincidence. The table has Scorpio
  starting 18 Sep; the real ingress was 10 Sep.
- The 2025 retrograde entries are also misplaced: the table has the re-entry into
  Pisces on 12 Apr and back into Aries on 31 May; the real dates are 27 Mar and
  30 Apr.

The correct dates are in the appendix. **Recommended fix:** compute Venus (and
Mercury) from `astronomy-engine` rather than patching the table (see the
recommendations section).

### P0-2. Hydration error on every page load (React #418)

A production build logs `Minified React error #418` (text mismatch) on every load,
in every device timezone tested (UTC, America/Los_Angeles, Australia/Sydney).
React then discards the server HTML and re-renders the whole tree on the client.

- **Immediate cause:** `nowShort` (`Dashboard.tsx`, the Now-node date) uses
  `toLocaleDateString('en-GB', { weekday: 'short', … })`. Node's ICU renders
  `Thu 24 Sept`; Chromium renders `Thu, 24 Sept`.
- **Underlying cause:** `/` is prerendered statically with `revalidate = 3600`,
  and every `useState` initialiser in `Dashboard` calls `new Date()`. The HTML
  therefore reflects the build or regeneration time and the server's timezone
  (UTC). Any day rollover since then, or any device timezone that isn't UTC,
  adds more mismatches (relative-day labels, event lists).

**Fix options:** render time-dependent content only after mount (keep a static
shell, which also fits "calculated locally"), or make SSR output independent of
time, timezone and ICU. The first option is simpler and more honest.

### P0-3. Relative-day labels are a day short when the device is east of the selected zone

`formatRelativeDays` (`src/lib/format.ts`) reads calendar-day events (sabbats, sun
and Venus ingresses, Mercury) in the *selected* timezone. Those dates are stored as
*device-local* midnights. This is the same class of bug as H1, which was fixed for
`formatCalendarDate` but not here.

Reproduced at 29 Oct 2026 12:00 UTC, for Samhain on 31 Oct (the correct label is
"in 2 days" in every case):

| Device TZ | Selected TZ | Shown |
|---|---|---|
| Europe/London | America/New_York | **Tomorrow** |
| Europe/London | Pacific/Honolulu | **Tomorrow** |
| Australia/Sydney | any | **Tomorrow** |
| America/Los_Angeles | Pacific/Honolulu | **Tomorrow** |

Moon phases and the Deipnon are true instants, so they are unaffected. The
`from` date passed to `getUpcomingEvents` has the same device-midnight
ambiguity. **Root cause:** calendar days are modelled as device-local `Date`s.
See recommendation 2.

---

## P1 — accuracy

### P1-1. Mercury retrograde table is 1–3 days off, and some sign labels are wrong

| Table | Ephemeris (UTC) |
|---|---|
| 2 Jul – 26 Jul 2026, "Leo / Cancer" | ~30 Jun – ~24 Jul 2026, Cancer only |
| 25 Oct – 15 Nov 2026, Scorpio | ~24 Oct – ~13/14 Nov 2026, Scorpio |
| 9 Nov – 29 Nov 2025, "Sagittarius" | stations direct in Scorpio |
| 2027 entries | within about a day |

The status code also extends each end date by one day, so the badge will clear
about two days late in November 2026. The shadow periods are a fixed ±14 days,
not the true degree-based shadow. Pre- and post-shadow status isn't shown anywhere
in the UI (the header badge only shows `retrograde`), so those branches of
`getMercuryStatus` are effectively dead.

### P1-2. Sun ingress dates disagree with the app's own equinox and solstice dates

`astro.ts` uses one fixed month/day table for every year:

- "Sun enters Aries" is **21 Mar** every year, but Ostara (the same astronomical
  moment) is **20 Mar**. The real 2026 ingress was 20 Mar 14:45 UTC.
- "Sun enters Capricorn" is **22 Dec 2026**, but Yule is 21 Dec 2026 (real: 21 Dec 20:50 UTC).
- "Sun enters Pisces" is 19 Feb; the real 2026 ingress was 18 Feb.
- `getUpcomingSunIngresses` stops scanning after 200 days, so `count` is capped
  silently (it returns about 6, not the 10 requested).

### P1-3. Equinox and solstice dates ignore timezone (`sabbats.ts`)

The tables match the UTC calendar day, but the day an equinox falls on depends on
the viewer's zone:

- The 2026 September equinox is 23 Sep 00:05 UTC, which is **22 Sep in every
  Americas zone**.
- The 2027 December solstice is 22 Dec 02:42 UTC, which is **21 Dec in the Americas**.

`astronomy-engine`'s `Seasons(year)` returns the exact instants.

### P1-4. Moon-sign ingress times can be up to about 1 hour off

The truncated Meeus series in `astro.ts` never got the sign label wrong in 1,252
samples across 2026. However, over 60 ingresses its ingress times were off by up
to **1.07 h**, and the Moon panel shows them to the minute. `EclipticGeoMoon()`
in `astronomy-engine` gives the exact longitude.

### P1-5. Southern-hemisphere sabbat copy is northern-only

`SabbatDetail` shows `dateDescription` from `sabbatCorrespondences.ts` unchanged.
A southern user opening Imbolc (1 Aug for them) reads *"Fixed: 1st February"*,
and Ostara (September for them) says *"approximately 20–21 March in the Northern
Hemisphere"*.

---

## P2 — robustness and hygiene

1. **Unguarded `localStorage`.** `Dashboard.tsx` reads and writes `localStorage`
   without `try/catch` (mount effect, `handleTimezoneChange`, `handleToggle`).
   With site storage blocked, the first access throws `SecurityError` on every
   load. The error boundary then offers "reset your saved timezone", which can't
   help. `error.tsx` already guards its own access; `Dashboard` doesn't.
2. **Footer copy vs analytics.** The footer says *"No tracking, no APIs."*, but
   Vercel Analytics was added in `18875ac`. It is cookieless, but it does record
   page views. The wording needs a decision.
3. **Commit hash source.** `next.config.ts` runs `git rev-parse` at build time.
   Vercel documents `VERCEL_GIT_COMMIT_SHA` for this; using it as a fallback is
   safer. I couldn't reach the live site from the review environment to check
   what it currently shows.
4. **Dependencies.** `npm audit --omit=dev` reports advisories in `next`
   (SSRF via rewrites, which the app doesn't use), `postcss`, `sharp` and
   `nanoid`. Actual exposure is low, but `next` 16.2.9 → 16.3.x is a cheap bump.
   `eslint-config-next` is pinned to 16.2.0.
5. **Expiry warning timing.** The data-expiry event is dated *at* the expiry
   date, and the spine shows only 8 events (about 5 weeks). The "within 90 days"
   warning would therefore not appear until early December 2027. `DataExpiryDetail`
   also hard-codes "31 December 2027" instead of reading `PLANET_DATA_EXPIRY`.
6. **Dead or vestigial code:** `getNextMoonPhases` ("backward compatibility",
   unused); `SabbatContext.nearest`, `.next3` and `.daysUntilNext`; the `emoji`
   fields on moon types (the UI uses glyphs); `SabbatCorrespondence.subtitle`.
7. **Duplication:** `toLocalDate` (`Dashboard.tsx`) and `localDayIndex`
   (`format.ts`) are the same parser. Date and time formatters are split across
   `Dashboard.tsx`, `DetailPanel.tsx` and `format.ts`.
8. **Copy style:** em dashes remain in user-facing text (Venus in Gemini and five
   Mercury flavour texts), despite `89e6021` removing them elsewhere.

---

## Tests

What's good: the pure-function tests for formatting and timezones, the pinned
regression tests for moon-phase instants, and the integrity checks on table
ordering.

Gaps:

- **Tables are checked for order, not truth.** This is how the Venus table got
  through. Add ephemeris cross-check tests, or better, replace the tables.
- **The device timezone is always Europe/London** (`vitest.setup.ts`), so no test
  can catch device-vs-selected zone bugs like P0-3. Run the suite under several
  `TZ` values, or test with explicit device-zone fixtures.
- **No render or smoke test.** A Playwright test that loads the production build
  and fails on console errors would have caught P0-2.

---

## Documentation

These were corrected in the same commit as this review:

- README and AGENTS.md listed `suncalc`, which is no longer a dependency.
- README said the OG image lived under `app/api/og/`; it is `app/opengraph-image.tsx`.
- README's architecture tree was missing `CycleSpine.tsx`, `format.ts`,
  `timezones.ts`, `error.tsx`, the test folder and `SABBAT_DATA_EXPIRY`.
- Both files said the page is "rendered client-side". It is statically
  prerendered with ISR and then hydrated.
- AGENTS.md put `SOUTHERN_TIMEZONES` in `Dashboard.tsx` (it is in
  `lib/timezones.ts`) and said `TimezoneSelector` persists the choice (Dashboard
  does).
- AGENTS.md didn't mention `npm test` or the instant-vs-calendar-day convention,
  which is the most important invariant in the codebase.
- Code comments still referred to the old "Coming Up" list, which was replaced by
  the cycle spine. The Dashboard comment claimed pre- and post-shadow status was
  visible there; it isn't shown anywhere. The `planets.ts` comment "2027 — no
  retrograde expected" was misleading.

---

## Recommendations before expanding

1. **Compute, don't tabulate.** `astronomy-engine` is already in the bundle. Use
   it for Venus and Mercury sign changes and stations (with real shadow
   degrees), sun ingresses (`SearchSunLongitude`), solstices and equinoxes
   (`Seasons`), and the moon sign (`EclipticGeoMoon`). This fixes P0-1 and P1-1
   to P1-4. It also removes `PLANET_DATA_EXPIRY`, `SABBAT_DATA_EXPIRY`, the
   `data-expiry` event type and its panel. The same machinery then covers other
   planets, eclipses (`SearchLunarEclipse`, `SearchGlobalSolarEclipse`),
   void-of-course moon and so on.
2. **One time model.** Keep instants as `Date`s. Represent calendar days as their
   own type (for example `'YYYY-MM-DD'`), and convert an instant to a day in the
   selected zone through one helper. This removes all dependence on the device
   timezone and fixes P0-3 and P1-3 by construction.
3. **Decide the SSR story.** Either render time-dependent UI only on the client
   behind a static shell, or make the server output deterministic. This fixes P0-2.
4. **Discriminated event union.** `UpcomingEvent` carries a bag of optional
   per-type fields. Adding an event type currently touches `upcomingEvents.ts`,
   the `panelContent` if-chain in `Dashboard.tsx`, the union and renderer in
   `DetailPanel.tsx`, and a data file. Have each event carry its own detail payload.
5. **Typed content keys.** Replace `Record<string, …>` in `src/data/` with
   `SignName`, `SabbatName` and `PhaseName` unions, so missing content becomes a
   compile error instead of "No data found".
6. **Simplify Dashboard state.** Nine parallel `useState`s are recomputed
   together. Derive them from `now` and `timezone` with `useMemo`.

---

## Appendix — Venus sign changes, Sep 2026 to 2027 (UTC, hourly resolution)

| Date (UTC) | Venus enters |
|---|---|
| 2026-09-10 09:00 | Scorpio |
| 2026-10-03 | *stations retrograde (Scorpio)* |
| 2026-10-25 09:00 | Libra (retrograde) |
| 2026-11-14 | *stations direct (Libra)* |
| 2026-12-04 09:00 | Scorpio |
| 2027-01-07 09:00 | Sagittarius |
| 2027-02-03 15:00 | Capricorn |
| 2027-03-01 07:00 | Aquarius |
| 2027-03-26 09:00 | Pisces |
| 2027-04-20 04:00 | Aries |
| 2027-05-14 22:00 | Taurus |
| 2027-06-08 13:00 | Gemini |
| 2027-07-03 03:00 | Cancer |
| 2027-07-27 13:00 | Leo |
| 2027-08-20 20:00 | Virgo |
| 2027-09-14 01:00 | Libra |
| 2027-10-08 04:00 | Scorpio |
| 2027-11-01 08:00 | Sagittarius |
| 2027-11-25 12:00 | Capricorn |
| 2027-12-19 19:00 | Aquarius |
