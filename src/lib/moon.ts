import SunCalc from 'suncalc';

export interface MoonPhaseInfo {
  emoji: string;
  name: string;
  illumination: number; // 0-100
  ageInDays: number;    // 0-29.5
  phase: number;        // 0-1 raw from SunCalc
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
const MINUTE = 60 * 1000;

// Circular distance between two phase values (handles the 0/1 wrap for New Moon)
function circularDist(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

function getMoonAgeInDays(phase: number): number {
  return phase * 29.53;
}

/**
 * Find the precise moment nearest to `center` (within ±15 days) when the moon
 * reaches the given phase target (0 = New Moon, 0.25 = FQ, 0.5 = FM, 0.75 = LQ).
 * Uses hourly resolution then refines to the minute.
 */
function findNearestPeakTime(center: Date, target: number): Date {
  let bestTime = center;
  let bestDist = Infinity;

  for (let dt = -15 * DAY; dt <= 15 * DAY; dt += HOUR) {
    const candidate = new Date(center.getTime() + dt);
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) { bestDist = dist; bestTime = candidate; }
  }

  // Minute refinement over ±2 hours around the coarse best
  const coarseBest = bestTime;
  for (let dt = -2 * HOUR; dt <= 2 * HOUR; dt += MINUTE) {
    const candidate = new Date(coarseBest.getTime() + dt);
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) { bestDist = dist; bestTime = candidate; }
  }

  return bestTime;
}

/**
 * Find the next future occurrence of the given phase target, searching up to
 * 30 days ahead of `after`. Used to find upcoming peaks for transitional phases.
 */
function findNextFuturePeakTime(after: Date, target: number): Date {
  let bestTime = new Date(after.getTime() + DAY);
  let bestDist = Infinity;

  for (let dt = HOUR; dt <= 30 * DAY; dt += HOUR) {
    const candidate = new Date(after.getTime() + dt);
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) { bestDist = dist; bestTime = candidate; }
  }

  // Minute refinement
  const coarseBest = bestTime;
  for (let dt = -2 * HOUR; dt <= 2 * HOUR; dt += MINUTE) {
    const candidate = new Date(coarseBest.getTime() + dt);
    if (candidate.getTime() <= after.getTime()) continue;
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) { bestDist = dist; bestTime = candidate; }
  }

  return bestTime;
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
  const { phase, fraction } = SunCalc.getMoonIllumination(now);

  // Check each major phase window
  for (const mp of MAJOR_PHASES) {
    const peakTime = findNearestPeakTime(now, mp.target);
    if (Math.abs(now.getTime() - peakTime.getTime()) <= mp.halfWindowDays * DAY) {
      return {
        emoji: mp.emoji,
        name: mp.name,
        illumination: Math.round(fraction * 100),
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
  const maxDays = upToMonths * 30;

  const PHASES: { threshold: number; name: UpcomingMoonPhase['name']; emoji: string }[] = [
    { threshold: 0.25, name: 'First Quarter', emoji: '🌓' },
    { threshold: 0.5,  name: 'Full Moon',     emoji: '🌕' },
    { threshold: 0.75, name: 'Last Quarter',  emoji: '🌗' },
  ];

  let prev = SunCalc.getMoonIllumination(from).phase;

  for (let day = 1; day <= maxDays; day++) {
    const d = new Date(from.getTime() + day * 24 * 60 * 60 * 1000);
    const { phase: curr } = SunCalc.getMoonIllumination(d);

    // New Moon: phase wraps from ~1 down to ~0
    if (prev > 0.85 && curr < 0.15) {
      results.push({ name: 'New Moon', emoji: '🌑', date: d });
    }

    // Other phases: monotonically crossing a threshold
    for (const p of PHASES) {
      if (prev < p.threshold && curr >= p.threshold) {
        results.push({ name: p.name, emoji: p.emoji, date: d });
      }
    }

    prev = curr;
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Keep original export for backward compatibility
export function getNextMoonPhases(from: Date = new Date()): UpcomingMoonPhase[] {
  return getUpcomingMajorPhases(from, 2).slice(0, 2);
}
