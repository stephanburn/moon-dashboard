import { makeDay, type CalendarDay } from './days';
import type { SabbatName } from './names';
import type { Hemisphere } from './timezones';

export interface Sabbat {
  name: SabbatName;    // key into SABBAT_CORRESPONDENCES
  displayName: string; // shown in the UI (e.g. "Spring Equinox (Ostara)")
  day: CalendarDay;
}

const DISPLAY_NAMES: Record<SabbatName, string> = {
  Imbolc: 'Imbolc',
  Ostara: 'Spring Equinox (Ostara)',
  Beltane: 'Beltane',
  Litha: 'Summer Solstice (Litha)',
  Lughnasadh: 'Lughnasadh',
  Mabon: 'Autumn Equinox (Mabon)',
  Samhain: 'Samhain',
  Yule: 'Winter Solstice (Yule)',
};

// Approximate solstice/equinox dates through 2030 (see SABBAT_DATA_EXPIRY in
// config.ts). Beyond that, the nearest known year is used; drift is ~1
// day/decade. These are close enough for a personal dashboard.
type Season = 'march' | 'june' | 'september' | 'december';

const SEASON_DATES: Record<Season, Record<number, [month: number, day: number]>> = {
  march: {
    2025: [3, 20], 2026: [3, 20], 2027: [3, 20], 2028: [3, 20], 2029: [3, 20], 2030: [3, 20],
  },
  june: {
    2025: [6, 21], 2026: [6, 21], 2027: [6, 21], 2028: [6, 20], 2029: [6, 21], 2030: [6, 21],
  },
  september: {
    2025: [9, 22], 2026: [9, 23], 2027: [9, 23], 2028: [9, 22], 2029: [9, 22], 2030: [9, 23],
  },
  december: {
    2025: [12, 21], 2026: [12, 21], 2027: [12, 22], 2028: [12, 21], 2029: [12, 21], 2030: [12, 22],
  },
};

function seasonDay(season: Season, year: number): CalendarDay {
  const table = SEASON_DATES[season];
  const years = Object.keys(table).map(Number);
  const nearest = years.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a));
  const [month, day] = table[nearest];
  return makeDay(year, month, day);
}

// Each sabbat sits either on a fixed date or on a solstice/equinox. The
// southern wheel keeps the same astronomical events but flips their seasonal
// meaning, and shifts the fire festivals by six months.
type Slot = { fixed: [month: number, day: number] } | { season: Season };

const WHEEL: Record<Hemisphere, [SabbatName, Slot][]> = {
  north: [
    ['Imbolc',     { fixed: [2, 1] }],
    ['Ostara',     { season: 'march' }],
    ['Beltane',    { fixed: [5, 1] }],
    ['Litha',      { season: 'june' }],
    ['Lughnasadh', { fixed: [8, 1] }],
    ['Mabon',      { season: 'september' }],
    ['Samhain',    { fixed: [10, 31] }],
    ['Yule',       { season: 'december' }],
  ],
  south: [
    ['Lughnasadh', { fixed: [2, 1] }],
    ['Mabon',      { season: 'march' }],
    ['Samhain',    { fixed: [5, 1] }],
    ['Yule',       { season: 'june' }],
    ['Imbolc',     { fixed: [8, 1] }],
    ['Ostara',     { season: 'september' }],
    ['Beltane',    { fixed: [11, 1] }],
    ['Litha',      { season: 'december' }],
  ],
};

export function getSabbatsForYear(year: number, hemisphere: Hemisphere): Sabbat[] {
  return WHEEL[hemisphere].map(([name, slot]) => ({
    name,
    displayName: DISPLAY_NAMES[name],
    day: 'fixed' in slot ? makeDay(year, slot.fixed[0], slot.fixed[1]) : seasonDay(slot.season, year),
  }));
}

function sabbatsAround(year: number, hemisphere: Hemisphere): Sabbat[] {
  return [year - 1, year, year + 1].flatMap(y => getSabbatsForYear(y, hemisphere));
}

export interface SabbatContext {
  today: Sabbat | null;      // non-null if today IS a sabbat
  nextSabbat: Sabbat | null; // the next sabbat strictly after today
}

export function getSabbatContext(today: CalendarDay, hemisphere: Hemisphere): SabbatContext {
  const all = sabbatsAround(Number(today.slice(0, 4)), hemisphere);
  return {
    today: all.find(s => s.day === today) ?? null,
    nextSabbat: all.filter(s => s.day > today).sort((a, b) => a.day.localeCompare(b.day))[0] ?? null,
  };
}

/** Sabbats strictly after `after`, up to and including `through`, in order. */
export function getUpcomingSabbats(
  after: CalendarDay,
  through: CalendarDay,
  hemisphere: Hemisphere,
): Sabbat[] {
  return sabbatsAround(Number(after.slice(0, 4)), hemisphere)
    .filter(s => s.day > after && s.day <= through)
    .sort((a, b) => a.day.localeCompare(b.day));
}
