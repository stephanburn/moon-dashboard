import { DEFAULT_TZ } from './config';

// Persisted in localStorage by the timezone selector.
export const STORAGE_KEY = 'moon-dashboard-timezone';

// The IANA zones offered in the selector. This is the single source of truth:
// both the selector UI and the stored-value validation derive from it.
export const TIMEZONE_GROUPS: { label: string; zones: string[] }[] = [
  {
    label: 'Europe',
    zones: [
      'Europe/London',
      'Europe/Dublin',
      'Europe/Lisbon',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Vienna',
      'Europe/Warsaw',
      'Europe/Stockholm',
      'Europe/Oslo',
      'Europe/Copenhagen',
      'Europe/Helsinki',
      'Europe/Athens',
      'Europe/Bucharest',
      'Europe/Kyiv',
      'Europe/Moscow',
    ],
  },
  {
    label: 'Americas',
    zones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Halifax',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Bogota',
      'America/Lima',
      'America/Santiago',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'Pacific/Honolulu',
    ],
  },
  {
    label: 'Asia / Pacific',
    zones: [
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Dhaka',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
      'Pacific/Fiji',
    ],
  },
  {
    label: 'Africa',
    zones: [
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Africa/Lagos',
      'Africa/Nairobi',
    ],
  },
];

export const SUPPORTED_TIMEZONES: ReadonlySet<string> = new Set(
  TIMEZONE_GROUPS.flatMap(group => group.zones),
);

export type Hemisphere = 'north' | 'south';

// Southern-hemisphere zones, used to flip the Wheel of the Year by six months.
// IMPORTANT: every entry must also appear in TIMEZONE_GROUPS above (guarded by a
// test). When adding a southern zone to the selector, add it here too, or its
// sabbats will silently render with northern seasons.
export const SOUTHERN_TIMEZONES: ReadonlySet<string> = new Set([
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Africa/Johannesburg',
]);

export function hemisphereFromTimezone(tz: string): Hemisphere {
  return SOUTHERN_TIMEZONES.has(tz) ? 'south' : 'north';
}

/**
 * Coerce a possibly-untrusted timezone (e.g. a stale or hand-edited localStorage
 * value) to a known-good one. Anything not in the selector list falls back to
 * DEFAULT_TZ, so it can never reach Intl.DateTimeFormat and throw a RangeError
 * that would blank the page.
 */
export function normalizeTimezone(tz: string | null | undefined): string {
  return tz && SUPPORTED_TIMEZONES.has(tz) ? tz : DEFAULT_TZ;
}
