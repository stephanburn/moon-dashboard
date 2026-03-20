export interface MoonSignChange {
  name: string;
  symbol: string;
  enterTime: Date;
}

export interface ZodiacSign {
  name: string;
  symbol: string;
  startMonth: number; // 1-based
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface SunSignInfo {
  sign: ZodiacSign;
  transitStart: Date;
  transitEnd: Date;
}

export interface NextIngress {
  sign: ZodiacSign;
  date: Date;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Capricorn',    symbol: '♑', startMonth: 12, startDay: 22, endMonth: 1,  endDay: 19 },
  { name: 'Aquarius',     symbol: '♒', startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 18 },
  { name: 'Pisces',       symbol: '♓', startMonth: 2,  startDay: 19, endMonth: 3,  endDay: 20 },
  { name: 'Aries',        symbol: '♈', startMonth: 3,  startDay: 21, endMonth: 4,  endDay: 19 },
  { name: 'Taurus',       symbol: '♉', startMonth: 4,  startDay: 20, endMonth: 5,  endDay: 20 },
  { name: 'Gemini',       symbol: '♊', startMonth: 5,  startDay: 21, endMonth: 6,  endDay: 20 },
  { name: 'Cancer',       symbol: '♋', startMonth: 6,  startDay: 21, endMonth: 7,  endDay: 22 },
  { name: 'Leo',          symbol: '♌', startMonth: 7,  startDay: 23, endMonth: 8,  endDay: 22 },
  { name: 'Virgo',        symbol: '♍', startMonth: 8,  startDay: 23, endMonth: 9,  endDay: 22 },
  { name: 'Libra',        symbol: '♎', startMonth: 9,  startDay: 23, endMonth: 10, endDay: 22 },
  { name: 'Scorpio',      symbol: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { name: 'Sagittarius',  symbol: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

function dateMatchesSign(month: number, day: number, sign: ZodiacSign): boolean {
  const start = sign.startMonth * 100 + sign.startDay;
  const end   = sign.endMonth   * 100 + sign.endDay;
  const cur   = month * 100 + day;

  if (start > end) {
    // Wraps year boundary (Capricorn: Dec 22 – Jan 19)
    return cur >= start || cur <= end;
  }
  return cur >= start && cur <= end;
}

function getSignForDate(date: Date): ZodiacSign {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return ZODIAC_SIGNS.find(s => dateMatchesSign(month, day, s))!;
}

export function getCurrentSunSign(date: Date = new Date()): SunSignInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const sign = ZODIAC_SIGNS.find(s => dateMatchesSign(month, day, s))!;

  // Determine the transit start date for this year
  let startYear = year;
  if (sign.name === 'Capricorn' && month === 1) {
    startYear = year - 1;
  }
  const transitStart = new Date(startYear, sign.startMonth - 1, sign.startDay);

  // Determine the transit end date for this year
  let endYear = year;
  if (sign.name === 'Capricorn' && month === 12) {
    endYear = year + 1;
  }
  const transitEnd = new Date(endYear, sign.endMonth - 1, sign.endDay);

  return { sign, transitStart, transitEnd };
}

export function getNextSunSignIngress(date: Date = new Date()): NextIngress {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Find current sign index
  const currentIndex = ZODIAC_SIGNS.findIndex(s => dateMatchesSign(month, day, s));
  const nextIndex = (currentIndex + 1) % ZODIAC_SIGNS.length;
  const nextSign = ZODIAC_SIGNS[nextIndex];

  // Work out what year the next sign starts
  let nextYear = year;
  if (nextSign.startMonth < month || (nextSign.startMonth === month && nextSign.startDay <= day)) {
    nextYear = year + 1;
  }

  return {
    sign: nextSign,
    date: new Date(nextYear, nextSign.startMonth - 1, nextSign.startDay),
  };
}

/**
 * Get the next `count` sun sign ingresses starting from `from`.
 * Iterates day-by-day and detects sign transitions.
 */
export function getUpcomingSunIngresses(from: Date, count = 8): NextIngress[] {
  const results: NextIngress[] = [];
  let prevSign = getSignForDate(from);

  for (let day = 1; day <= 200 && results.length < count; day++) {
    const d = new Date(from.getTime() + day * 24 * 60 * 60 * 1000);
    const currSign = getSignForDate(d);

    if (currSign.name !== prevSign.name) {
      results.push({ sign: currSign, date: d });
    }

    prevSign = currSign;
  }

  return results;
}

// ── Moon sign by ecliptic longitude ────────────────────────────────────────

// Tropical zodiac sign order (Aries = 0°, each 30°)
const ECLIPTIC_SIGNS = [
  { name: 'Aries',       symbol: '♈' },
  { name: 'Taurus',      symbol: '♉' },
  { name: 'Gemini',      symbol: '♊' },
  { name: 'Cancer',      symbol: '♋' },
  { name: 'Leo',         symbol: '♌' },
  { name: 'Virgo',       symbol: '♍' },
  { name: 'Libra',       symbol: '♎' },
  { name: 'Scorpio',     symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn',   symbol: '♑' },
  { name: 'Aquarius',    symbol: '♒' },
  { name: 'Pisces',      symbol: '♓' },
];

/**
 * Calculate the Moon's ecliptic longitude (degrees, 0–360) using a simplified
 * version of the Meeus algorithm. Accurate to ~1–2° — sufficient for sign
 * determination, though the sign boundary may be off by a few hours.
 */
function getMoonEclipticLongitude(date: Date): number {
  const JD = date.getTime() / 86_400_000 + 2_440_587.5;
  const T  = (JD - 2_451_545.0) / 36_525;

  const r = Math.PI / 180;
  const norm = (x: number) => ((x % 360) + 360) % 360;

  const L  = norm(218.3164477 + 481267.88123421 * T); // Moon mean longitude (°)
  const Mp = r * norm(134.9633964 + 477198.8675055 * T); // Moon mean anomaly
  const M  = r * norm(357.5291092 +  35999.0502909 * T); // Sun  mean anomaly
  const D  = r * norm(297.8501921 + 445267.1114034 * T); // Moon elongation
  const F  = r * norm(93.2720950  + 483202.0175233 * T); // Moon arg of latitude

  // Main periodic longitude corrections (degrees)
  const dL =
      6.288774 * Math.sin(Mp)
    + 1.274027 * Math.sin(2 * D - Mp)
    + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * Mp)
    - 0.185116 * Math.sin(M)
    - 0.114332 * Math.sin(2 * F)
    + 0.058793 * Math.sin(2 * D - 2 * Mp)
    + 0.057066 * Math.sin(2 * D - M - Mp)
    + 0.053322 * Math.sin(2 * D + Mp)
    + 0.045758 * Math.sin(2 * D - M)
    - 0.040923 * Math.sin(M - Mp)
    - 0.034720 * Math.sin(D)
    - 0.030383 * Math.sin(M + Mp)
    + 0.015327 * Math.sin(2 * D - 2 * F)
    + 0.010980 * Math.sin(2 * F - Mp);

  return norm(L + dL);
}

function moonSignFromLongitude(lon: number): { name: string; symbol: string } {
  return ECLIPTIC_SIGNS[Math.floor(lon / 30)];
}

export function getCurrentMoonSign(now: Date = new Date()): { name: string; symbol: string } {
  return moonSignFromLongitude(getMoonEclipticLongitude(now));
}

/**
 * Return the next `count` times the Moon changes zodiac sign after `from`.
 * Searches hourly then refines to the nearest minute.
 */
export function getUpcomingMoonSignChanges(from: Date, count = 3): MoonSignChange[] {
  const HOUR   = 60 * 60 * 1000;
  const MINUTE = 60 * 1000;
  const results: MoonSignChange[] = [];

  let prevIdx = Math.floor(getMoonEclipticLongitude(from) / 30);

  for (let h = 1; h <= 24 * 30 && results.length < count; h++) {
    const t      = new Date(from.getTime() + h * HOUR);
    const lon    = getMoonEclipticLongitude(t);
    const signIdx = Math.floor(lon / 30);

    if (signIdx !== prevIdx) {
      // Refine: find the first minute within the preceding hour where the sign is already new
      let exactTime = t;
      for (let m = 59; m >= 0; m--) {
        const candidate = new Date(t.getTime() - m * MINUTE);
        if (Math.floor(getMoonEclipticLongitude(candidate) / 30) !== signIdx) {
          exactTime = new Date(candidate.getTime() + MINUTE);
          break;
        }
      }
      const sign = ECLIPTIC_SIGNS[signIdx];
      results.push({ name: sign.name, symbol: sign.symbol, enterTime: exactTime });
      prevIdx = signIdx;
    }
  }

  return results;
}
