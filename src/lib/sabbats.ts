export interface Sabbat {
  name: string;
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

export function getSabbatsForYear(year: number): Sabbat[] {
  const eq  = approxDate(SPRING_EQUINOX,  year);
  const sol = approxDate(SUMMER_SOLSTICE, year);
  const aeq = approxDate(AUTUMN_EQUINOX,  year);
  const ws  = approxDate(WINTER_SOLSTICE, year);

  return [
    {
      name: 'Imbolc',
      description: 'The first stirrings of spring',
      date: new Date(year, 1, 1), // 1 Feb
    },
    {
      name: 'Ostara',
      altName: 'Spring Equinox',
      description: 'The balance of light and dark at spring',
      date: new Date(year, eq.month - 1, eq.day),
    },
    {
      name: 'Beltane',
      description: 'The height of spring, fire and fertility',
      date: new Date(year, 4, 1), // 1 May
    },
    {
      name: 'Litha',
      altName: 'Summer Solstice',
      description: 'The longest day, the peak of the sun',
      date: new Date(year, sol.month - 1, sol.day),
    },
    {
      name: 'Lughnasadh',
      altName: 'Lammas',
      description: 'The first harvest',
      date: new Date(year, 7, 1), // 1 Aug
    },
    {
      name: 'Mabon',
      altName: 'Autumn Equinox',
      description: 'The second harvest and autumn balance',
      date: new Date(year, aeq.month - 1, aeq.day),
    },
    {
      name: 'Samhain',
      description: 'The veil is thin; the new year begins',
      date: new Date(year, 9, 31), // 31 Oct
    },
    {
      name: 'Yule',
      altName: 'Winter Solstice',
      description: 'The longest night; the return of the light',
      date: new Date(year, ws.month - 1, ws.day),
    },
  ];
}

export interface SabbatContext {
  today: Sabbat | null;       // non-null if today IS a sabbat
  nearest: string;            // e.g. "Between Imbolc and Ostara"
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

export function getSabbatContext(date: Date = new Date()): SabbatContext {
  const year = date.getFullYear();
  // Include previous and next year to handle year boundaries cleanly
  const all = [
    ...getSabbatsForYear(year - 1),
    ...getSabbatsForYear(year),
    ...getSabbatsForYear(year + 1),
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
    const displayName = today.altName ? `${today.name} — ${today.altName}` : today.name;
    nearest = displayName;
  } else {
    const prev = [...all].reverse().find(s => s.date < date);
    const next = all.find(s => s.date > date);
    if (prev && next) {
      nearest = `Between ${prev.name} and ${next.name}`;
    } else if (next) {
      nearest = `Before ${next.name}`;
    }
  }

  return { today, nearest, next3, nextSabbat, daysUntilNext };
}

/**
 * Get upcoming sabbats from `from` for the next `upToMonths` months.
 * Used for the unified Coming Up list.
 */
export function getUpcomingSabbats(from: Date, upToMonths = 6): Sabbat[] {
  const year = from.getFullYear();
  const cutoff = new Date(from.getTime() + upToMonths * 30 * 24 * 60 * 60 * 1000);

  const all = [
    ...getSabbatsForYear(year),
    ...getSabbatsForYear(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return all.filter(s => s.date > from && s.date <= cutoff);
}
