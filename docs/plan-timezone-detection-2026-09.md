# Plan: detect the viewer's timezone and handle daylight saving

> **Status: implemented** (26 Sep 2026) on branch `feat/timezone-detection`, with the
> recommended default for every decision (D1–D4). Departure from the plan:
> `detectBrowserTimezone` takes the reported zone as an optional argument, so it
> can be tested without mocking `Intl`.

## Problem

A first-time visitor sees every time and day in **Europe/London**, whatever
their location. `Dashboard.tsx` starts with `DEFAULT_TZ`, and the mount effect
only replaces it with a value saved in `localStorage`. That value is saved only
when someone changes the selector. So a visitor in New York sees:

- Moon sign and phase times in UK time (5 hours out), with no label saying so.
- "Today / Tomorrow" labels, sabbat days and the Deipnon a day out for part of
  every evening, because "today" is the London day.
- Solstice and equinox days that can be a day out (the Sep 2026 equinox is on
  the 23rd in London but the 22nd in the Americas).

The maths is already correct *for whichever zone is selected*. An all-zone
sweep on 26 Sep 2026 (≈3,000 zone/instant pairs around local midnights and the
autumn/spring DST changeovers) found no inconsistencies. The bug is only that
the wrong zone is selected by default.

## How daylight saving works in the app today

The app never works out DST itself, and it shouldn't. Every instant-to-local
conversion goes through `Intl.DateTimeFormat` with an **IANA zone name** (in
`days.ts#dayOf` and `format.ts#formatTime`). The browser resolves each instant
against its own copy of the IANA tz database. That gets all of these right,
provided the app passes the right zone *name*:

| Case | Example | Handled by |
|---|---|---|
| DST start/end dates | UK 25 Oct 2026 01:00 UTC; NZ 26 Sep 2026 14:00 UTC | tz database |
| Southern-hemisphere DST (opposite season) | Sydney, Auckland, Santiago | tz database |
| Rule changes | Mexico abolished DST in 2022 | tz database (browser updates) |
| Half-hour and 45-minute offsets | India +5:30, Adelaide +9:30/+10:30, Nepal +5:45 | tz database |
| Half-hour DST shift | Lord Howe Island (+10:30 / +11) | tz database |
| 23- and 25-hour days | Any DST changeover day | `CalendarDay` maths is on UTC midnights, so `addDays`/`diffDays` never see DST (already tested) |
| Clocks changing while the tab is open | Tab left open overnight | 5-minute refresh recomputes from `new Date()`; no offset is cached anywhere (the planet caches are keyed by UTC day and hold instants only) |
| Server-rendered OG image | `opengraph-image.tsx` | Fixed to UTC, so no DST |

**Consequence for detection:** detect the zone *name*
(`Intl.DateTimeFormat().resolvedOptions().timeZone`), never a UTC offset.
`getTimezoneOffset()` only gives today's offset. It can't tell London from
Lisbon, or know when clocks next change.

### The one DST case that isn't handled: the repeated hour

When clocks go back, one hour of wall-clock time happens twice. On
25 Oct 2026 in London, 00:30 UTC and 01:30 UTC both display as "01:30". The UI
shows times without a zone label, so an event in that hour is ambiguous.

This does happen. Across all 51 selectable zones, from 26 Sep 2026 to
26 Sep 2029, there are 549 timed events (Moon sign changes and major phases).
Exactly one falls in a repeated hour: in **Halifax, the Moon enters Leo at
01:18 on 1 Nov 2026** (04:18 UTC, the first 01:18 of that night). Detection
makes this more likely, because it brings in zones outside the list.

The skipped hour when clocks go forward needs nothing: an instant can never
map to a wall-clock time that doesn't exist.

## Facts checked for this plan (Node 24, ICU 78.2, same engine as Chrome)

1. **Chrome's engine reports legacy zone names.** `Asia/Kolkata` resolves to
   `Asia/Calcutta`, and `Europe/Kyiv` resolves to `Europe/Kiev`. So an Indian
   or Ukrainian visitor's browser reports a name that is **not** in
   `SUPPORTED_TIMEZONES`, and a plain `Set.has()` check misses them. (Firefox
   reports the modern names.) Matching must compare canonical forms on both
   sides.
2. `UTC`, `Etc/UTC` and `GMT` all resolve to `UTC`. Privacy-hardened browsers
   (Tor, Firefox with resist-fingerprinting) report `UTC` whatever the real
   location.
3. Zones that aren't listed but have identical offsets over the next 12 months
   do exist (Zurich = Paris, Detroit = New York, Maputo = Johannesburg). Several
   common ones have **no** identical listed zone: `America/Phoenix`,
   `Australia/Brisbane`, `Australia/Adelaide`, `Asia/Kathmandu`,
   `Africa/Casablanca` (its offset changes for Ramadan), `Australia/Lord_Howe`.
4. `timeZoneName: 'short'` in `en-GB` gives friendly labels for Europe
   (`GMT`/`BST`, `CET`/`CEST`) and numeric ones elsewhere (`GMT-4`, `GMT+11`).
   Both are unambiguous.

## Design

### 1. Precedence on load

```
saved explicit choice (localStorage)  →  detected browser zone  →  Europe/London
```

- **Don't save the detected zone.** Save only what the viewer picks in the
  selector (as now). Detection then re-runs on every visit. A traveller's times
  follow their device, and a later tz database update (a country dropping DST)
  is picked up automatically.
- Existing visitors who never touched the selector have nothing saved, so they
  get detection too. For UK visitors that's still Europe/London.
- Detection runs in the existing mount effect, in the same pass as
  `setNow(new Date())`. The skeleton is shown until then, so there's no flash
  of London times and no hydration risk.

### 2. Detection and matching (`lib/timezones.ts`)

New pure functions, each taking its inputs as arguments so they're easy to test:

- `detectBrowserTimezone(): string | null`. Wraps
  `Intl.DateTimeFormat().resolvedOptions().timeZone` in try/catch. Returns
  `null` for missing values and for `UTC` (see decision D2).
- `canonicalZone(tz): string | null`. Resolves `tz` through `Intl`, or returns
  `null` if `Intl` rejects it.
- `resolveTimezone(saved, detected): string`:
  1. `saved` valid → `saved`.
  2. `detected` matches a listed zone by canonical name → **the listed
     spelling** (so `Asia/Calcutta` selects the `Asia/Kolkata` option).
  3. `detected` valid but not listed → `detected` itself (decision D1).
  4. Otherwise → `DEFAULT_TZ`.

`normalizeTimezone` currently rejects anything not listed, to keep bad values
away from `Intl`. That becomes "valid if `canonicalZone` accepts it", which
still guarantees `Intl` never throws.

### 3. Zones that aren't in the list

Use the detected zone exactly, so every DST rule is the browser's own. The
selector gets one extra option at the top when needed, e.g.
`America/Phoenix (your timezone)`. Otherwise the `<select>` value would match
no option and silently show London. Picking any listed zone saves it as before.

### 4. Hemisphere for zones that aren't listed

`hemisphereFromTimezone` keeps the explicit table for listed zones. For other
zones:

1. **DST direction.** Compare the zone's offset on 15 Jan and 15 Jul of the
   current year (via `Intl`, `timeZoneName: 'longOffset'`). A larger January
   offset means DST is in southern summer, so **south**. A larger July offset
   means **north**. This is correct for every DST-observing zone, including
   Dublin's "negative DST" (the rule is based on offsets, not the DST flag)
   and Casablanca (its Ramadan change never makes January larger than July).
2. **No DST** (equal offsets): check an explicit list of non-DST southern
   zones, plus the `Australia/` prefix (Brisbane, Darwin). A starting list:
   `Africa/Maputo`, `Africa/Harare`, `Africa/Lusaka`, `Africa/Windhoek`,
   `Africa/Gaborone`, `Africa/Maseru`, `Africa/Luanda`, `America/La_Paz`,
   `America/Asuncion`, `America/Montevideo`, `America/Recife`,
   `America/Manaus`, `Asia/Jakarta`, `Pacific/Port_Moresby`, `Pacific/Noumea`,
   `Pacific/Tongatapu`, `Pacific/Apia`, `Indian/Mauritius`, `Indian/Reunion`,
   `Indian/Antananarivo`.
3. Otherwise **north**.

Equatorial zones (Nairobi, Jakarta, Singapore) fit neither wheel well. This
keeps the current behaviour for listed ones.

### 5. Label times in the repeated hour (`lib/format.ts`)

`formatTime(instant, tz)` appends the short zone label **only** when the
instant falls in a repeated hour: `01:18 GMT-3` rather than `01:18`. Test for
this by formatting the instant ±30 and ±60 minutes and checking whether either
gives the same wall-clock minute (the same test used to find the Halifax
case). All other times stay as they are. `formatDayAndTime` and
`formatPeakText` pick this up automatically because they call `formatTime`.

## Files

| File | Change |
|---|---|
| `src/lib/timezones.ts` | `detectBrowserTimezone`, `canonicalZone`, `resolveTimezone`; `normalizeTimezone` accepts any valid zone; hemisphere fallback (DST direction + southern list) |
| `src/components/Dashboard.tsx` | Mount effect: `setTimezone(resolveTimezone(safeGet(STORAGE_KEY), detectBrowserTimezone()))` |
| `src/components/TimezoneSelector.tsx` | Extra "(your timezone)" option when the value isn't listed |
| `src/lib/format.ts` | Zone label for times in a repeated hour |
| `src/app/error.tsx` | Check the "clear stored timezone and retry" copy still makes sense |
| `AGENTS.md`, `README.md` | Hemisphere and default-zone notes |

No change to `days.ts`, `ephemeris.ts`, `astro.ts`, `moon.ts`, `planets.ts`,
`sabbats.ts`, `events.ts` or the OG image.

## Tests

**Unit (`timezones.test.ts`, `format.test.ts`)**
- `resolveTimezone`:
  - a saved choice beats detection;
  - an exact listed match is used;
  - `Asia/Calcutta` → `Asia/Kolkata` and `Europe/Kiev` → `Europe/Kyiv`;
  - an unlisted valid zone (`America/Phoenix`) is used as-is;
  - `UTC`, `null` and junk values → `Europe/London`;
  - a junk saved value falls through to detection.
- Hemisphere: Santiago, Sydney, Auckland → south, and Dublin, Casablanca →
  north (DST direction); Brisbane, Maputo → south (list); Phoenix, Kathmandu
  → north (default).
- Repeated hour:
  - `formatTime(2026-11-01T04:18:45Z, 'America/Halifax')` → `01:18 GMT-3`,
    and `05:18:45Z` → `01:18 GMT-4`;
  - `formatTime(2026-10-25T00:30Z, 'Europe/London')` → `01:30 BST`, and
    `01:30Z` → `01:30 GMT`;
  - an ordinary time has no label.
- Promote the throwaway sweeps from this investigation into permanent tests:
  - the all-zone model invariant sweep, with detected-only zones (Phoenix,
    Adelaide, Kathmandu, Lord_Howe, Casablanca) added;
  - a "no unlabelled ambiguous time" check over three years of events.

**e2e (`e2e/smoke.spec.ts`, which already runs under several `timezoneId`s)**
- `America/Los_Angeles` and `Australia/Sydney` → the selector shows that zone.
- `Asia/Calcutta` → selector shows `Asia/Kolkata`.
- `America/Phoenix` → the "(your timezone)" option is selected.
- `UTC` → `Europe/London`.
- A saved choice survives a reload under a different `timezoneId`.

## Decisions

| # | Question | Options | Recommended |
|---|---|---|---|
| D1 | Unlisted detected zone | **(a)** use it exactly, with an extra selector option; (b) map to a listed zone with identical offsets for 12 months, falling back to London (wrong for Phoenix, Brisbane, Adelaide, Kathmandu, Casablanca) | (a): exact DST rules everywhere, and not much more code |
| D2 | Browser reports `UTC` | **(a)** treat as no signal → London; (b) respect it | (a): it's almost always a privacy setting, and London is right for the core UK audience. Iceland and similar report their own zone names, not `UTC` |
| D3 | Zone labels on times | **(a)** only in the repeated hour; (b) on every time | (a): no visual change for 99.99% of times. (b) would also tell new visitors which zone they're seeing, if the selector alone proves not to be enough |
| D4 | Hemisphere for unlisted equatorial zones | **(a)** north (as for Nairobi today); (b) add a manual hemisphere toggle | (a) now; (b) only if anyone asks |

## Rollout checks

1. `npx tsc --noEmit`, `npx eslint`, `npm test`, and e2e (`npx playwright test`)
   all pass.
2. Live site after deploy: run the e2e detection cases against the production
   URL (Playwright's `timezoneId` emulates the browser zone). London, Los
   Angeles, Kolkata (reported as `Asia/Calcutta`), Phoenix and Sydney should
   each show the right selector value and the right local time for the next
   Moon sign change.
3. Footer commit hash matches `origin/main`.
