export interface Sabbat {
  name: string;        // key into SABBAT_CORRESPONDENCES
  displayName: string; // shown in the UI (e.g. "Spring Equinox (Ostara)")
  altName?: string;
  description: string;
  date: Date;
}

// Approximate solstice/equinox dates for 2025-2030.
// These are close enough for a personal dashboard.
type YearApprox = Record<number, { month: number; day: number }>;

const SPRING_EQUINOX: YearApprox = {
  2025: { month: 3, day: 20 },
  2026: { month: 3, day: 20 },
  2027: { month: 3, day: 20 },
  2028: { month: 3, day: 20 },
  2029: { month: 3, day: 20 },
  2030: { month: 3, day: 20 },
};

const SUMMER_SOLSTICE: YearApprox = {
  2025: { month: 6, day: 21 },
  2026: { month: 6, day: 21 },
  2027: { month: 6, day: 21 },
  2028: { month: 6, day: 20 },
  2029: { month: 6, day: 21 },
  2030: { month: 6, day: 21 },
};

const AUTUMN_EQUINOX: YearApprox = {
  2025: { month: 9, day: 22 },
  2026: { month: 9, day: 23 },
  2027: { month: 9, day: 23 },
  2028: { month: 9, day: 22 },
  2029: { month: 9, day: 22 },
  2030: { month: 9, day: 23 },
};

const WINTER_SOLSTICE: YearApprox = {
  2025: { month: 12, day: 21 },
  2026: { month: 12, day: 21 },
  2027: { month: 12, day: 22 },
  2028: { month: 12, day: 21 },
  2029: { month: 12, day: 21 },
  2030: { month: 12, day: 22 },
};

function approxDate(table: YearApprox, year: number): { month: number; day: number } {
  // Use nearest known year if outside range
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const nearest = keys.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );
  return table[nearest];
}

// Northern hemisphere sabbat calendar
export function getSabbatsForYear(year: number): Sabbat[] {
  const eq  = approxDate(SPRING_EQUINOX,  year);
  const sol = approxDate(SUMMER_SOLSTICE, year);
  const aeq = approxDate(AUTUMN_EQUINOX,  year);
  const ws  = approxDate(WINTER_SOLSTICE, year);

  return [
    {
      name: 'Imbolc',
      displayName: 'Imbolc',
      description: 'The first stirrings of spring',
      date: new Date(year, 1, 1), // 1 Feb
    },
    {
      name: 'Ostara',
      displayName: 'Spring Equinox (Ostara)',
      altName: 'Spring Equinox',
      description: 'The balance of light and dark at spring',
      date: new Date(year, eq.month - 1, eq.day),
    },
    {
      name: 'Beltane',
      displayName: 'Beltane',
      description: 'The height of spring, fire and fertility',
      date: new Date(year, 4, 1), // 1 May
    },
    {
      name: 'Litha',
      displayName: 'Summer Solstice (Litha)',
      altName: 'Summer Solstice',
      description: 'The longest day, the peak of the sun',
      date: new Date(year, sol.month - 1, sol.day),
    },
    {
      name: 'Lughnasadh',
      displayName: 'Lughnasadh',
      altName: 'Lammas',
      description: 'The first harvest',
      date: new Date(year, 7, 1), // 1 Aug
    },
    {
      name: 'Mabon',
      displayName: 'Autumn Equinox (Mabon)',
      altName: 'Autumn Equinox',
      description: 'The second harvest and autumn balance',
      date: new Date(year, aeq.month - 1, aeq.day),
    },
    {
      name: 'Samhain',
      displayName: 'Samhain',
      description: 'The veil is thin; the new year begins',
      date: new Date(year, 9, 31), // 31 Oct
    },
    {
      name: 'Yule',
      displayName: 'Winter Solstice (Yule)',
      altName: 'Winter Solstice',
      description: 'The longest night; the return of the light',
      date: new Date(year, ws.month - 1, ws.day),
    },
  ];
}

// Southern hemisphere sabbat calendar.
// The same astronomical events (equinoxes/solstices) fall on the same dates
// globally, but carry opposite seasonal meaning. The fire festivals shift by
// six months to align with southern seasons.
export function getSabbatsForYearSouthern(year: number): Sabbat[] {
  const eq  = approxDate(SPRING_EQUINOX,  year);  // ~Mar 20: Autumn in South → Mabon
  const sol = approxDate(SUMMER_SOLSTICE, year);   // ~Jun 21: Winter in South → Yule
  const aeq = approxDate(AUTUMN_EQUINOX,  year);   // ~Sep 22: Spring in South → Ostara
  const ws  = approxDate(WINTER_SOLSTICE, year);   // ~Dec 21: Summer in South → Litha

  return [
    {
      name: 'Lughnasadh',
      displayName: 'Lughnasadh',
      altName: 'Lammas',
      description: 'The first harvest of late summer',
      date: new Date(year, 1, 1), // 1 Feb
    },
    {
      name: 'Mabon',
      displayName: 'Autumn Equinox (Mabon)',
      altName: 'Autumn Equinox',
      description: 'The autumn balance of light and dark',
      date: new Date(year, eq.month - 1, eq.day), // ~Mar 20
    },
    {
      name: 'Samhain',
      displayName: 'Samhain',
      description: 'The veil is thin; the new year begins',
      date: new Date(year, 4, 1), // 1 May
    },
    {
      name: 'Yule',
      displayName: 'Winter Solstice (Yule)',
      altName: 'Winter Solstice',
      description: 'The longest night; the return of the light',
      date: new Date(year, sol.month - 1, sol.day), // ~Jun 21
    },
    {
      name: 'Imbolc',
      displayName: 'Imbolc',
      description: 'The first stirrings of spring',
      date: new Date(year, 7, 1), // 1 Aug
    },
    {
      name: 'Ostara',
      displayName: 'Spring Equinox (Ostara)',
      altName: 'Spring Equinox',
      description: 'The balance of light and dark at spring',
      date: new Date(year, aeq.month - 1, aeq.day), // ~Sep 22-23
    },
    {
      name: 'Beltane',
      displayName: 'Beltane',
      description: 'The height of spring, fire and fertility',
      date: new Date(year, 10, 1), // 1 Nov
    },
    {
      name: 'Litha',
      displayName: 'Summer Solstice (Litha)',
      altName: 'Summer Solstice',
      description: 'The longest day, the peak of the sun',
      date: new Date(year, ws.month - 1, ws.day), // ~Dec 21
    },
  ];
}

export interface SabbatContext {
  today: Sabbat | null;       // non-null if today IS a sabbat
  nearest: string;            // e.g. "Between Imbolc and Spring Equinox (Ostara)"
  next3: Sabbat[];
  nextSabbat: Sabbat | null;  // the next upcoming sabbat (after today)
  daysUntilNext: number;      // calendar days until nextSabbat
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getSabbatContext(
  date: Date = new Date(),
  hemisphere: 'north' | 'south' = 'north',
): SabbatContext {
  const year = date.getFullYear();
  const getYear = hemisphere === 'south' ? getSabbatsForYearSouthern : getSabbatsForYear;

  // Include previous and next year to handle year boundaries cleanly
  const all = [
    ...getYear(year - 1),
    ...getYear(year),
    ...getYear(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = all.find(s => isSameDay(s.date, date)) ?? null;

  // Next 3 upcoming sabbats (from tomorrow onwards, or today if today IS a sabbat)
  const upcoming = all.filter(s => s.date > date || isSameDay(s.date, date));
  const next3 = upcoming.slice(0, 3);

  // Next sabbat strictly after today (for countdown)
  const nextSabbat = all.find(s => s.date > date) ?? null;
  const daysUntilNext = nextSabbat
    ? Math.round((nextSabbat.date.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  // Build a "between" label (kept for any legacy use)
  let nearest = '';
  if (today) {
    nearest = today.displayName;
  } else {
    const prev = all.findLast(s => s.date < date);
    const next = all.find(s => s.date > date);
    if (prev && next) {
      nearest = `Between ${prev.displayName} and ${next.displayName}`;
    } else if (next) {
      nearest = `Before ${next.displayName}`;
    }
  }

  return { today, nearest, next3, nextSabbat, daysUntilNext };
}

/**
 * Get upcoming sabbats from `from` for the next `upToMonths` months.
 * Used for the unified Coming Up list.
 */
export function getUpcomingSabbats(
  from: Date,
  upToMonths = 6,
  hemisphere: 'north' | 'south' = 'north',
): Sabbat[] {
  const year = from.getFullYear();
  const cutoff = new Date(from.getTime() + upToMonths * 30 * 24 * 60 * 60 * 1000);
  const getYear = hemisphere === 'south' ? getSabbatsForYearSouthern : getSabbatsForYear;

  const all = [
    ...getYear(year),
    ...getYear(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return all.filter(s => s.date > from && s.date <= cutoff);
}
