# Full app review: Moon Dashboard

**Review date:** 17 October 2026  
**Code baseline:** `d6cfeb36319d195a84c03aee45b93ad7da145483`  
**Scope:** functionality, astronomy and calendar mathematics, accounts, security, privacy, database design and efficiency, resilience, deployment, UI and accessibility, performance, testing, documentation, and foundations for future features.

## Status (updated 17 Oct 2026)

Added after the review; the report below is unchanged.

| Finding | Status | PR |
| --- | --- | --- |
| SEC-02 dependencies | Next 16.3.8, sharp 0.35.5 | #6 |
| MATH-02 lunar age | Elapsed time since the previous new moon | #6 |
| FUNC-04 current Mercury period | Opens from the Now node | #6 |
| DB-01 pool errors | Error listener and timeouts | #6 |
| A11Y-02 reduced motion, close focus | Fixed | #6 |
| PRIV-01 footer wording | Fixed | #6 |
| SEC-01 membership lapse | Sessions never renew (30 days from sign-in); admin "sign out everywhere" | #7 |
| FUNC-02 sync failures | Explicit account states, retry, "signed out" result | #7 |
| OPS-01 migrate env loading | Reads `.env.local`, fails without `DATABASE_URL` | #7 |
| OPS-02 test isolation | E2E without a test database runs accounts off, no migrations | #7 (partly: roles, migration locking, preview data not addressed) |
| MATH-01 / FUNC-01 aliases | Fixed; more southern zones | #8 |
| Hemisphere-specific copy | Fixed | #8 |
| PRIV-01 retention | Logs deleted after 90 days; privacy note on `/signin` | #9 |
| DB-02 auth indexes | Added, with unique `(provider_id, account_id)` | #9 |
| OPS-03 error screen | Timezone advice only where it can help | #9 |
| A11Y-01 contrast | Fixed | #9 |
| MATH-01 seasonal wheel preference | Northern / Southern / from timezone, synced | #10 |
| DOC-01 documentation | README, accounts plan, AGENTS.md | this PR |

Not yet addressed: SEC-03 (CSP and headers, shared rate limits, Discord timeouts), SEC-04 (deletion lifecycle), SEC-05 (auth API surface, `server-only`), DB-03, MATH-03, FUNC-05, OPS-03 monitoring and runbook, content safety notes, asset licences, and the extension requirements in sections 4 and 12.

This is a review, not an implementation. No application code, dependencies, schema, or deployment configuration was changed. Production account data and database contents were not accessed. Only this report was added to the repository; builds and tests also generated their normal ignored output.

## 1. Executive assessment

**The dashboard has a good core and does not need a rewrite. The account layer needs another hardening pass before it becomes the home for private journals or shared community content.**

The strongest foundations are the separation of instants from calendar days, locally computed astronomy, a pure dashboard model, typed correspondence records, and a small event-rendering registry. The previous review's major architectural fixes are present in the code, rather than merely described in documentation. The current experience also has a distinctive identity worth preserving: a moon, a restrained timeline, and progressively disclosed meaning, not a generic productivity dashboard.

The main weaknesses have shifted. They are now **membership/access lifecycle, privacy promises, operational resilience, incomplete preference-sync failure handling, and the gap between precise internal event data and the information the UI makes available**. There are also real remaining accuracy issues: hemisphere inference, hemisphere-specific prose, and a lunar-age estimate presented as elapsed days.

| Area | Assessment |
| --- | --- |
| Astronomy | Good for this product's purpose. Independently checked lunar phases and seasons agree within roughly 1.5 minutes. Some labels and implied precision need correction. |
| Calendar/timezones | Strong basic model. Alias handling and inferred hemisphere still contain defects. |
| Public functionality | Useful, focused, and resilient to blocked local storage. Important event details are unnecessarily hidden or unavailable. |
| Accounts/security | Sensible library-based authentication and server-side authorization. Ongoing Discord membership is not enforced, and session renewal makes the documented access limit misleading. |
| Privacy | Not ready for sensitive personal writing. The current privacy wording already understates identifiable logging. |
| Database | Entirely reasonable for a small server community. Missing indexes and connection-failure handling matter more than changing database products. |
| Design/accessibility | Coherent visual direction and good basic controls. Contrast, motion overrides, focus restoration, and narrow-screen combinations need targeted work. |
| Testing | Unusually good date/time coverage for an app this size. Much weaker coverage of account failures, negative security cases, accessibility, and operational faults. |
| Documentation | Useful architectural guidance, but the README and parts of the account plan are stale or overconfident. |
| Expansion readiness | Ready for a public correspondence library after modest cleanup. Private writing, sharing, and reminders need explicit new foundations. |

**No critical exploit was demonstrated. That is not a security certification.** Several high-priority risks below are established by code and installed dependency behavior, but were not exercised against a production database.

## 2. Evidence and validation

### Checks completed

| Check | Result and limits |
| --- | --- |
| `npx --no-install tsc --noEmit` | Passed. |
| `npx --no-install eslint` | Passed. |
| `npm run test:tz` | Passed: 121 tests in 17 files under each of four device zones, 484 test executions in total. These are not 484 distinct tests. |
| Production build through `npm run test:e2e` | Completed and served successfully with real account variables explicitly blanked. The local build emitted 157 Turbopack warnings, including dependency CommonJS/export and `sharp` tracing warnings. |
| Playwright E2E suite | **Blocked at browser launch.** All 15 public smoke tests failed before executing page assertions because bundled Chromium exited with `SIGSEGV`; cleanup also reported `EPERM`. A user-approved broader-execution retry failed the same way. These are not 15 demonstrated app defects. |
| Account E2E suite | 12 tests skipped because no `E2E_DATABASE_URL` was configured. No disposable Postgres service was available locally. The CI configuration supplies Postgres, but CI results were not independently retrieved. |
| Local HTTP checks | `/` returned 200; `/api/me` returned the signed-out body with `private, no-store`; account pages and auth handler returned 404 in the accounts-disabled build. |
| Local browser inspection | The in-app browser rendered the dashboard, correct build hash, event list, controls, and current phase text. Screenshot capture timed out. No responsive screenshot or full interactive-browser pass is claimed. |
| OG image | Local route returned a valid 1200 × 630 PNG, which was visually inspected. |
| Published lunar phases | All **50** major phase events in 2026 compared with USNO's published table. Maximum absolute difference: **79.496 seconds**, including the published table's minute precision. No event differed by more than two minutes. |
| Seasons | Computed 2026 equinoxes/solstices compared with USNO's published values after converting its displayed Pacific standard/daylight times to UTC. All agree within approximately one minute. |
| Mercury/Venus | Existing fixture tests passed; additional probes confirmed the October/November 2026 Mercury cycle and Venus's retrograde re-entry into Libra. Mercury stations also agree with CHANI's independent published calendar to within a few minutes. |
| Dependency audit | `npm audit --json`: 12 affected package entries, 8 high and 4 moderate. `--omit=dev`: 7 entries, 3 high and 4 moderate. These are package counts, not distinct exploitable vulnerabilities. |
| Public deployment | Read-only homepage retrieval and response headers checked. Live response had Vercel HSTS but no CSP, frame policy, or referrer policy headers. Its authenticated behavior and deployment configuration were not inspected. |

Review environment: Node **24.14.0**, npm **11.12.1**, macOS arm64. CI specifies Node 22. The repository's `node_modules` symlink and local platform may contribute to build warnings or browser problems; a clean CI run is needed before attributing them to application code.

### Confidence labels

- **Confirmed:** directly established by code, a focused calculation, or an observed response.
- **Risk:** a credible failure or abuse path requiring an integration, deployment, or load test to quantify.
- **Extension requirement:** not necessarily a present defect, but a foundation needed before the relevant feature ships.

## 3. Priorities at a glance

P1 means address soon, or before expanding the account audience. P2 means a concrete improvement to schedule. P3 means polish or work that becomes necessary with a specific expansion. There is no confirmed P0 in this review.

| Priority | Finding | Main source |
| --- | --- | --- |
| P1 | SEC-01: Discord membership can lapse while an active session keeps renewing | `src/server/auth.ts:39–52,66–68`; installed Better Auth session implementation |
| P1 | SEC-02: locked production dependencies have new security advisories | `package-lock.json`; npm audit results |
| P1 | PRIV-01: identifiable logs contradict the privacy impression; no retention policy | `Dashboard.tsx:331–336`; `server/activity.ts`; `server/db/schema.ts:71–100` |
| P1 | DB-01: pool errors and stalled connections are insufficiently bounded | `src/server/db/index.ts:11–16` |
| P1 before sensitive data | OPS-02: test and migration environment isolation is not enforced | `playwright.config.ts:18–23`; `e2e/env.ts:8–17`; `scripts/migrate.mjs` |
| P2 | MATH-01: hemisphere lookup can choose the wrong wheel, including equivalent aliases | `src/lib/timezones.ts:208–218` |
| P2 | MATH-02: displayed lunar age can be almost a day wrong | `src/lib/moon.ts:35–36`; `components/details.tsx:57–64` |
| P2 | FUNC-01/02: aliases can leave the selector without a matching option; sync failures disappear | `timezones.ts:182–185`; `TimezoneSelector.tsx:18–19`; `useAccount.ts` |
| P2 | FUNC-03/04: exact event dates/times are hidden, and current Mercury details become unreachable | `eventKinds.tsx`; `CycleSpine.tsx`; `Dashboard.tsx:289–299` |
| P2 | DB-02: auth lookup/deletion indexes and identity constraints are incomplete | `src/server/db/schema.ts`; `drizzle/*.sql` |
| P2 | A11Y-01/02: low-contrast small text, incomplete reduced-motion support, and focus loss on close | `components/details.tsx`; `DetailPanel.tsx`; `app/globals.css` |
| P2 | OPS-01: documented local migration setup silently skips `.env.local` | `scripts/migrate.mjs:8–12`; `docs/accounts-plan.md` |
| P2 | DOC-01: public architecture/setup/privacy documentation has drifted | `README.md`; `docs/accounts-plan.md`; schema comments |

## 4. Mathematics, astronomy, and observance rules

### What is sound

The use of `astronomy-engine` is the right decision. There are no manually maintained future ingress tables to expire. The underlying chain is coherent:

- Sun longitude and cardinal ingresses use the same astronomical source as the seasons.
- Lunar phase position and illuminated fraction are separate quantities, correctly obtained separately.
- Mercury stations are found from apparent longitude-rate changes, and shadows from revisiting the station longitudes, not arbitrary day offsets.
- Venus retrograde re-entries are represented explicitly.
- Calendar-day festivals use `CalendarDay`; astronomical moments remain `Date` instants. `dayOf(instant, timezone)` makes the conversion explicit.
- The lunar-disc construction has the correct projected-area relationship: the terminator's horizontal radius is `r × |1 − 2f|`, with the crescent/gibbous sweep selected separately. The southern presentation flips the lit limb and rotates the photograph.

The independent 2026 phase comparison is strong positive evidence for the actual calculations. For example, the September Full Moon is computed at **26 September 16:49:32 UTC**, consistent with USNO's **16:49**. [cite: Dates of Primary Phases of the Moon | 2026 Sep 26 16:49](https://aa.usno.navy.mil/calculated/moon/phases?year=2026)

The calculated 2026 seasonal instants are:

| Event | Computed UTC |
| --- | --- |
| March equinox | 20 Mar 14:45:36 |
| June solstice | 21 Jun 08:25:00 |
| September equinox | 23 Sep 00:05:39 |
| December solstice | 21 Dec 20:50:22 |

USNO's source used for the fresh comparison displays Pacific times, including DST. The June value there is 01:24 PDT, or 08:24 UTC; the difference from the computation is about one minute, not an hour. [cite: Earth's Seasons - Equinoxes, Solstices, Perihelion, and Aphelion](https://aa.usno.navy.mil/calculated/seasons?dst=true&submit=Get+Data&tz=8&tz_label=false&tz_sign=-1&year=2026)

For Mercury, an additional probe gives station retrograde **24 October 07:15:56 UTC**, station direct **13 November 15:52:44 UTC**, pre-shadow **4 October 09:11 UTC**, and post-shadow ending **30 November 06:17 UTC**. CHANI publishes the two stations at 00:12 Pacific daylight time and 07:53 Pacific standard time, respectively, consistent within a few minutes after conversion. [cite: 2026 astrological key dates: Mercury retrogrades | Mercury stations direct on November 13th, 2026, at 7:53 am PT](https://www.chani.com/this-year/key-dates/2026-astrological-key-dates-mercury-retrogrades)

### MATH-01. Hemisphere inference is not a reliable source of seasonal preference

**Confirmed, P2.** `hemisphereFromTimezone` tests exact membership in `SUPPORTED_TIMEZONES`, then infers from January/July offsets and an incomplete fallback list. It does not first resolve an alias to the listed zone.

Focused probes at 17 October 2026 returned:

| Input zone | Result | Problem |
| --- | --- | --- |
| `America/Argentina/Buenos_Aires` | north | Alias of the listed southern `America/Buenos_Aires`. |
| `america/lima` | north | Accepted by `Intl`, but casing bypasses the explicit southern entry. |
| `Asia/Jayapura` | north | Southern location absent from the fallback list. |
| `Asia/Makassar` | north | Same issue. |
| `Pacific/Tahiti` | north | Same issue. |
| `Antarctica/Casey` | north | Same issue. |

Nairobi and Dar es Salaam also return north. Near-equatorial locations do not map neatly to either temperate seasonal wheel, which is a product-policy limitation rather than something a longer lookup table fully solves.

**Recommendation:** canonical/listed-zone normalization should fix alias consistency immediately. More importantly, add an explicit **seasonal wheel preference**: northern, southern, and eventually a custom/tradition-based option. Use timezone inference only as a default. Store this separately from the time display zone. A person reading New York event times should not have to adopt New York's seasonal observance.

**Acceptance:** aliases produce the same default; a user can override it; the override survives reload and account sync; timezone changes do not silently overwrite an explicit wheel preference.

### MATH-02. “Day N of 29.5” is not actual lunar age

**Confirmed, P2.** `getMoonAgeInDays` multiplies angular cycle progress by a fixed mean synodic month. The Moon's angular speed is not uniform, and individual lunations do not all last 29.53 days.

At **22 October 2026 12:00 UTC**:

- The displayed value is **10.9 days**.
- The preceding new moon is approximately **10 October 15:50 UTC**.
- Actual elapsed age is approximately **11.84 days**.
- The error is approximately **0.94 days** in a daily noon sweep of 2026.

This does not invalidate the illumination or phase-peak calculations. It invalidates the implied definition of the displayed age.

**Recommendation:** find the preceding new moon and divide elapsed milliseconds by a day. If retaining the approximation, label it as approximate cycle position, not a lunar day to one decimal place. If showing total cycle length, derive the interval to the next new moon rather than presenting 29.5 as a universal length.

### MATH-03. Separate astronomical facts from chosen observance conventions

**Confirmed policy/documentation gap, P2.** These are defensible conventions, but should be visible to users:

- “New Moon” and “Full Moon” labels cover ±1.5 days around the peak; quarters cover ±1 day. Thus “Full Moon” does not assert exact fullness at the displayed instant.
- Hekate's Deipnon is scheduled as the calendar day before astronomical new moon. It is not a local first-crescent visibility calculation or a reconstruction of every historical lunar calendar.
- Fire festivals use fixed civil dates; they are not calculated astronomical cross-quarter points.
- Sabbat dates are all-day observances, even where an associated equinox/solstice has a precise instant.
- Zodiac signs are tropical/geocentric, not sidereal signs or IAU constellation boundaries.
- The hemisphere-flipped moon image is symbolic orientation. It does not model observer latitude, local hour angle, parallactic angle, libration, or exactly how the Moon will be tilted above the user's horizon.

Add a compact “How dates are calculated” explanation. Preserve traditions without presenting one convention as universal or presenting astrological interpretation as a measured astronomical effect.

### Remaining copy inaccuracies

**Confirmed, P2.** Hemisphere-aware date descriptions do not make all correspondence text hemisphere-aware:

- `sabbatCorrespondences.ts:87` says the summer-solstice Sun rises at its “most northerly point.” For southern summer in December, the direction is most southerly.
- `zodiacCorrespondences.ts:151` describes Capricorn as “the depth of winter,” even when the selected wheel is southern summer.
- Equinox descriptions should consistently say *approximately* equal day/night: refraction and the Sun's finite disc prevent exact equality of daylight duration on the astronomical equinox.

Use hemisphere variants only for genuinely seasonal content; do not duplicate the entire content corpus.

### Numerical/search foundations before adding more astronomy

**Extension requirements, not demonstrated errors in today's eight-event dashboard:**

1. `getUpcomingVenusIngresses(from, to)` and `getUpcomingMercuryRetrogrades(from, to)` appear to honor arbitrary ranges but use a day cache with a fixed approximately 190-day forward scan. A two-year Venus query from January 2026 returns **8** ingresses versus **27** from a direct scan over that requested range. Document/enforce the range, or cache explicit time windows before building annual calendars or date navigation.
2. `findLongitudeCrossing` does not sample a final partial step. A five-hour search for a crossing four hours into the interval returns `null` with its default six-hour step. Current shadow callers use suitably long windows, but the generic helper is not safe for arbitrary short ranges.
3. Fixed-step sign-change detection can in principle miss a very short cusp excursion around a station if both endpoints lie in the same sign. Compare against a denser scan over multiple decades before extending the helper to other bodies and new event types.
4. The event search begins exactly 24 hours before `now`, not at the start of the selected calendar day. That is not equivalent on a 25-hour DST day. The current tests do not prove preservation of an event in the first extra hour late on such a day. Use an explicit zoned day boundary or a deliberately wider bracket followed by the existing day filter.
5. “Bisected to a minute” is numerical search tolerance, not proof of physical accuracy to a minute. Likewise, comments claiming phase search is “accurate to the second” overstate what the independent comparisons establish.
6. Define a supported year range before exposing arbitrary historical/future navigation. Removing hand-maintained table expiry does not imply unlimited ephemeris accuracy or unlimited `Intl`/calendar validity.

## 5. Accounts, security, and privacy

### Strengths to preserve

- Authentication uses Better Auth rather than hand-built OAuth/session cryptography.
- Discord membership checks fail closed on nonmembership, errors, missing configuration, and rate limits.
- Protected pages and actions derive identity from the server session, not a client-supplied user ID.
- The admin flag has `input: false`, which is the important safeguard against ordinary auth API input assigning admin rights.
- `/api/me` deliberately returns a minimal profile and uses `private, no-store`.
- OAuth tokens are configured to be encrypted at rest.
- Data access uses parameterized Drizzle queries; no unsafe user-input SQL construction was found in the reviewed code.
- Dashboard rendering does not read cookies, preserving its public static shell.
- Only `.env.example` is tracked; real environment files are ignored. No secret-value inspection was needed for this review.

### SEC-01. Leaving Discord does not reliably remove app access after 30 days

**Confirmed behavior from app and installed library, P1.** Membership is checked in the Discord profile callback, only during sign-in. Existing sessions are accepted without another membership check.

The account plan acknowledges a delay “until their session expires (30 days).” However, `expiresIn = 30 days` is not an absolute lifetime. The installed Better Auth defaults `updateAge` to one day and refreshes an eligible session's expiry to `now + expiresIn` (`node_modules/better-auth/dist/context/create-context.mjs:146–149` and `dist/api/routes/session.mjs:178–214`). An active former member can keep renewing without revisiting the Discord callback.

**Impact today:** continued access to member-only account functionality after leaving or being removed from the Discord server. **Impact later:** potentially unacceptable continued access to a private group or coven space.

**Recommendation:** decide the membership policy explicitly. Options include an absolute session lifetime that forces reauthentication, a membership freshness timestamp with bounded periodic revalidation, or a bot/event-driven revocation mechanism. Include an emergency revoke/disable path. Do not perform a Discord API call on every dashboard refresh; bounded freshness and fail-closed rules for sensitive operations are more deliberate.

**Acceptance:** an integration test signs in a member, removes membership, advances beyond the policy window, and proves that protected reads and writes fail despite regular intervening visits. Test token-expiry and Discord-outage behavior separately.

### SEC-02. Patch dependencies, but do not equate npm's count with exposure

**Confirmed advisory matches, P1.** Installed/locked versions include Next **16.3.6**, `sharp` **0.35.4**, and `source-map-js` **1.2.1**. The audit reports:

- Next issues including image-optimization SSRF, metadata-image route disclosure, and SSG/ISR cache poisoning. Reported fixed range begins at **16.3.8**.
- `sharp`/librsvg issue with reported fix **0.35.5**.
- `source-map-js` indexed-source-map denial of service with reported fix **1.2.2**.
- Development-tool chains through `braces`/`micromatch` and old `esbuild` under Drizzle tooling.

Exposure differs by feature and deployment. The app uses ISR, a generated metadata image, and Discord avatar optimization, so dismissing every Next advisory as unrelated would be wrong. Conversely, Draft Mode/`use cache` issues, hostile source maps, or an exposed development server are not proven reachable paths here. Restricted image hosts and the lack of user SVG uploads reduce some image-processing exposure; they do not replace patching.

Upgrade to supported patched releases, keep `eslint-config-next` aligned with Next, and rerun the full checks. **Do not run `npm audit fix --force` blindly:** suggested resolutions included major downgrades of Next-related tooling and Drizzle tooling. Some dev tools remain in the omit-dev audit because of lockfile/optional peer relationships; the seven entries are not seven public production endpoints.

Advisory references: [Next image optimization](https://github.com/advisories/GHSA-cjq9-62q9-8jv4), [Next metadata images](https://github.com/advisories/GHSA-f87g-xv8r-7p7x), [Next ISR/cache poisoning](https://github.com/advisories/GHSA-mcj8-r9mp-w47p), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

### PRIV-01. Privacy wording no longer matches account behavior

**Confirmed, P1.** The dashboard footer says “Calculated locally. Anonymous usage counts only.” Astronomy is calculated locally, but signed-in usage is not anonymous:

- Successful sign-ins record user identity, IP address, and user agent.
- Refused attempts record Discord ID/name where available, plus IP/user agent.
- `/api/me` records identifiable daily visits and counts.
- Better Auth also stores session request information.

No user-facing privacy notice or retention/deletion schedule was found. Refused logs have no `user_id`, so account deletion cannot cascade to prior refused records for that same Discord identity. The UI's “everything saved with it” wording therefore needs qualification or a more complete deletion policy. Backup and preview-copy retention also need an explicit policy.

**Recommendation:** explain account data and usage logging before sign-in, distinguish aggregate public analytics from member activity records, retain only what has a purpose, and implement bounded retention. Treat IP/user agent and spiritual journals as different data categories with different access and retention rules. Make the admin activity view auditable and restrict its availability to genuine operational need.

This is a product/privacy review, not a determination of legal compliance. Before adding personal religious/spiritual writing, obtain appropriate privacy/legal advice for the intended audience and jurisdiction.

### SEC-03. Hardening and abuse controls are incomplete

**Risk, P2; more important before sharing or sensitive writing.**

- No application CSP, frame-ancestors/frame policy, or referrer policy is configured. Local responses and the sampled live response lacked these headers. The live deployment does already have HSTS.
- Better Auth's default production rate limiter is enabled, but its default store is **process memory**. It is not a shared global limit across serverless instances. The direct timezone Server Action and `/api/me` visit writes are separate from that auth-route protection.
- Discord calls have no application deadline/abort signal. A provider stall can consume the request's full platform allowance.
- Logging uses request headers directly. Vercel's trusted-proxy behavior must remain the documented deployment assumption; a future host needs explicit trusted-IP handling. Bound user-controlled log fields and do not use raw forwarded headers as security proof.

Start with report-only CSP and measured compatibility checks. Choose a static-shell-compatible policy rather than forcing dynamic rendering simply to add a generic nonce recipe. Add shared/edge limits appropriate to the actual small audience and monitor database writes and refused OAuth attempts. Avoid adding an entire rate-limit service without evidence that platform controls are insufficient.

### SEC-04. Destructive actions need a stronger lifecycle before journals exist

**Risk today, extension requirement for private writing.** `deleteAccount` checks the session, signs out, then deletes the user. It does not require a recent/fresh authentication. The confirmation is client-side and can be bypassed by calling the authorized action directly; it is a usability safeguard, not an additional security boundary.

If deletion fails after sign-out, the account remains but the user is logged out, with no deletion-specific recovery flow. Once meaningful personal writing exists, add recent-authentication enforcement, server-side destructive-action validation, a clear success/failure state, and export before deletion. Test deletion of all dependent tables, not just disappearance of the user row.

### SEC-05. Review the whole exposed auth API, not just the UI

**Confirmed surface, P2 hardening.** The catch-all handler exposes Better Auth's stock routes. For example, the installed `/update-user` endpoint accepts changes to the current user's name and image even though the UI presents the profile as Discord-controlled. Non-Discord avatar sources can then conflict with the application's `next/image` allowlist.

This is not evidence of an authorization bypass: it is an unexpectedly broad mutation surface. Explicitly decide which profile fields/routes are supported, validate their length/type/source, retain `isAdmin`'s input prohibition, and test direct route calls. Add `server-only` boundaries to database/auth/data-access modules so an accidental future client import fails at build time rather than relying solely on convention.

## 6. Database efficiency and integrity

### Current workload: sensible, not overengineered

The existing workload is small. Signed-out visitors need no database data. A signed-in dashboard visit normally needs session validation, one indexed settings lookup, and a daily visit upsert, with occasional session renewal. That is a reasonable workload for Postgres/Neon.

The `user_settings` primary key fits its access pattern. The `(user_id, day)` visit key supports daily upserts and user-specific deletion. The sign-in timestamp index supports reverse chronological reading; a separate descending index is not inherently necessary. Foreign-key cascades and timezone-aware timestamps are appropriate.

There is no demonstrated need to replace Drizzle, adopt a different database, add read replicas, or introduce a cache service for this workload.

### DB-01. Pool errors can escape ordinary promise error handling

**Confirmed configuration gap; outage impact requires fault testing, P1.** `getDb` creates `new Pool({ connectionString, max: 5 })` without retaining a separately managed pool reference or registering an `error` handler.

The installed `pg-pool` emits an `error` event when an idle connected client fails. An unhandled Node EventEmitter error can terminate the process. Catching query promises in `activity.ts` does not catch that separate event. The claim that logging can “never break” the dashboard is too absolute under that failure mode.

There are also no explicit connection-acquisition or query/statement deadlines. A full or unreachable pool can leave requests waiting until a larger platform timeout.

**Recommendation:** manage the pool explicitly, attach a safe error listener, set finite connection and query/statement limits appropriate to the host, and use the hosting platform's supported serverless connection-lifecycle integration where appropriate. Test database restart, lost idle sockets, exhausted pool, and slow queries. Ensure errors do not print connection strings or query parameters containing future private writing.

`max: 5` is a **per-process** limit, not a deployment-wide cap. Confirm that runtime connections use Neon's pooled endpoint. Neon recommends pooled connections for serverless workloads and direct connections for migrations or session-dependent operations. [cite: Neon connection pooling](https://neon.com/docs/connect/connection-pooling.md)

### DB-02. Add indexes where the actual lookups need them

**Confirmed schema gaps, P2.** PostgreSQL does not automatically index the referencing side of a foreign key.

| Table/key | Recommendation | Reason |
| --- | --- | --- |
| `account(provider_id, account_id)` | Validate/deduplicate existing rows, then add a composite unique constraint | OAuth identity lookup and prevention of duplicate provider identities. |
| `account(user_id)` | Index | User account listing, unlinking, and cascade deletion. |
| `session(user_id)` | Index | Listing/revoking a user's sessions and cascade deletion. Existing unique `token` already covers ordinary session-token lookup. |
| `verification(identifier)` | Index after confirming adapter query shape | OAuth/verification lookup. |
| `sign_in_log(user_id)` | Index when logs begin growing | User deletion without scanning the complete sign-in history. |
| Expiry/retention columns | Add only with the cleanup query | Efficient scheduled cleanup of expired sessions/verification and aged logs. |

These are not evidence of a current latency crisis. With a few dozen users, scans may be cheap. Add the identity constraint for integrity, then use representative data and `EXPLAIN (ANALYZE, BUFFERS)` before accumulating speculative indexes. Indexes also cost writes and storage.

### DB-03. Admin analytics and logs need bounds

**Confirmed growth characteristics, P2/P3.** `listMembers` aggregates the whole visit history for every member and returns all members. `recentSignIns` is limited to 100, which is good; the members query is not paginated.

For 30 members, daily visits produce at most about 10,950 rows per year, not a major problem. For thousands of members over years, recomputing every aggregate on every admin request becomes avoidable work. Use pagination and a bounded date range first; add maintained summary fields only if measurements justify them.

Visit counts mean calls to `/api/me`, not verified human sessions or unique visits. A signed-in caller can repeat the GET and inflate them. Label metrics honestly and consider throttling or recording only one event per defined visit window.

Add real database constraints for invariants that must survive application bugs: allowed outcome values, positive counts, and future entry kinds. Drizzle's `text(..., { enum: [...] })` supplies TypeScript typing; the generated migration does not create a PostgreSQL enum or `CHECK` constraint for `outcome`.

## 7. Functionality and state behavior

### FUNC-01. Saved timezone aliases can disagree with the selector

**Confirmed by the value/option construction, P2.** `resolveTimezone` preserves a valid saved string verbatim. `TimezoneSelector` omits extra options when `listedZoneFor(value)` finds an equivalent listed zone, but its actual `<option>` values use the listed spelling.

For stored `Asia/Calcutta`, `America/Argentina/Buenos_Aires`, or `america/lima`, the selected React value has no matching option. The visible selection can fall back to a different option even while calculations use the saved zone. This is especially serious when the alias also triggers MATH-01.

Normalize every accepted saved/account value to the listed spelling when an equivalent exists, not just newly detected zones. Add browser tests for aliases loaded from both local storage and the account response.

### FUNC-02. Account loading/sync failures are swallowed

**Confirmed error paths, P2.** `useAccount` catches `/api/me` failures without updating the initial `undefined` state or retrying. A transient 500/offline response can leave the account affordance and sign-in link absent for the remainder of the page visit.

Dashboard preference writes use `saveTimezone(tz).catch(() => {})`. The UI changes locally even when cross-device persistence fails, and there is no pending, failed, retry, or last-synced state. The settings screen does show a failure message, but the action can also silently return for an expired/signed-out session, which the caller treats as success.

Concurrent saves are not serialized or versioned. A slower older request can overwrite a newer choice; the settings screen also updates its displayed selection only after completion. This is a race risk, not a reproduced multi-device data-loss incident.

**Recommendation:** represent account state explicitly: loading, signed out, signed in, and temporarily unavailable. Return a typed success/failure result for preference saves; retain local behavior, report failed sync non-disruptively, and retry safely. Coalesce or serialize rapid writes. Before editable notes exist, add server revisions/optimistic concurrency rather than expanding this fire-and-forget pattern.

### FUNC-03. The app calculates exact event times but rarely lets users see them

**Confirmed, P2.** The timeline usually shows only “in N days/weeks.” Event details for moon phases, Sun ingresses, Venus ingresses, and astronomical sabbats do not display the event's full selected-zone date/time. Relative weeks are rounded, which is fine for scanning but insufficient for planning.

`SpineEvent` already carries almost all the required data, including `sabbat.at` for seasonal moments. Add a shared detail header with an absolute date, exact time where meaningful, and timezone. Distinguish all-day observances from instants. This is a high-value improvement without changing the core design.

### FUNC-04. Current Mercury retrograde details become unreachable

**Confirmed, P2.** After its start date passes, the retrograde start event leaves the future spine. The header badge is explicitly noninteractive. The current period remains in `model.mercury`, but its explanation and end/shadow dates are no longer reachable through that period's panel.

Probes on **25 October** and **1 November 2026** show `status: retrograde` with no Mercury event in the model's eight events. On **20 November**, post-shadow is neither in the spine nor represented by the header badge.

Make the active Mercury state a disclosure in the Now node, or allow the badge to open the current period. Decide whether pre/post-shadow deserve a subtle status; do not depend on an already-past start event for access.

### FUNC-05. Preference modes and refresh semantics need clearer contracts

**P2/P3 product improvements.**

- There is no explicit “follow this device” mode after a manual/account choice. Signed-in first visits now persist the detected display zone, deliberately changing the earlier travel-following behavior. Represent automatic versus fixed preferences explicitly if both are desired.
- The UI recomputes every five minutes and on focus/visibility. That can leave a phase, sign, date, or badge stale for almost five minutes while the tab stays visible. This is acceptable for a reflective dashboard, but do not imply a live-to-the-second instrument. Future reminders need event-boundary scheduling, not this interval.
- Signing out in another tab or letting the session expire does not refresh the mounted account state. Add a visibility/session recheck or cross-tab notification when account functionality becomes more substantial.
- Corrupt craft records are partially validated, but seed values are only checked as numbers. Reject nonfinite, fractional, negative, and out-of-range seeds if treating saved data as untrusted. Also validate positive weights/nonempty eligible pools before making the activity set user-editable.

## 8. Design, accessibility, and content

### Preserve the design's strengths

The narrow reading column, serif lunar heading, restrained amber accents, dark-indigo palette, photographic moon, and continuous spine form a coherent product. Native buttons, `aria-expanded`, labelled timezone selection, focus-visible rings, and predominantly 44px touch targets are good decisions. The discoverability hint addresses a real weakness of visually quiet disclosure interfaces.

Do not replace this with a multi-card SaaS grid merely to expose more information. Prefer a little more precise metadata and a small number of clearly named modes/pages.

### A11Y-01. Some small text remains below normal-text contrast targets

**Confirmed from authored colors; not a full rendered accessibility audit, P2.** Against the detail panel's approximate `rgb(18,18,52)` background:

| Style | Approximate contrast |
| --- | --- |
| `text-amber/60` correspondence labels | **3.12:1** |
| `text-amber-light/60` date descriptions | **4.22:1** |
| `text-silver/50` secondary controls/text | **3.60:1** |
| Semantic `text-tertiary` token | **5.89:1** |

The first three are used for small text and fall below the usual 4.5:1 normal-text target in that approximation. Translucent surfaces vary, so final values must be measured against composited rendered backgrounds. The semantic tokens are a better starting point than scattered opacity utilities.

Audit correspondence labels, dates, select captions, footer text, close controls, and focus indicators. Test forced colors and 200%/400% zoom. Retain mood through spacing and hierarchy rather than making important text faint.

### A11Y-02. Reduced motion and keyboard closing need fixes

**Confirmed implementation issues, P2.** `DetailPanel` sets `transition` inline. The reduced-motion stylesheet's ordinary `.detail-panel { transition: none; }` cannot override that inline value, so the panel animation still runs. Move the transition into CSS or make the motion preference part of the inline decision.

Closing via the panel's own close button unmounts the focused button without explicitly returning focus to the disclosure trigger. Preserve the trigger reference and restore focus. An optional Escape shortcut is useful, but this is a disclosure, not a modal: do not add focus trapping or dialog semantics unnecessarily.

Label larger panel regions appropriately, verify screen-reader announcement order, and ensure the changing craft text is announced reliably. Its `aria-live` paragraph is remounted on every pick; behavior should be checked with real assistive technology rather than assumed.

### Responsive checks still needed

**Risk, not visually confirmed.** The header combines a nonwrapping title, timezone select, optional Rx badge, and optional account avatar. `narrow` limits the select, while `overflow-x: clip` can hide overflow instead of exposing it. Exercise 320px, 360px, enlarged text, long zone names, signed-in state, and active Mercury retrograde together. The current Playwright configuration tests desktop Chromium only.

Also test the lunar-transit row's date/sign pairing on small screens; it uses a shrinking content area plus a nonshrinking timestamp. Do not count a clipped row as “no horizontal overflow.”

### Content safety, provenance, and cultural clarity

**P2 before expanding the library.** The content is more careful than many astrology apps about distinguishing modern pagan labels from historical claims. Preserve that editorial care and add sources, tradition/context, and reviewed dates.

There are still absolute or potentially unsafe instructions: “listen to your gut without question,” leaping flames, burning paper, and lists that include yew, rue, mistletoe, and other materials without safety context. Do not imply that correspondence lists are instructions to ingest, burn, apply, or combine them. Add concise relevant cautions, safe symbolic alternatives, pet/wildlife considerations, and no-medical-substitution wording where appropriate. Moonwater needs basic hygiene/container guidance if developed into an instructional feature.

The OG image rendered successfully and matches the general aesthetic, but a Capricorn glyph rendered as a purple emoji tile while other typography is monochrome. Use deliberate text/SVG glyph presentation if consistency matters. Test long labels such as “Waning Gibbous” and solstice names across all phase/sign combinations, not just today's image.

## 9. Stability, deployment, and performance

### OPS-01. The documented local migration workflow does not load `.env.local`

**Confirmed, P2.** `npm run db:migrate` executes a plain Node script. It does not import Next's environment loader, use an env-file flag, or load dotenv. Merely copying `.env.example` to `.env.local`, as the account plan instructs, does not put `DATABASE_URL` into that process.

The script then prints “DATABASE_URL not set, skipping” and exits successfully. A developer can believe setup succeeded and encounter missing tables only when using accounts.

Load environment files explicitly with documented precedence, or require/export the variable explicitly in the setup instructions. Separate an intentional no-accounts build skip from a user-invoked migration command that should fail when its required database configuration is absent. Do not print credentials in diagnostics.

### OPS-02. Enforce isolation for tests, previews, and migration credentials

**Confirmed configuration gaps; accidental impact is a risk.**

- Without `E2E_DATABASE_URL`, `accountsServerEnv()` returns `{}`. It does not blank real account variables or prevent Next from loading `.env.local`.
- The Playwright web server first runs `npm run db:migrate`. An inherited exported `DATABASE_URL` can therefore receive migrations even when the account tests are skipped.
- Local `reuseExistingServer: true` can test whichever compatible server already occupies the port, without proving its build/account configuration matches the requested mode.
- Runtime and migration code use the same database variable. The app's runtime role therefore may have DDL rights if configured with the migration credentials.
- Migrations run on every Vercel build. The installed migrator checks its migration journal and applies a transaction, but no explicit cross-build advisory lock is present in the wrapper. Concurrent builds against the same database need serialization.
- A migration can succeed before a subsequent build fails. Production must remain compatible with the old deployed app; there is no automatic schema rollback just because deployment fails.

**Recommendation:** explicit accounts-off and disposable-database test modes; test-target validation; isolated build directories or controlled server reuse; separate least-privilege runtime and migration roles/URLs; migration serialization and expand/contract changes; restore rehearsal before private data is valuable.

Neon branching is useful, but **a branch is ordinarily a copy-on-write clone of data**, not an empty test database. Preview isolation does not itself mean production personal data is absent. Verify the actual Vercel integration/settings and use schema-only or sanitized data for sensitive previews. [cite: Neon branching | A branch is a copy-on-write clone of your data.](https://neon.com/docs/introduction/branching.md)

### OPS-03. Recovery and observability lag behind the account feature

**Confirmed gaps, P2.**

- The shared error screen assumes a corrupt saved timezone and tells users that resetting it usually helps. Database/auth/settings/admin failures can now reach the same boundary, where that advice is misleading and may discard an unrelated preference.
- Server Action failures lack tailored pending/success/retry UI for sign-in, sign-out, and deletion.
- There is no repository-defined uptime check, error-monitoring integration, retention job, or operational runbook. Provider/platform configuration may exist outside the repository; it was not verified.
- Logging failures are console-only, so a broken audit trail can go unnoticed.

Use route-appropriate errors, structured operational events with correlation IDs and redaction, a minimal health/alerting strategy, and a short runbook for Discord outage, database outage, secret rotation, session revocation, restore, and failed migration. Prefer useful alerts over collecting more personal activity.

### Performance: measure the right bottlenecks

A 12-date Node sample gave roughly **20–26ms cold** and **3.8–5.0ms warm** model construction on this machine. The existing generous performance test passed. These are Node observations, not mobile-browser latency promises.

The generated homepage references approximately **623KB of JavaScript excluding the 113KB legacy `nomodule` chunk**, about **197KB gzip** when compressing those files individually. That includes framework/runtime code and a preload; it is not a measured browser transfer waterfall. The moon photograph is **173KB**. A static shell is not the same as a tiny client payload.

Good next measurements: mobile main-thread time, long tasks during first model build/timezone changes, actual LCP/INP/CLS, and cold signed-in request latency. The hint, account affordance, and eventual content can shift the layout despite the skeleton. No field Web Vitals data was retrieved.

The hydration-safe skeleton is an intentional tradeoff: with JavaScript unavailable, the main dashboard never advances to useful sky content. Add an explanatory `noscript` fallback and keep public methodology/library content server-readable. Do not undo hydration safety by reintroducing device-dependent text into the prerendered page.

The daily planet caches are bounded; other formatter/year caches are effectively harmless for today's current-date UI but need bounds if arbitrary date navigation is added. Avoid spending effort optimizing a few milliseconds before fixing event usability and account failure paths. Lazy-load large detail/library content or move heavier scans to a worker only when measured mobile results justify it.

## 10. Code quality and maintainability

### Strong foundations

- Small, domain-named modules rather than a generic framework inside the app.
- Strict TypeScript, typed content keys, and a discriminated event union.
- The pure `buildDashboardModel(now, timezone)` seam makes testing and future server-side snapshots practical.
- A single event-kind registry makes additions manageable. Its isolated type-correlation cast is a reasonable local compromise, not a reason to replace the design.
- Consistent `safeGet`/`safeSet` storage handling and tests for blocked storage.
- Tests run across device zones and exercise unusual offsets/DST, rather than assuming the developer's locale.

### Improvements worth making

1. **Make domain contracts honest.** Public range APIs should not silently truncate; preferences should distinguish auto/fixed modes; save operations should return explicit outcomes.
2. **Separate calculation policy from physical data.** Practitioner windows, observance rules, hemisphere preference, and astronomy should be independently named/tested.
3. **Use stable content identifiers for expansion.** Human-readable names currently double as keys. Keep those unions for curated source coverage, but give database references stable IDs before renaming/localizing names.
4. **Protect server-only code structurally.** Add explicit server-only boundaries and keep client DTOs separate from database/auth shapes.
5. **Keep state machines small but explicit.** Account loading and sync need defined failure states. No global state library is required for the current app.
6. **Do not prematurely split every component.** `Dashboard` is understandable; a large `details.tsx` is not inherently a defect at this scale. Split by feature when a library/editor actually arrives.
7. **Strengthen runtime validation at external boundaries.** Timezone input already has a sensible manual guard. Zod is installed but unused by current app code; use it when structured note/import inputs arrive, or remove unnecessary direct dependency surface if there is no near-term use. Do not introduce schemas just to replace one clear string check.
8. **Remove stale comments and overclaims.** `user_settings` still says only explicit choices are stored, whereas accounts now adopt the detected zone. “Pure” model construction also benefits from module caches; this is deterministic memoization, not a problem, but benchmark/test assumptions should acknowledge it.
9. **Define toolchain expectations.** Pin/document supported Node and npm versions. Local Node 24 versus CI Node 22 and an old pinned Playwright browser make failures harder to interpret. Update the browser tooling deliberately rather than installing global packages.

## 11. Documentation and repository hygiene

### DOC-01. Documentation should describe the shipped state, not just earlier plans

**Confirmed, P2.**

| Document/area | Required correction |
| --- | --- |
| README opening | “No backend, no database, no external data APIs” is true only of the public calculation path, not the app with optional accounts. |
| README feature list | Missing Daily Craft, Discord accounts, synced preferences, admin activity, and their privacy implications. |
| README architecture | Missing server modules, auth/account routes, database migrations, and account client hook. |
| README development | Add account-off versus account-on setup, explicit local environment loading, disposable E2E DB instructions, and migration safety. |
| Account plan status | Foundation is implemented; remaining library/book/ritual work must be clearly marked as proposed. Remove resolved “open questions.” |
| Account plan session policy | Replace the misleading fixed 30-day membership-access statement with actual renewal/revocation behavior. |
| Account plan privacy | Export is not implemented in the current settings UI. Do not imply it already exists. Clarify refused logs and backup/preview retention. |
| Account plan Neon setup | Preview databases and data hygiene depend on integration configuration; a branch may contain copied production data. |
| Schema/shared DTO comments | Update “explicit choices only” and “if they have made one” descriptions to reflect automatic first-account adoption. |
| Previous review | Keep as historical evidence, but its “npm audit reports 0” and “all findings fixed” status must not be read as a current security guarantee. Link/point readers to the new review. |

Add a short current architecture/setup guide plus a separate operational/privacy guide. Avoid turning `AGENTS.md` into the only reliable human documentation.

No asset provenance/license document was found. The moon component labels the photo NASA/public domain, but does not record an exact source. The repository includes three font files without an accompanying visible license file in `assets`. Record original sources, licenses, and required notices. A project license is also needed if the code is intended for public reuse, even though `package.json` is marked private.

The CI workflow is useful but runs on `push`, not `pull_request`. Configure the desired PR policy explicitly, least-privilege workflow permissions, dependency monitoring, and failure artifacts such as Playwright traces/screenshots. Avoid claiming every proposed PR path is protected without checking branch protection outside the repository.

## 12. What the app could become, and the foundations each direction needs

The best next identity is **a trusted companion for noticing cycles and recording practice**, not a social network by default. The existing moon/timeline remains the front door. Expansion should be opt-in and should not make anonymous visitors depend on accounts or a database.

| Direction | What can be reused | What must be added first |
| --- | --- | --- |
| Public correspondence library | Typed data records and existing detail components | Stable entity IDs; normalized herb/crystal/color relationships; provenance, safety notes, searchable/browsable routes; accessible navigation and metadata. No database required for the first curated version. |
| Date navigation / annual calendar / calendar export | Ephemeris, `CalendarDay`, event union | Range-complete APIs/caches; supported date range; stable event identity; absolute times; explicit all-day versus instant semantics; export tests around DST and recurrence. |
| Book of Shadows / private journal | Server auth, cascades, pure model | Privacy/retention/export/delete policy; user-owned entry schema; revision/concurrency controls; pagination; authorization tests; safe Markdown rendering; backup/restore; failure-aware drafts. |
| Daily Craft history and ritual templates | Activity IDs, craft context, upcoming events | Distinguish suggested, saved, and completed actions; user-owned logs; template versions; idempotent “log this” operation; deliberate timezone/day semantics. |
| Personal correspondences | Curated unions/content and account layer | Separate curated source from private annotations; typed stable references; validation; import/export; no accidental publication of personal notes. |
| Location-specific sky features | Astronomy library's observer APIs | Explicit latitude/longitude with privacy controls; opt-in location persistence; horizon/visibility definitions; true orientation and local eclipse visibility calculations. A timezone is not a location. |
| Notifications / Discord reminders | Event generation and user identity | Consent; bot/channel permissions; durable scheduler/queue; per-user timezone; event versions; deduplication, retries, quiet hours, delivery records, cancellation, and deletion cleanup. A five-minute browser timer is not a reminder service. |
| Shared rituals / coven spaces | Discord sign-in and future private content | Organization/group membership model; ongoing revocation; role-based authorization; share-link scope/expiry/revocation; abuse/reporting controls; stricter privacy boundaries. Do not expose private journal records by adding one `isPublic` flag without a threat model. |
| Offline/PWA use | Local astronomy and static public content | App/cache update policy; explicit offline state; account-safe cache exclusions; durable local drafts; conflict resolution; device data removal. Never cache private API responses as generic public assets. |

### Recommended future data boundaries

Before implementing personal writing, settle these small contracts:

- **Preferences:** timezone mode and fixed zone, independent seasonal-wheel preference, optional tradition/observance policy, version/updated time.
- **Entry:** opaque ID, owner derived from session, kind, title/body, authored instant, selected timezone, explicit calendar day, created/updated times, revision, and bounded tags.
- **Sky snapshot:** schema version, calculation/library version, instant, timezone, wheel/observance policy, and the facts captured. Do not serialize the complete presentation-heavy `DashboardModel` as the permanent storage contract. Do not silently recalculate historical snapshots after a library upgrade.
- **Source content:** stable IDs and provenance, distinct from display names and personal annotations. Normalize synonym variants such as “bay”/“bay laurel” and “elder”/“elder flower” deliberately rather than building reverse links from raw strings.
- **Queries:** user scope in every private read/write; `(user_id, day/id)` indexes for keyset pagination; body-size limits; appropriate search indexes only after actual search requirements are known.
- **Draft/sync:** local unsaved state clearly separated from server-saved state; version conflicts detectable; retries idempotent; export remains usable during feature changes.

Server-side sky calculation does **not** make end-to-end encryption conceptually impossible. A future encrypted journal could compute snapshots locally and store encrypted body/snapshot data, at the cost of server-side search and more difficult recovery/sharing. The current account plan's encryption tradeoff should be a deliberate product decision, not an architectural inevitability. Decide before sensitive writing is collected.

### Invariants to preserve

1. Anonymous `/` remains useful when Discord or Postgres is unavailable.
2. Instants and calendar days remain distinct throughout storage, display, import, and export.
3. Timezone is not used as a substitute for location, hemisphere preference, or tradition.
4. Astronomy facts and spiritual interpretation remain clearly distinguishable.
5. Every private record is authorized on the server, including exports and background jobs.
6. Personal data can leave the system through a documented export, and deletion has a defined scope.
7. Migrations remain backward compatible across deployment overlap.
8. The frontend stays calm and focused as richer workflows move into dedicated pages.

## 13. Suggested delivery sequence

### Stage A: harden the app that exists

- Patch advisory-affected dependencies without forced major downgrades.
- Decide and test membership expiry/revalidation and emergency revocation.
- Correct privacy wording; add an understandable notice and retention policy.
- Handle pool errors and request/query timeouts.
- Fix environment loading and prevent tests/previews from silently targeting real databases.
- Correct hemisphere alias handling, saved-zone normalization, and lunar age.
- Make current Mercury details and absolute event times reachable.

**Done when:** a clean reproducible build, unit suite, public E2E suite, and disposable-DB account suite pass; the core defect reproductions below have regression tests; a database/provider failure does not become a permanently invisible account state.

### Stage B: make the existing experience dependable and discoverable

- Add clear account sync states and safe retry/ordering.
- Fix measured contrast, reduced motion, and close-focus behavior.
- Complete mobile/text-zoom and keyboard/screen-reader checks.
- Repair current documentation and add the operations checklist.
- Add missing auth indexes/constraints after checking actual query plans and existing data.
- Add basic redacted error monitoring and restore testing.

**Done when:** users can understand what is saved, what is local, when data sync failed, when an event happens, and what personal data is retained.

### Stage C: ship the public library

Build the curated, read-only correspondence library first. It makes existing content valuable without immediately increasing private-data risk. Use it to establish stable IDs, provenance, safety metadata, and accessible browse/search patterns.

### Stage D: private writing and rituals

Add Book of Shadows with export, deletion, draft recovery, authorization tests, and revisions from its first release. Then connect Daily Craft logging and ritual templates. Treat notifications and shared spaces as separate later projects with their own lifecycle/security design.

## 14. Test additions with the highest return

| Test | What it should prove |
| --- | --- |
| Stored/account timezone aliases | Matching visible option, calculations, and hemisphere for Kolkata/Calcutta and Buenos Aires aliases. |
| Hemisphere preference | Explicit override beats inferred zone; timezone changes do not erase it. |
| True lunar age | Elapsed time since independently published new moon, including wrap and variable lunations. |
| Full-year almanac fixtures | All 2026 phases plus additional years, published URLs, UTC normalization, and explicit tolerances. |
| Range/search helpers | Requested range is complete; partial last step, angular wrap, stations near cusps, invalid step/range inputs. |
| Selected-zone 25-hour day | Earlier same-day events survive late in the day, not just around the transition instant. |
| Membership/session lifecycle | Renewal cannot evade the chosen revocation policy. |
| Mocked complete OAuth callback | Profile, guild check, account/session creation, refusal logging, and no unintended user/session on refusal. Existing redirect tests alone do not prove this chain. |
| Direct authorization/negative API tests | Nonadmin denial, `isAdmin` mutation rejection, signed-out/expired action handling, invalid inputs, cross-origin protection, cross-user access once private records exist. |
| Sync fault tests | Slow/failed `/api/me`, failed saves, reversed response order, rapid selection changes, cross-tab sign-out. |
| Deletion/retention integration | All dependent rows removed as promised; refused logs/backups follow documented policy; failed deletion does not falsely claim success. |
| Database fault tests | Lost idle socket, acquisition timeout, slow query, pool exhaustion, safe logging, recovery after restart. |
| Migration tests | Empty DB and upgrade from previous schema; simultaneous deployment handling; old app compatibility; wrong/missing DB rejected in test mode. |
| Browser/accessibility matrix | Chromium plus WebKit/Firefox as practical; mobile widths; Rx + avatar header; keyboard focus; reduced motion; contrast; enlarged text. |
| OG regression | Valid PNG, expected metadata, long labels, all phase geometries, date rollover/cache behavior, and glyph consistency. |

The existing suite deserves to be kept. Extend its independent-fixture discipline to new features rather than replacing truth tests with snapshots of the app's own output.

## 15. Reproduction notes and limits

These examples identify the reviewed behavior without requiring production credentials:

```ts
// Valid alias, wrong hemisphere in the reviewed implementation:
hemisphereFromTimezone(
  'America/Argentina/Buenos_Aires',
  new Date('2026-10-17T12:00:00Z'),
); // 'north'

// Displayed age is 10.9; elapsed time since the preceding new moon is ~11.84 days:
getMoonPhaseInfo(new Date('2026-10-22T12:00:00Z')).ageInDays;

// Current retrograde exists, but its start event is no longer in the visible model:
const m = buildDashboardModel(
  new Date('2026-11-01T12:00:00Z'),
  'Europe/London',
);
m.mercury.status; // 'retrograde'
m.events.some(e => e.kind === 'mercury-rx'); // false

// Range silently limited by the cached window:
getUpcomingVenusIngresses(
  new Date('2026-01-01T00:00:00Z'),
  new Date('2028-01-01T00:00:00Z'),
).length; // 8; direct scan over the full range finds 27
```

The review used temporary calculation/HTTP probes outside the repository; those are not newly committed tests. Recreate the examples as normal regression tests when implementing fixes. Dependency results are a dated registry snapshot. Timing measurements are machine-specific. Production database indexes, roles, Neon branching settings, backup configuration, traffic, and query plans remain **unverified**, and the unavailable Playwright/browser screenshot checks remain explicit validation gaps.
