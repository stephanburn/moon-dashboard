import {
  Body,
  Illumination,
  MoonPhase,
  SearchMoonPhase,
  SearchMoonQuarter,
  NextMoonQuarter,
} from 'astronomy-engine';

export interface MoonPhaseInfo {
  emoji: string;
  name: string;
  illumination: number; // 0-100
  fraction: number;     // 0-1 un-rounded illuminated fraction (for drawing the disc)
  ageInDays: number;    // 0-29.5
  phase: number;        // 0-1 cycle position (0 = New, 0.5 = Full)
}

export interface MoonPhasePeak {
  phaseName: 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter';
  peakTime: Date;
}

export interface UpcomingMoonPhase {
  name: 'New Moon' | 'Full Moon' | 'First Quarter' | 'Last Quarter';
  emoji: string;
  date: Date;
}

const HOUR = 60 * 60 * 1000;
const DAY  = 24 * HOUR;

// One synodic month, used to bracket the previous occurrence of a phase.
const SYNODIC_DAYS = 29.53;

function getMoonAgeInDays(phase: number): number {
  return phase * SYNODIC_DAYS;
}

/**
 * Illuminated fraction (0-1) and cycle position (0-1) for a given instant,
 * using astronomy-engine. `phase` follows the same 0 = New → 0.5 = Full → 1 = New
 * convention SunCalc used: MoonPhase returns the 0-360° Sun-Moon elongation.
 */
function getIllumination(date: Date): { phase: number; fraction: number } {
  return {
    phase: MoonPhase(date) / 360,
    fraction: Illumination(Body.Moon, date).phase_fraction,
  };
}

// Phase target (0 = New, 0.25 = FQ, 0.5 = FM, 0.75 = LQ) → ecliptic
// elongation in degrees, as expected by astronomy-engine's SearchMoonPhase.
function targetToLongitude(target: number): number {
  return target * 360;
}

/**
 * Find the precise moment nearest to `center` when the moon reaches the given
 * phase target (0 = New Moon, 0.25 = FQ, 0.5 = FM, 0.75 = LQ). Uses
 * astronomy-engine's high-precision search (accurate to the second) rather than
 * SunCalc's low-precision illumination model.
 */
function findNearestPeakTime(center: Date, target: number): Date {
  const lon = targetToLongitude(target);

  // Next occurrence at or after `center`.
  const next = SearchMoonPhase(lon, center, 40);
  if (!next) return center;

  // The occurrence immediately before `next` (~one synodic month earlier).
  const prevStart = new Date(next.date.getTime() - (SYNODIC_DAYS + 1.5) * DAY);
  const prev = SearchMoonPhase(lon, prevStart, SYNODIC_DAYS + 1.5);

  if (prev &&
      Math.abs(prev.date.getTime() - center.getTime()) <
      Math.abs(next.date.getTime() - center.getTime())) {
    return prev.date;
  }
  return next.date;
}

/**
 * Find the nearest peak time for ALL four major phase targets.
 */
const PEAK_TARGETS = [0, 0.25, 0.5, 0.75] as const;

function findNearestPeakTimes(center: Date): Map<number, Date> {
  const result = new Map<number, Date>();
  for (const target of PEAK_TARGETS) {
    result.set(target, findNearestPeakTime(center, target));
  }
  return result;
}

/**
 * Find the next future occurrence of the given phase target after `after`.
 * Used to find upcoming peaks for transitional phases.
 */
function findNextFuturePeakTime(after: Date, target: number): Date {
  const lon = targetToLongitude(target);
  const next = SearchMoonPhase(lon, after, 40);
  return next ? next.date : new Date(after.getTime() + DAY);
}

// Major phase definitions with their widened practitioner windows
const MAJOR_PHASES = [
  { name: 'New Moon'      as const, emoji: '🌑', target: 0,    halfWindowDays: 1.5 },
  { name: 'First Quarter' as const, emoji: '🌓', target: 0.25, halfWindowDays: 1.0 },
  { name: 'Full Moon'     as const, emoji: '🌕', target: 0.5,  halfWindowDays: 1.5 },
  { name: 'Last Quarter'  as const, emoji: '🌗', target: 0.75, halfWindowDays: 1.0 },
];

// For each transitional phase, the next major phase to display a peak for
const TRANSITIONAL_NEXT: Record<string, typeof MAJOR_PHASES[number]> = {
  'Waxing Crescent': MAJOR_PHASES[1], // → First Quarter
  'Waxing Gibbous':  MAJOR_PHASES[2], // → Full Moon
  'Waning Gibbous':  MAJOR_PHASES[3], // → Last Quarter
  'Waning Crescent': MAJOR_PHASES[0], // → New Moon
};

/**
 * Determine the current moon phase using widened practitioner windows around
 * each major phase peak. Transitional phases fill the gaps between windows.
 */
export function getMoonPhaseInfo(now: Date = new Date()): MoonPhaseInfo {
  const { phase, fraction } = getIllumination(now);

  // Check each major phase window against a single shared peak scan
  const peakTimes = findNearestPeakTimes(now);
  for (const mp of MAJOR_PHASES) {
    const peakTime = peakTimes.get(mp.target)!;
    if (Math.abs(now.getTime() - peakTime.getTime()) <= mp.halfWindowDays * DAY) {
      return {
        emoji: mp.emoji,
        name: mp.name,
        illumination: Math.round(fraction * 100),
        fraction,
        ageInDays: parseFloat(getMoonAgeInDays(phase).toFixed(1)),
        phase,
      };
    }
  }

  // Not in any major window — transitional phase from raw phase value
  let emoji: string, name: string;
  if (phase < 0.25)      { emoji = '🌒'; name = 'Waxing Crescent'; }
  else if (phase < 0.5)  { emoji = '🌔'; name = 'Waxing Gibbous';  }
  else if (phase < 0.75) { emoji = '🌖'; name = 'Waning Gibbous';  }
  else                   { emoji = '🌘'; name = 'Waning Crescent';  }

  return {
    emoji,
    name,
    illumination: Math.round(fraction * 100),
    fraction,
    ageInDays: parseFloat(getMoonAgeInDays(phase).toFixed(1)),
    phase,
  };
}

/**
 * Find the relevant phase peak for display:
 * - Major phases (New Moon etc.): the nearest peak for that phase (may be past or future)
 * - Transitional phases: the next future peak of the upcoming major phase
 */
export function getMoonPhasePeak(now: Date, displayedPhaseName: string): MoonPhasePeak {
  const own = MAJOR_PHASES.find(mp => mp.name === displayedPhaseName);
  if (own) {
    return { phaseName: own.name, peakTime: findNearestPeakTime(now, own.target) };
  }

  const next = TRANSITIONAL_NEXT[displayedPhaseName] ?? MAJOR_PHASES[0];
  return { phaseName: next.name, peakTime: findNextFuturePeakTime(now, next.target) };
}

/**
 * Get all 4 major upcoming moon phases (New, First Quarter, Full, Last Quarter)
 * for the next `upToMonths` months. Returns them sorted chronologically.
 */
export function getUpcomingMajorPhases(from: Date, upToMonths = 6): UpcomingMoonPhase[] {
  const results: UpcomingMoonPhase[] = [];
  const maxTime = from.getTime() + upToMonths * 30 * DAY;

  // astronomy-engine's quarter index: 0 = New, 1 = FQ, 2 = Full, 3 = LQ.
  const QUARTER_META: { name: UpcomingMoonPhase['name']; emoji: string }[] = [
    { name: 'New Moon',      emoji: '🌑' },
    { name: 'First Quarter', emoji: '🌓' },
    { name: 'Full Moon',     emoji: '🌕' },
    { name: 'Last Quarter',  emoji: '🌗' },
  ];

  let q = SearchMoonQuarter(from);
  while (q.time.date.getTime() <= maxTime) {
    const meta = QUARTER_META[q.quarter];
    results.push({ name: meta.name, emoji: meta.emoji, date: q.time.date });
    q = NextMoonQuarter(q);
  }

  // Already chronological from the quarter walk.
  return results;
}

// Keep original export for backward compatibility
export function getNextMoonPhases(from: Date = new Date()): UpcomingMoonPhase[] {
  return getUpcomingMajorPhases(from, 2).slice(0, 2);
}
