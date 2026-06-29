/**
 * Format a *calendar date* — a "this day" value such as a sabbat, ingress, or
 * transit boundary — for display.
 *
 * These dates are constructed as device-local midnights and are timezone-
 * independent by nature, so they are deliberately formatted WITHOUT a `timeZone`
 * option. Applying the viewer's selected zone would re-interpret the midnight
 * instant and shift the date across a day boundary for western viewers (review
 * finding H1: a London device showing a date selected as Honolulu rolled back a
 * day).
 *
 * For true instants (moon-phase peaks, moon-sign ingress times) keep using a
 * timezone-aware formatter, so the time reflects the viewer's chosen zone.
 */
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// The local-day index (UTC ms at the start of the day in `timezone`) for a Date,
// mirroring toLocalDate in Dashboard. Using Date.UTC keeps the diff free of DST
// hour shifts so day counts stay exact.
function localDayIndex(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => {
    const value = parts.find(p => p.type === type)?.value;
    if (value === undefined) throw new Error(`Missing "${type}" part for timezone ${timezone}`);
    return parseInt(value, 10);
  };
  return Date.UTC(get('year'), get('month') - 1, get('day'));
}

/**
 * Relative distance from `now` to `target` in whole local days, phrased for the
 * cycle spine: `Today` / `Tomorrow` / `in N days`, switching to `in N weeks`
 * once past a fortnight. Pure — day boundaries are evaluated in `timezone`.
 */
export function formatRelativeDays(target: Date, now: Date, timezone: string): string {
  const diffDays = Math.round(
    (localDayIndex(target, timezone) - localDayIndex(now, timezone)) / 86_400_000,
  );
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 14) return `in ${diffDays} days`;
  const weeks = Math.round(diffDays / 7);
  return `in ${weeks} weeks`;
}
