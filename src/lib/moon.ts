import SunCalc from 'suncalc';

export interface MoonPhaseInfo {
  emoji: string;
  name: string;
  illumination: number; // 0-100
  ageInDays: number;    // 0-29.5
  phase: number;        // 0-1 raw from SunCalc
}

export interface UpcomingMoonPhase {
  name: 'New Moon' | 'Full Moon';
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

export function getNextMoonPhases(from: Date = new Date()): UpcomingMoonPhase[] {
  const results: UpcomingMoonPhase[] = [];
  let foundNewMoon = false;
  let foundFullMoon = false;

  // Iterate forward day by day, up to 35 days
  for (let i = 1; i <= 35; i++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + i);

    const { phase } = SunCalc.getMoonIllumination(candidate);

    if (!foundNewMoon && (phase < 0.02 || phase >= 0.98)) {
      results.push({ name: 'New Moon', emoji: '🌑', date: candidate });
      foundNewMoon = true;
    }

    if (!foundFullMoon && phase >= 0.48 && phase < 0.52) {
      results.push({ name: 'Full Moon', emoji: '🌕', date: candidate });
      foundFullMoon = true;
    }

    if (foundNewMoon && foundFullMoon) break;
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}
