import { DEFAULT_TZ } from './config';

// Persisted in localStorage by Dashboard (via lib/storage).
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

// Southern zones with no daylight saving, for detected zones outside the
// selector list (DST zones are placed by the direction of their DST instead).
// A zone counts as southern when its city lies more than 2° south of the
// equator; nearer than that (Nairobi, Kigali, Belém, Nauru) fits neither
// wheel and stays with the northern default. Australia/* and Antarctica/*
// are matched by prefix.
export const SOUTHERN_NO_DST_TIMEZONES: ReadonlySet<string> = new Set([
  'Africa/Blantyre',
  'Africa/Brazzaville',
  'Africa/Bujumbura',
  'Africa/Dar_es_Salaam',
  'Africa/Gaborone',
  'Africa/Harare',
  'Africa/Kinshasa',
  'Africa/Lubumbashi',
  'Africa/Luanda',
  'Africa/Lusaka',
  'Africa/Maputo',
  'Africa/Maseru',
  'Africa/Mbabane',
  'Africa/Windhoek',
  'America/Araguaina',
  'America/Argentina/Catamarca',
  'America/Argentina/Cordoba',
  'America/Argentina/Jujuy',
  'America/Argentina/La_Rioja',
  'America/Argentina/Mendoza',
  'America/Argentina/Rio_Gallegos',
  'America/Argentina/Salta',
  'America/Argentina/San_Juan',
  'America/Argentina/San_Luis',
  'America/Argentina/Tucuman',
  'America/Argentina/Ushuaia',
  'America/Asuncion',
  'America/Bahia',
  'America/Campo_Grande',
  'America/Cuiaba',
  'America/Eirunepe',
  'America/Fortaleza',
  'America/Guayaquil',
  'America/La_Paz',
  'America/Maceio',
  'America/Manaus',
  'America/Montevideo',
  'America/Noronha',
  'America/Porto_Velho',
  'America/Punta_Arenas',
  'America/Recife',
  'America/Rio_Branco',
  'America/Santarem',
  'Asia/Dili',
  'Asia/Jakarta',
  'Asia/Jayapura',
  'Asia/Makassar',
  'Atlantic/South_Georgia',
  'Atlantic/St_Helena',
  'Atlantic/Stanley',
  'Indian/Antananarivo',
  'Indian/Chagos',
  'Indian/Christmas',
  'Indian/Cocos',
  'Indian/Comoro',
  'Indian/Kerguelen',
  'Indian/Mahe',
  'Indian/Mauritius',
  'Indian/Mayotte',
  'Indian/Reunion',
  'Pacific/Apia',
  'Pacific/Bougainville',
  'Pacific/Efate',
  'Pacific/Fakaofo',
  'Pacific/Funafuti',
  'Pacific/Gambier',
  'Pacific/Guadalcanal',
  'Pacific/Kanton',
  'Pacific/Marquesas',
  'Pacific/Niue',
  'Pacific/Noumea',
  'Pacific/Pago_Pago',
  'Pacific/Port_Moresby',
  'Pacific/Rarotonga',
  'Pacific/Tahiti',
  'Pacific/Tongatapu',
  'Pacific/Wallis',
]);

const SOUTHERN_PREFIXES = ['Australia/', 'Antarctica/'];

/**
 * The engine's canonical spelling of `tz`, or null if Intl rejects it. Engines
 * disagree on spelling: Chrome reports Asia/Kolkata as Asia/Calcutta and
 * Europe/Kyiv as Europe/Kiev, Firefox the reverse. So compare canonical forms,
 * never raw strings.
 */
export function canonicalZone(tz: string): string | null {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

let listedByCanonical: Map<string, string> | null = null;

// Old names of listed zones. Chrome and Firefox canonicalise these through
// Intl, but WebKit returns a zone name exactly as given, so canonicalZone
// alone can't match them there.
const LISTED_ZONE_ALIASES: Readonly<Record<string, string>> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Argentina/Buenos_Aires': 'America/Buenos_Aires',
};

/** The selector's spelling of `tz` if it names a listed zone, else undefined. */
export function listedZoneFor(tz: string): string | undefined {
  if (SUPPORTED_TIMEZONES.has(tz)) return tz;
  if (Object.hasOwn(LISTED_ZONE_ALIASES, tz)) return LISTED_ZONE_ALIASES[tz];
  if (!listedByCanonical) {
    listedByCanonical = new Map();
    for (const zone of SUPPORTED_TIMEZONES) {
      const canonical = canonicalZone(zone);
      // First listed wins, in case an engine folds two listed zones together.
      if (canonical && !listedByCanonical.has(canonical)) listedByCanonical.set(canonical, zone);
    }
  }
  const canonical = canonicalZone(tz);
  return canonical ? listedByCanonical.get(canonical) : undefined;
}

/**
 * The IANA zone the browser reports, or null. A bare UTC is treated as no
 * signal: it almost always comes from a privacy setting, not a location.
 */
export function detectBrowserTimezone(reported?: string): string | null {
  try {
    const tz = reported ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || canonicalZone(tz) === canonicalZone('UTC')) return null;
    return tz;
  } catch {
    return null;
  }
}

/**
 * The zone to show: the viewer's saved choice, else the browser's zone, else
 * DEFAULT_TZ, in the selector's spelling when listed. The detected zone is
 * deliberately never saved, so it follows the device and picks up tz database
 * updates on every visit.
 */
export function resolveTimezone(saved: string | null, detected: string | null): string {
  if (saved && canonicalZone(saved)) return listedZoneFor(saved) ?? saved;
  if (detected && canonicalZone(detected)) return listedZoneFor(detected) ?? detected;
  return DEFAULT_TZ;
}

/** UTC offset of `tz` at `instant`, in minutes (east positive). */
function utcOffsetMinutes(tz: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((wall - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/**
 * Listed zones (in any spelling) use the explicit table, and Antarctica is
 * always southern (Troll keeps Norwegian summer time). Any other zone that
 * observes daylight saving is placed by when its clocks go forward: a larger
 * offset in January than in July means southern summer time. Zones without
 * DST fall back to a list of southern zones; everything else (including the
 * equatorial zones, which fit neither wheel) is northern.
 */
export function hemisphereFromTimezone(tz: string, at: Date = new Date()): Hemisphere {
  const listed = listedZoneFor(tz);
  if (listed) return SOUTHERN_TIMEZONES.has(listed) ? 'south' : 'north';
  const canonical = canonicalZone(tz) ?? tz;
  const names = [tz, canonical];
  if (names.some(z => z.startsWith('Antarctica/'))) return 'south';

  const year = at.getUTCFullYear();
  const jan = utcOffsetMinutes(tz, new Date(Date.UTC(year, 0, 15)));
  const jul = utcOffsetMinutes(tz, new Date(Date.UTC(year, 6, 15)));
  if (jan !== jul) return jan > jul ? 'south' : 'north';

  const isSouthern = names.some(
    z => SOUTHERN_NO_DST_TIMEZONES.has(z) || SOUTHERN_PREFIXES.some(prefix => z.startsWith(prefix)),
  );
  return isSouthern ? 'south' : 'north';
}

/**
 * Coerce a possibly-untrusted timezone (e.g. a stale or hand-edited localStorage
 * value) to a known-good one. Anything Intl rejects falls back to DEFAULT_TZ,
 * so it can never reach Intl.DateTimeFormat and throw a RangeError that would
 * blank the page. A listed zone comes back in the selector's spelling.
 */
export function normalizeTimezone(tz: string | null | undefined): string {
  return tz && canonicalZone(tz) ? (listedZoneFor(tz) ?? tz) : DEFAULT_TZ;
}
