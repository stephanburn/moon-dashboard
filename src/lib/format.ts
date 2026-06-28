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
