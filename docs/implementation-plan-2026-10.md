# Implementation plan: the rest of the October 2026 review

This plan covers everything [full-app-review-2026-10-17.md](full-app-review-2026-10-17.md)
raised that PRs #6 to #16 did not fix (see the status table at the top of the
review). It is split into two stages:

- **Stage 1** fixes what affects the app as it is today. Each PR is small and
  can ship on its own.
- **Stage 2** builds what has to exist before the Book of Shadows or any other
  personal writing is stored. None of it is urgent until that work starts.

Every PR leaves `main` green: `npx tsc --noEmit`, `npx eslint`,
`npm run test:tz`, `npm run test:e2e` (CI runs the account tests against
Postgres). Some steps are settings only the owner can change (GitHub, Vercel,
Neon); they are marked **Owner**.

The decisions that need your input are at the end. Each has a recommended
default, and the plan assumes it.

| PR | Title | Review refs | Size | Depends on |
|---|---|---|---|---|
| **Stage 1** | | | | |
| 1 | Event search on 25-hour days; range-complete planet searches | §4 search items 1, 2, 4 | S | – |
| 2 | Small-screen and accessibility pass | §8 responsive, A11Y | M | – |
| 3 | Admin pagination, visit counting, database checks | DB-03 | S | – |
| 4 | CI, toolchain and repository settings | §10 item 9, §11 | S | – |
| 5 | Enforce the content security policy | SEC-03 | S | 2 weeks of report-only data |
| 6 | Preference modes and session freshness | FUNC-05 | M | Decision 1 |
| 7 | Small fixes: licences, OG glyph, noscript, Zod | §8, §9, §10 item 7, §11 | S | – |
| **Stage 2** | | | | |
| 8 | Shared rate limits and bounded log fields | SEC-03 | S | – |
| 9 | Monitoring, alerts and runbook | OPS-03 | M | Decision 3 |
| 10 | Database roles, migration safety, preview data, restore | OPS-02 | M | mostly Owner |
| 11 | Deletion lifecycle and export | SEC-04, PRIV-01 | M | Decisions 4, 5 |
| 12 | Foundations for personal data | §10 item 3, §12 | M | 11 |

Stage 1 PRs 1, 2, 3, 4 and 7 touch different files and can run in parallel.

---

## Stage 1: the app as it is

### PR 1: Event search on 25-hour days; range-complete planet searches

**Why.** `getUpcomingEvents` (`src/lib/events.ts`) searches from
`now - 24h` and relies on the day filter to keep "today". On the day the
clocks go back, the local day is 25 hours long, so late that evening an event
from the first hour of the day falls outside the window and drops off the
spine. Separately, `getUpcomingVenusIngresses` and
`getUpcomingMercuryRetrogrades` (`src/lib/planets.ts`) take a `from`/`to`
range but return only what fits in a fixed 190-day cached window: a two-year
Venus query returns 8 ingresses instead of 27. The dashboard asks for less
than 190 days today, so this is a trap for the next feature, not a visible
bug. `findLongitudeCrossing` (`src/lib/ephemeris.ts`) never samples the last
partial step, so a short window can miss a crossing near its end.

**Changes.**
1. `events.ts`: start the search at the start of the local day,
   `startOfDay(today, timezone)` minus a margin for the Deipnon look-ahead,
   instead of `now - DAY_MS`. Add a `startOfDay` helper to `days.ts` that
   finds the first instant whose `dayOf` is `today` (use `Intl`, never
   hand-computed offsets).
2. `planets.ts`: make the range honest. Either cache explicit windows and
   extend the scan to cover `to`, or clamp `to` to the cached window and say
   so in the function's name and type. Recommended: extend the scan, keeping
   the per-day cache for the dashboard's default range.
3. `ephemeris.ts`: in `findLongitudeCrossing` (and `findSignChanges`), sample
   `to` itself after the loop when the last step overshoots it.
4. Document the supported year range (review §4, search item 6) in `ephemeris.ts`, e.g.
   1900 to 2100, and reject inputs outside it in the public range helpers.

**Tests.**
- A selected-zone 25-hour day (Europe/London, 25 Oct 2026): at 23:30 local,
  an event at 00:15 local the same day is still on the spine.
- Two-year Venus ingress query matches a direct scan (27 ingresses), with
  dates checked against a published ephemeris, not the code's own output.
- A five-hour `findLongitudeCrossing` window with the crossing four hours in
  returns it.

**Acceptance.** All three reproductions from the review fail before and pass
after; `npm run test:tz` passes under all four device zones.

### PR 2: Small-screen and accessibility pass

**Why.** Nobody has checked the header (title, timezone select, Rx badge,
avatar) at 320 to 360 px or with enlarged text, and `overflow-x: clip` can
hide overflow rather than show it. The e2e suite runs only in a desktop
Chromium window.

**Changes.**
1. Add Playwright projects for a 360 px phone (Pixel-sized Chromium) and
   WebKit (iPhone), for the smoke tests only. Keep account tests on desktop
   Chromium to keep CI time down.
2. A layout test at 320 px, signed in, with Mercury retrograde active
   (fixed clock on 1 Nov 2026) and the longest listed zone name: no element
   wider than the viewport, nothing clipped in the header, the moon-transit
   row's date and sign both visible.
3. Fix whatever that finds (likely: let the header wrap to two rows below
   360 px rather than squeeze the select).
4. Manual pass, recorded in the PR: VoiceOver on iOS and macOS (panel
   announcements, the Daily Craft `aria-live` text), forced colours
   (Windows high contrast emulation in Chromium), and 200% and 400% zoom.
   Fix what it finds.

**Acceptance.** The new layout tests pass in all projects; the manual pass
notes are in the PR.

### PR 3: Admin pagination, visit counting, database checks

**Why.** `listMembers` aggregates every visit for every member on each admin
page load. Visit counts are calls to `/api/me`, which a signed-in member can
inflate by reloading. `sign_in_log.outcome` is a TypeScript enum only; the
database accepts any text.

**Changes.**
1. Migration: `CHECK (outcome IN ('signed-in', 'refused'))` on
   `sign_in_log`, `CHECK (count > 0)` on `visit_log`, `CHECK (wheel IN
   ('auto', 'north', 'south'))` on `user_settings`.
2. `recordVisit`: count a visit at most once per 30 minutes per member
   (compare `last_at`), so the count means "visits", not "page loads"
   (Decision 2). Label it "visits" on `/admin` with a one-line definition.
3. `/admin`: paginate members (50 per page, keyset on `created_at, id`) and
   limit the visit aggregate to the last 90 days, which is all the logs keep
   anyway.

**Tests.** Account e2e: two `/api/me` calls a minute apart count once; an
invalid `outcome` insert is rejected by the database; the members list pages.

### PR 4: CI, toolchain and repository settings

**Why.** CI runs on `push` only, nothing makes it a required check (which is
why `gh pr merge --auto` merged #14 before CI finished), there is no
dependency monitoring, failed e2e runs leave no traces, and CI uses Node 22
while local development uses Node 24. The last three PRs' Vercel previews
failed with "Resource provisioning failed" while production deployed fine.

**Changes.**
1. `.github/workflows/ci.yml`: run on `pull_request` and on `push` to
   `main`; set `permissions: contents: read`; upload `test-results/` and the
   Playwright report as artifacts when e2e fails.
2. `.github/dependabot.yml`: weekly npm and GitHub Actions updates, grouped
   (minor and patch together), ignoring major versions of `next`,
   `eslint-config-next` and `drizzle-kit` (those are upgraded deliberately).
3. `.nvmrc` and `package.json` `engines`: one Node version for local, CI and
   Vercel (Decision 6). Update `setup-node` to read `.nvmrc`.
4. **Owner:** in GitHub, Settings, Branches, protect `main`: require the
   `check` status and an up-to-date branch. After that, `gh pr merge --auto`
   waits for CI as intended.
5. **Owner:** in Vercel, Settings, General, set the Node version to match.
6. **Owner, with help:** look at a failed preview's build log in Vercel. If
   it is a Neon branch quota (the integration creates a database branch per
   preview), delete old preview branches in Neon or cap them.

### PR 5: Enforce the content security policy

**When.** About two weeks after #13 went live (from 31 Oct 2026), once
production has run with the report-only policy.

**Changes.**
1. Check for violations: browse every page (dashboard, panels, sign-in,
   settings, admin, OG image) with the console open, signed in and out.
   Optionally add a `report-to` endpoint that logs violations (no personal
   data) for a week first.
2. Move the policy from `Content-Security-Policy-Report-Only` to
   `Content-Security-Policy` in `next.config.ts`, keeping `frame-ancestors`.
3. Keep the e2e test that collects `securitypolicyviolation` events; it now
   guards the enforced policy.

**Acceptance.** No violations in the e2e run or the manual pass; `/`
stays prerendered (no per-request nonce).

### PR 6: Preference modes and session freshness

**Why.** Once a timezone is saved there is no way back to "follow this
device", which matters to anyone who travels. Signing out in another tab, or
a session ending, leaves the dashboard showing the avatar until reload.
Saved Daily Craft data is only partly validated.

**Changes.**
1. Timezone mode (Decision 1): add "Your device's timezone (automatic)" at
   the top of the selector. Choosing it clears the saved zone locally and
   stores `'auto'` on the account; the dashboard then resolves the browser's
   zone on every visit, as it does before any choice. The seasonal wheel
   already has this ('From timezone').
2. Session freshness: re-check `/api/me` when the tab becomes visible, at
   most every 10 minutes, without recording a visit (a query flag or a
   separate lightweight route), and broadcast sign-out to other tabs with
   `BroadcastChannel`.
3. Daily Craft: validate saved seeds (finite, integer, within the pool),
   and fall back to a fresh pick otherwise; validate weights and non-empty
   pools in a unit test over `src/data/craftActivities.ts`.

**Tests.** Unit tests for the mode resolution and craft validation; e2e:
automatic mode follows a changed browser zone on reload; signing out in one
tab removes the avatar in another.

### PR 7: Small fixes

1. **Licences.** Add `docs/asset-sources.md`: the moon photograph's exact
   source and licence (find the original NASA image and record its URL), the
   three fonts and their licences (copy the OFL texts next to the files if
   required). Decide whether the code itself gets a licence (Decision 7).
2. **OG image glyph.** The Capricorn sign rendered as a purple emoji tile.
   Render sign glyphs with the text presentation selector (`︎`) or as
   SVG paths, and add a test that renders the image for every sign and
   checks it returns a PNG; eyeball all twelve once.
3. **No JavaScript.** Add a `<noscript>` note in the dashboard skeleton
   explaining that the moon and dates are calculated in the browser.
4. **Zod.** It is a dependency but nothing imports it. Remove it now; add it
   back with PR 11 or 12 if inputs get structured.

---

## Stage 2: before personal writing

### PR 8: Shared rate limits and bounded log fields

1. Better Auth's rate limiter keeps counts in memory per serverless
   instance. Switch it to `rateLimit: { storage: 'database' }` (Better Auth
   supports it; add its table to the schema and migrate), and set custom
   limits on the sign-in routes.
2. Limit the timezone and wheel Server Actions per user (a few per second is
   plenty) using the same table or a simple per-user timestamp check.
3. Truncate logged `user-agent` to 512 characters and validate the IP field
   before storing (`activity.ts`). Note in `AGENTS.md` that the IP comes
   from Vercel's `x-forwarded-for` and is trusted only because Vercel sets
   it.

### PR 9: Monitoring, alerts and runbook

1. Error monitoring (Decision 3): start with Vercel's own Observability and
   log alerts on 5xx rates and the `Could not record` / membership-check
   errors, rather than a new vendor. Redact: no connection strings, no
   cookies, no query parameters in logged errors.
2. An uptime check on `/` and `/api/me` (Vercel or a free external monitor).
3. Alert when the 04:00 UTC log purge fails (it returns non-200).
4. `docs/runbook.md`, one page: Discord outage (sign-in fails closed;
   dashboard unaffected), database outage (account features unavailable;
   dashboard unaffected), rotating each secret (`BETTER_AUTH_SECRET` signs
   everyone out; `DISCORD_CLIENT_SECRET`; `CRON_SECRET`), revoking a member,
   a failed migration on deploy, restoring from backup.

### PR 10: Database roles, migration safety, preview data, restore

Mostly **Owner** work in Neon and Vercel, with small code changes.

1. Two connection strings: `DATABASE_URL` for the app (a role with only
   `SELECT, INSERT, UPDATE, DELETE` on the app's tables) and
   `DATABASE_MIGRATION_URL` for `scripts/migrate.mjs` (the owner role, direct
   not pooled). The migrate script uses the migration URL when set.
2. Take a Postgres advisory lock around migrations in `migrate.mjs`, so two
   simultaneous builds can't both migrate.
3. Write down the expand/contract rule in `AGENTS.md`: add columns and
   tables first, deploy, then remove old ones in a later deploy.
4. Previews: check what the Neon integration branches from. If it is
   production, switch to an empty or schema-only parent for previews, or
   accept that previews show real members and keep previews protected.
5. Rehearse a restore: restore a Neon branch to a point in time, point a
   preview at it, sign in, check the data. Note how long it took in the
   runbook.

### PR 11: Deletion lifecycle and export

1. Export (Decision 5): "Download my data" on `/settings`, returning
   everything tied to the account (profile, settings, the member's own
   sign-in and visit logs, and later journal entries) as JSON, plus Markdown
   for writing once it exists. Authorized by `requireUser()`; never cached.
2. Deletion (Decision 4): require a sign-in within the last 10 minutes,
   otherwise send the member through Discord again first; check it on the
   server, not only in the confirm dialog. Delete the data before signing
   out, and show a clear success page or an error that keeps the member
   signed in.
3. Tests: deleting removes rows from every table that references `user.id`
   (enumerate them from the schema so a new table can't be missed); a stale
   session is sent to re-authenticate; export contains every table's rows.

### PR 12: Foundations for personal data

Design work, then small code: settle the contracts in review §12 before the
Book of Shadows code is written.

1. **Stable content IDs.** Give every correspondence record an ID that
   doesn't change when its display name does (`names.ts` unions stay for
   coverage). Normalize synonyms (bay / bay laurel, elder / elder flower).
2. **Entry contract.** Owner from the session; kind; title and body with a
   size limit; authored instant plus the timezone and `CalendarDay` it was
   written in; created/updated; a revision number for optimistic
   concurrency; bounded tags; `(user_id, day, id)` index for paging.
3. **Sky snapshot.** A small, versioned record (schema version,
   `astronomy-engine` version, instant, timezone, wheel, and the facts
   captured), not the whole `DashboardModel`. Never recalculated after an
   upgrade.
4. **Drafts.** Local unsaved state kept separately from server state, with
   conflicts detected by revision.
5. Decide on end-to-end encryption (accounts plan, open question 2) before
   any of this ships.

---

## Decisions

| # | Decision | Recommended default |
|---|---|---|
| 1 | Add an explicit "follow this device" timezone mode? | Yes, as the first option in the selector. |
| 2 | What counts as a visit? | At most one per member per 30 minutes. |
| 3 | Error monitoring: Vercel's built-in tools or a vendor such as Sentry? | Vercel's built-in first; add a vendor only if it falls short. |
| 4 | How recent must a sign-in be to delete the account? | 10 minutes. |
| 5 | Export format? | JSON now; JSON and Markdown once writing exists. |
| 6 | Which Node version everywhere? | 24 (an LTS release), matching local development. |
| 7 | Licence for the code? | None for now. The repository is public, so the code can be read but not reused without permission; add a licence if others should be able to reuse it. |

## Owner checklist

- [ ] Protect `main` and require the `check` status (PR 4).
- [ ] Set Vercel's Node version to match `.nvmrc` (PR 4).
- [ ] Look at a failed preview build log; tidy Neon preview branches (PR 4).
- [ ] Browse production with the console open before PR 5 (from 31 Oct 2026).
- [ ] Set up alerts in Vercel (PR 9).
- [ ] Create the app and migration roles in Neon; add `DATABASE_MIGRATION_URL` to Vercel (PR 10).
- [ ] Check the Neon preview branching parent (PR 10).
- [ ] Rehearse a restore (PR 10).
