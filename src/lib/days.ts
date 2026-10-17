/**
 * Calendar days, kept separate from instants.
 *
 * Two kinds of time flow through the app:
 * - **Instants** (a moon phase peak, a sign ingress) are plain `Date`s.
 * - **Calendar days** ("Samhain is on 31 Oct") are `CalendarDay` strings in
 *   `YYYY-MM-DD` form. They carry no timezone and never depend on the device.
 *
 * An instant becomes a day only through `dayOf(instant, timezone)`, always in
 * the viewer's *selected* zone. Never build a "day" as a device-local midnight
 * `Date`: that is what made labels shift by a day when the device zone differed
 * from the selected one (review finding P0-3).
 */

export type CalendarDay = string & { readonly __calendarDay: true };

const DAY_MS = 86_400_000;

function fromUTCMs(ms: number): CalendarDay {
  return new Date(ms).toISOString().slice(0, 10) as CalendarDay;
}

/** Build a day from parts (month is 1-based). Out-of-range parts roll over. */
export function makeDay(year: number, month: number, day: number): CalendarDay {
  return fromUTCMs(Date.UTC(year, month - 1, day));
}

export function dayParts(day: CalendarDay): { year: number; month: number; day: number } {
  const [year, month, d] = day.split('-').map(Number);
  return { year, month, day: d };
}

/** UTC midnight of the day, in ms. Useful for formatting with timeZone 'UTC'. */
export function dayToUTCMs(day: CalendarDay): number {
  const { year, month, day: d } = dayParts(day);
  return Date.UTC(year, month - 1, d);
}

// Intl formatters are costly to construct and dayOf is called often.
const partsFormatters = new Map<string, Intl.DateTimeFormat>();

/** The calendar day an instant falls on in `timezone`. */
export function dayOf(instant: Date, timezone: string): CalendarDay {
  let fmt = partsFormatters.get(timezone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    partsFormatters.set(timezone, fmt);
  }
  const parts = fmt.formatToParts(instant);
  const get = (type: string) => {
    const value = parts.find(p => p.type === type)?.value;
    // timezone is validated upstream (normalizeTimezone), so every part is
    // present; throw rather than silently building a bogus day if that breaks.
    if (value === undefined) throw new Error(`Missing "${type}" part for timezone ${timezone}`);
    return parseInt(value, 10);
  };
  return makeDay(get('year'), get('month'), get('day'));
}

export function addDays(day: CalendarDay, n: number): CalendarDay {
  return fromUTCMs(dayToUTCMs(day) + n * DAY_MS);
}

/** Whole days from `b` to `a` (positive when `a` is later). */
export function diffDays(a: CalendarDay, b: CalendarDay): number {
  return Math.round((dayToUTCMs(a) - dayToUTCMs(b)) / DAY_MS);
}

// No zone is more than 14 hours from UTC, so a day starts within this much of
// its UTC midnight.
const MAX_OFFSET_MS = 15 * 60 * 60 * 1000;

/**
 * The first instant of `day` in `timezone`, to the millisecond. Usually local
 * midnight, but found by search rather than offset arithmetic, so days that
 * start at 01:00 (DST at midnight) or are 23 or 25 hours long come out right.
 */
export function startOfDay(day: CalendarDay, timezone: string): Date {
  let lo = dayToUTCMs(day) - MAX_OFFSET_MS; // before the day starts
  let hi = dayToUTCMs(day) + MAX_OFFSET_MS; // after it has started
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (dayOf(new Date(mid), timezone) >= day) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}
