import { dayOf, dayToUTCMs, diffDays, type CalendarDay } from './days';

/**
 * Format a calendar day. Formatting happens in UTC against the day's UTC
 * midnight, so the output never depends on the device's timezone.
 */
export function formatDay(
  day: CalendarDay,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  return new Date(dayToUTCMs(day)).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

/**
 * Relative distance from `today` to `target` in whole days, phrased for the
 * cycle spine: `Today` / `Tomorrow` / `in N days`, switching to `in N weeks`
 * once past a fortnight.
 */
export function formatRelativeDays(target: CalendarDay, today: CalendarDay): string {
  const diff = diffDays(target, today);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 14) return `in ${diff} days`;
  return `in ${Math.round(diff / 7)} weeks`;
}

// ── Instants, shown in the viewer's selected timezone ─────────────────────

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function wallClock(ms: number, timezone: string): string {
  let fmt = wallClockFormatters.get(timezone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    wallClockFormatters.set(timezone, fmt);
  }
  return fmt.format(ms);
}

// When clocks go back, an hour of wall-clock time happens twice (the shift is
// 30 minutes on Lord Howe Island), so a time in it is ambiguous on its own.
const DST_SHIFTS_MS = [60, 30].map(m => m * 60_000);

function isRepeatedWallTime(instant: Date, timezone: string): boolean {
  const t = instant.getTime();
  const wall = wallClock(t, timezone);
  return DST_SHIFTS_MS.some(d => wallClock(t - d, timezone) === wall || wallClock(t + d, timezone) === wall);
}

function bareTime(instant: Date, timezone: string): string {
  return instant.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

function withZone(time: string, instant: Date, timezone: string): string {
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(instant)
    .find(p => p.type === 'timeZoneName')?.value;
  // Recent Chrome names London's winter time "GMT+0" where Node says "GMT".
  return zone ? `${time} ${zone === 'GMT+0' ? 'GMT' : zone}` : time;
}

/**
 * "14:05". In the repeated hour after clocks go back, the zone is appended
 * ("01:30 BST" vs "01:30 GMT") so the two occurrences can be told apart.
 */
export function formatTime(instant: Date, timezone: string): string {
  const time = bareTime(instant, timezone);
  return isRepeatedWallTime(instant, timezone) ? withZone(time, instant, timezone) : time;
}

/** "14:05 BST": always with the zone, which also tells the repeated hour apart. */
export function formatTimeWithZone(instant: Date, timezone: string): string {
  return withZone(bareTime(instant, timezone), instant, timezone);
}

/** "Saturday 31 October 2026", for an all-day observance. */
export function formatLongDay(day: CalendarDay): string {
  const weekday = formatDay(day, { weekday: 'long' });
  return `${weekday} ${formatDay(day, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

/** "Saturday 26 September 2026 at 17:49 BST": an instant, dated in `timezone`. */
export function formatLongDayAndTime(instant: Date, timezone: string): string {
  return `${formatLongDay(dayOf(instant, timezone))} at ${formatTimeWithZone(instant, timezone)}`;
}

/**
 * "Tuesday 22 September 2026, equinox at 20:05 GMT-4": an all-day observance
 * kept on the calendar day of an astronomical moment.
 */
export function formatDayWithMoment(day: CalendarDay, moment: string, instant: Date, timezone: string): string {
  return `${formatLongDay(day)}, ${moment} at ${formatTimeWithZone(instant, timezone)}`;
}

/** "Thu 24 Sept, 14:05" — used for moon-sign ingress times. */
export function formatDayAndTime(instant: Date, timezone: string): string {
  const datePart = formatDay(dayOf(instant, timezone), { weekday: 'short', day: 'numeric', month: 'short' });
  return `${datePart}, ${formatTime(instant, timezone)}`;
}

/**
 * "Full Moon peaks today at 17:49" / "peaks tomorrow at …" / "peaked yesterday
 * at …" / "peaks: 26 Sept 2026 at …", with day boundaries evaluated in
 * `timezone`.
 */
export function formatPeakText(phaseName: string, peakTime: Date, now: Date, timezone: string): string {
  const diff = diffDays(dayOf(peakTime, timezone), dayOf(now, timezone));
  const isPast = peakTime < now;
  const timeStr = formatTime(peakTime, timezone);

  if (diff === 0) {
    return isPast
      ? `${phaseName} peaked today at ${timeStr}`
      : `${phaseName} peaks today at ${timeStr}`;
  }
  if (diff === 1) return `${phaseName} peaks tomorrow at ${timeStr}`;
  if (diff === -1) return `${phaseName} peaked yesterday at ${timeStr}`;

  const verb = isPast ? 'peaked' : 'peaks';
  return `${phaseName} ${verb}: ${formatDay(dayOf(peakTime, timezone))} at ${timeStr}`;
}
