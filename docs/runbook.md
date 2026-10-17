# Runbook

What to watch, and what to do when something breaks. The dashboard itself
needs nothing at run time: it is a prerendered page that computes everything
in the browser. Only accounts (sign-in, settings sync, `/admin`, the log
purge) depend on Discord and Postgres, and the dashboard keeps working
without them.

## Monitoring

| What | Where | Set up |
| --- | --- | --- |
| Server errors (5xx spikes) | Vercel, team Settings, Alerts: the error anomaly alert, by email | Owner. Needs a plan that includes Alerts (Pro with Observability at the time of writing; check the dashboard). |
| Logged problems | Vercel project, Logs: search `[ops]` | Nothing to set up. Retention depends on the plan, so look soon after an alert. |
| Site up | An external monitor (e.g. UptimeRobot or Better Stack, free tier) on `https://moon.terriblerealms.com/` and `/api/me`, every 5 minutes, expecting 200 | Owner. `/api/me` without a cookie answers `{"user":null,…}` without touching the database, so it checks the functions run but doesn't keep Neon awake. |
| Daily log purge | A cron monitor (e.g. Healthchecks.io, free) expecting one ping a day at 04:00 UTC with an hour's grace. Put its ping URL in `CRON_HEARTBEAT_URL` (Production) | Owner. The purge pings it only after it succeeds, so a failed purge, a missing `CRON_SECRET`, an unreachable database or a cron that never ran all end in a missed ping. |

Vercel's built-in alerts match error rates, not log text, so the `[ops]`
lines below are for reading after an alert, not alerts in themselves. Alerting
on a particular line would need a log drain to another service.

### `[ops]` events

Each is one line, `[ops] <event> {json}`, with URLs, tokens, cookies and query
parameters redacted (`src/server/ops.ts`).

| Event | Means |
| --- | --- |
| `discord-check-failed` | The membership check got something other than yes or no from Discord (`status`), or no answer. That sign-in was refused. |
| `discord-guild-unset` | `DISCORD_GUILD_ID` is missing; every sign-in is refused. |
| `activity-write-failed` | A sign-in or visit (`what`) wasn't logged. The sign-in or page load itself went ahead. |
| `db-pool-error` | An idle database connection dropped. Usually Neon suspending; harmless unless it comes with 5xx errors. |
| `cron-secret-unset` | `CRON_SECRET` is missing in Production; the purge refuses to run. |
| `log-purge-failed` | The purge reached the database and failed; it answered 500. |
| `heartbeat-failed` | The purge worked but couldn't ping `CRON_HEARTBEAT_URL`. Expect a false alarm from the cron monitor. |

## Discord outage

Sign-in fails closed: anything but a clear "member" from Discord refuses it,
with `discord-check-failed` in the logs. Members already signed in are not
affected (membership is only checked at sign-in), and the dashboard works for
everyone. Nothing to do but wait; check discordstatus.com.

## Database outage

Account features stop: sign-in, settings sync and `/admin` fail, and the
dashboard shows the account as unavailable. The dashboard itself is
unaffected. Check Neon's status page and the project's compute in the Neon
console. Logging failures (`activity-write-failed`) during the outage are
expected; those rows are simply missing.

## Rotating a secret

Set the new value in Vercel (Settings, Environment Variables), then redeploy
production. Do Preview too if it uses the same value.

- `BETTER_AUTH_SECRET` (`openssl rand -base64 32`): signs session cookies,
  so rotating it signs everyone out. Members sign in again as normal.
- `DISCORD_CLIENT_SECRET`: reset it in the Discord developer portal, OAuth2
  tab. Sign-in fails between the reset and the redeploy, so do both together.
- `CRON_SECRET`: nothing else to change. A purge that runs mid-change may
  answer 401 and miss one ping.
- `CRON_HEARTBEAT_URL`: regenerate it in the cron monitor if it leaks; anyone
  with it can only send pings.
- `DATABASE_URL`: reset the role's password in Neon, then check the
  variable in Vercel holds the new one (set it by hand if the Neon
  integration didn't). Redeploy.

## Revoking a member

Remove them from the Discord server first, so they are refused the next time
they sign in. Then, in `/admin`, use **Sign out everywhere** on their row to
end their current sessions straight away. Without the first step they can
sign straight back in; without the second they stay signed in for up to 30
days. To remove their data as well, delete their `user` row in SQL (every app
table cascades from it); refused sign-ins age out with the logs.

## A failed migration on deploy

`vercel-build` migrates before it builds, so a failing migration fails the
build and the deployment that was live stays live. Read the build log in
Vercel. Migrations run in a transaction, so a failed one leaves nothing
applied. Fix the migration in a new commit; never edit one that has already
run in production. If a migration did apply but the new code is wrong, roll
back the deployment in Vercel (Deployments, Instant Rollback): the old code
must still work with the new schema, which is why migrations only add things
until the code that stops using the old thing is live.

## Restoring from backup

Neon keeps the database's history for its plan's restore window. In the Neon
console, restore the production branch to a time before the problem (or
create a branch from that time, check it, and then restore). Restoring
brings back rows that were deleted since, including expired logs and deleted
accounts, so delete any accounts removed after the restore point again, and
let the next purge clear old logs. A restore has not been rehearsed yet (PR 10
of the October plan); note how long it took here when it has.
