import { addDays, dayParts, makeDay, type CalendarDay } from './days';
import { SIGN_NAMES, type SignName } from './names';

// ── Sun sign (fixed date table) ────────────────────────────────────────────

export interface SunSignInfo {
  sign: SignName;
  until: CalendarDay; // last day the Sun is in this sign
}

export interface SunIngress {
  sign: SignName;
  day: CalendarDay;
}

// First day of each sign, in calendar order starting from Capricorn.
const SUN_SIGN_STARTS: { sign: SignName; month: number; day: number }[] = [
  { sign: 'Aquarius',    month: 1,  day: 20 },
  { sign: 'Pisces',      month: 2,  day: 19 },
  { sign: 'Aries',       month: 3,  day: 21 },
  { sign: 'Taurus',      month: 4,  day: 20 },
  { sign: 'Gemini',      month: 5,  day: 21 },
  { sign: 'Cancer',      month: 6,  day: 21 },
  { sign: 'Leo',         month: 7,  day: 23 },
  { sign: 'Virgo',       month: 8,  day: 23 },
  { sign: 'Libra',       month: 9,  day: 23 },
  { sign: 'Scorpio',     month: 10, day: 23 },
  { sign: 'Sagittarius', month: 11, day: 22 },
  { sign: 'Capricorn',   month: 12, day: 22 },
];

// Index into SUN_SIGN_STARTS of the sign in force on `day` (-1 = Capricorn
// carried over from the previous December).
function startIndexFor(day: CalendarDay): number {
  const { month, day: d } = dayParts(day);
  const md = month * 100 + d;
  let idx = -1;
  SUN_SIGN_STARTS.forEach((s, i) => {
    if (md >= s.month * 100 + s.day) idx = i;
  });
  return idx;
}

function signForDay(day: CalendarDay): SignName {
  const idx = startIndexFor(day);
  return idx === -1 ? 'Capricorn' : SUN_SIGN_STARTS[idx].sign;
}

export function getCurrentSunSign(today: CalendarDay): SunSignInfo {
  const { year } = dayParts(today);
  const idx = startIndexFor(today);
  const next = SUN_SIGN_STARTS[(idx + 1) % SUN_SIGN_STARTS.length];
  const nextYear = idx === SUN_SIGN_STARTS.length - 1 ? year + 1 : year;
  const nextStart = makeDay(nextYear, next.month, next.day);
  return { sign: signForDay(today), until: addDays(nextStart, -1) };
}

/** Sun sign changes on days strictly after `after`, up to and including `through`. */
export function getUpcomingSunIngresses(after: CalendarDay, through: CalendarDay): SunIngress[] {
  const results: SunIngress[] = [];
  let prev = signForDay(after);
  for (let day = addDays(after, 1); day <= through; day = addDays(day, 1)) {
    const sign = signForDay(day);
    if (sign !== prev) results.push({ sign, day });
    prev = sign;
  }
  return results;
}

// ── Moon sign by ecliptic longitude ────────────────────────────────────────

export interface MoonSignChange {
  sign: SignName;
  enterTime: Date;
}

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

const moonSignIndex = (date: Date) => Math.floor(getMoonEclipticLongitude(date) / 30);

export function getCurrentMoonSign(now: Date): SignName {
  return SIGN_NAMES[moonSignIndex(now)];
}

/**
 * Return the next `count` times the Moon changes zodiac sign after `from`.
 * Searches hourly then refines to the nearest minute.
 */
export function getUpcomingMoonSignChanges(from: Date, count = 3): MoonSignChange[] {
  const HOUR   = 60 * 60 * 1000;
  const MINUTE = 60 * 1000;
  const results: MoonSignChange[] = [];

  let prevIdx = moonSignIndex(from);

  for (let h = 1; h <= 24 * 30 && results.length < count; h++) {
    const t = new Date(from.getTime() + h * HOUR);
    const signIdx = moonSignIndex(t);

    if (signIdx !== prevIdx) {
      // Refine: find the first minute within the preceding hour where the sign is already new
      let exactTime = t;
      for (let m = 59; m >= 0; m--) {
        const candidate = new Date(t.getTime() - m * MINUTE);
        if (moonSignIndex(candidate) !== signIdx) {
          exactTime = new Date(candidate.getTime() + MINUTE);
          break;
        }
      }
      results.push({ sign: SIGN_NAMES[signIdx], enterTime: exactTime });
      prevIdx = signIdx;
    }
  }

  return results;
}
