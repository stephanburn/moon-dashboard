import { Seasons } from 'astronomy-engine';
import { dayOf, makeDay, type CalendarDay } from './days';
import type { SabbatName } from './names';
import type { Hemisphere } from './timezones';

export interface Sabbat {
  name: SabbatName;    // key into SABBAT_CORRESPONDENCES
  displayName: string; // shown in the UI (e.g. "Spring Equinox (Ostara)")
  day: CalendarDay;
  at?: Date;           // the exact solstice/equinox, for astronomical sabbats
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

type Season = 'march' | 'june' | 'september' | 'december';

// The exact solstice/equinox instant. Its calendar day depends on the viewer's
// timezone: the Sep 2026 equinox (00:05 UTC on the 23rd) falls on the 22nd
// everywhere in the Americas.
const seasonsByYear = new Map<number, Record<Season, Date>>();

function seasonInstant(season: Season, year: number): Date {
  let times = seasonsByYear.get(year);
  if (!times) {
    const s = Seasons(year);
    times = {
      march: s.mar_equinox.date,
      june: s.jun_solstice.date,
      september: s.sep_equinox.date,
      december: s.dec_solstice.date,
    };
    seasonsByYear.set(year, times);
  }
  return times[season];
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

export function getSabbatsForYear(year: number, hemisphere: Hemisphere, timezone: string): Sabbat[] {
  return WHEEL[hemisphere].map(([name, slot]): Sabbat => {
    const base = { name, displayName: DISPLAY_NAMES[name] };
    if ('fixed' in slot) return { ...base, day: makeDay(year, slot.fixed[0], slot.fixed[1]) };
    const at = seasonInstant(slot.season, year);
    return { ...base, day: dayOf(at, timezone), at };
  });
}

function sabbatsAround(year: number, hemisphere: Hemisphere, timezone: string): Sabbat[] {
  return [year - 1, year, year + 1].flatMap(y => getSabbatsForYear(y, hemisphere, timezone));
}

export interface SabbatContext {
  today: Sabbat | null;      // non-null if today IS a sabbat
  nextSabbat: Sabbat | null; // the next sabbat strictly after today
}

export function getSabbatContext(today: CalendarDay, hemisphere: Hemisphere, timezone: string): SabbatContext {
  const all = sabbatsAround(Number(today.slice(0, 4)), hemisphere, timezone);
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
  timezone: string,
): Sabbat[] {
  return sabbatsAround(Number(after.slice(0, 4)), hemisphere, timezone)
    .filter(s => s.day > after && s.day <= through)
    .sort((a, b) => a.day.localeCompare(b.day));
}
