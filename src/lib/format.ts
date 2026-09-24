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

export function formatTime(instant: Date, timezone: string): string {
  return instant.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

/** "Thu 24 Sept, 14:05" — used for moon-sign ingress times. */
export function formatDayAndTime(instant: Date, timezone: string): string {
  const datePart = formatDay(dayOf(instant, timezone), { weekday: 'short', day: 'numeric', month: 'short' });
  return `${datePart}, ${formatTime(instant, timezone)}`;
}

/**
 * "Full Moon peaks today at 17:49" / "peaked yesterday at …" / "peaks: 26 Sept
 * 2026 at …", with day boundaries evaluated in `timezone`.
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
  if (diff === -1) return `${phaseName} peaked yesterday at ${timeStr}`;

  const verb = isPast ? 'peaked' : 'peaks';
  return `${phaseName} ${verb}: ${formatDay(dayOf(peakTime, timezone))} at ${timeStr}`;
}
