import 'server-only';

// Operational problems are logged as one line, `[ops] <event> {json}`, so they
// can be found in Vercel's logs by event name (docs/runbook.md lists them).
// Everything in the line is redacted first: no credentials in URLs, no query
// strings, no bearer tokens or cookies, and no query parameters from failed
// database queries (they hold user ids and addresses).
export type OpsEvent =
  | 'activity-write-failed'
  | 'discord-check-failed'
  | 'discord-guild-unset'
  | 'db-pool-error'
  | 'cron-secret-unset'
  | 'log-purge-failed'
  | 'heartbeat-failed';

const MAX_ERROR_LENGTH = 500;

export function redact(text: string): string {
  return text
    .replace(/\bparams:[\s\S]*/i, 'params: [redacted]')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"]*/gi, url =>
      url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/@\s]*@/i, '$1[redacted]@').replace(/[?#].*$/, ''),
    )
    .replace(/\bbearer\s+[^\s'"]+/gi, 'Bearer [redacted]')
    .replace(/\b(set-cookie|cookie|authorization)(["']?\s*[:=]\s*)[^\n]*/gi, '$1$2[redacted]');
}

// The message and code of an error and of its cause (Drizzle wraps the
// Postgres error), without the stack.
export function describeError(err: unknown): string {
  const parts: string[] = [];
  for (let e: unknown = err, depth = 0; e !== undefined && e !== null && depth < 3; depth++) {
    if (e instanceof Error) {
      const code = (e as { code?: unknown }).code;
      parts.push(redact(`${e.name}${typeof code === 'string' ? ` ${code}` : ''}: ${e.message}`));
      e = e.cause;
    } else {
      parts.push(redact(String(e)));
      break;
    }
  }
  return parts.join(' <- ').slice(0, MAX_ERROR_LENGTH);
}

export function reportProblem(event: OpsEvent, fields: Record<string, string | number> = {}, err?: unknown): void {
  const detail: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(fields)) detail[key] = typeof value === 'string' ? redact(value) : value;
  if (err !== undefined) detail.error = describeError(err);
  console.error(`[ops] ${event} ${JSON.stringify(detail)}`);
}
