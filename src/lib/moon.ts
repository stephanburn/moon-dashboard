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

function getPhaseName(phase: number): { emoji: string; name: string } {
  if (phase < 0.02 || phase >= 0.98) return { emoji: '🌑', name: 'New Moon' };
  if (phase < 0.23) return { emoji: '🌒', name: 'Waxing Crescent' };
  if (phase < 0.27) return { emoji: '🌓', name: 'First Quarter' };
  if (phase < 0.48) return { emoji: '🌔', name: 'Waxing Gibbous' };
  if (phase < 0.52) return { emoji: '🌕', name: 'Full Moon' };
  if (phase < 0.73) return { emoji: '🌖', name: 'Waning Gibbous' };
  if (phase < 0.77) return { emoji: '🌗', name: 'Last Quarter' };
  return { emoji: '🌘', name: 'Waning Crescent' };
}

// Map the DISPLAYED phase name to the nearest major phase target.
// Using the name (rather than the raw phase at "now") avoids a mismatch when the
// phase has advanced past a threshold since midnight — e.g. phase was 0.99 at
// midnight (New Moon display) but is 0.03 by evening, which would incorrectly
// target First Quarter if we re-derived the target from the live phase value.
function phaseNameToTarget(name: string): { target: number; name: 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter' } {
  switch (name) {
    case 'New Moon':        return { target: 0,    name: 'New Moon' };
    case 'Waxing Crescent': return { target: 0.25, name: 'First Quarter' };
    case 'First Quarter':   return { target: 0.25, name: 'First Quarter' };
    case 'Waxing Gibbous':  return { target: 0.5,  name: 'Full Moon' };
    case 'Full Moon':       return { target: 0.5,  name: 'Full Moon' };
    case 'Waning Gibbous':  return { target: 0.75, name: 'Last Quarter' };
    case 'Last Quarter':    return { target: 0.75, name: 'Last Quarter' };
    case 'Waning Crescent': return { target: 0,    name: 'New Moon' };
    default:                return { target: 0,    name: 'New Moon' };
  }
}

// Circular distance between two phase values (handles the 0/1 wrap for New Moon)
function circularDist(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

// Lunar cycle is ~29.53 days. Estimate age from phase value.
function getMoonAgeInDays(phase: number): number {
  return phase * 29.53;
}

export function getMoonPhaseInfo(date: Date = new Date()): MoonPhaseInfo {
  const { phase, fraction } = SunCalc.getMoonIllumination(date);
  const { emoji, name } = getPhaseName(phase);
  return {
    emoji,
    name,
    illumination: Math.round(fraction * 100),
    ageInDays: parseFloat(getMoonAgeInDays(phase).toFixed(1)),
    phase,
  };
}

/**
 * Find the precise moment of the current phase's peak (e.g. exact Full Moon, exact New Moon).
 * Searches ±15 days with hourly resolution, then refines to minute resolution.
 * Uses the actual current moment (not just today's date) for accurate results.
 */
export function getMoonPhasePeak(now: Date, displayedPhaseName: string): MoonPhasePeak {
  const { target, name: phaseName } = phaseNameToTarget(displayedPhaseName);

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const SEARCH_WINDOW = 15 * DAY;

  // Hourly search over ±15 days
  let bestTime = now;
  let bestDist = Infinity;

  for (let dt = -SEARCH_WINDOW; dt <= SEARCH_WINDOW; dt += HOUR) {
    const candidate = new Date(now.getTime() + dt);
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestTime = candidate;
    }
  }

  // Minute refinement over ±2 hours around the best candidate
  const MINUTE = 60 * 1000;
  for (let dt = -2 * HOUR; dt <= 2 * HOUR; dt += MINUTE) {
    const candidate = new Date(bestTime.getTime() + dt);
    const { phase: p } = SunCalc.getMoonIllumination(candidate);
    const dist = circularDist(p, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestTime = candidate;
    }
  }

  return { phaseName, peakTime: bestTime };
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
