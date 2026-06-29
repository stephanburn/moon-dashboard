import type { Hemisphere } from './timezones';

export interface MoonGeometry {
  litPath: string;   // SVG path 'd' for the illuminated region
  litRight: boolean; // which limb is lit, after the hemisphere flip
  gibbous: boolean;  // lit area covers more than half the disc
}

/**
 * Build the SVG path for the moon's illuminated region using the canonical
 * two-arc construction: the outer limb is a semicircle on the lit side, and the
 * terminator is a half-ellipse whose horizontal radius shrinks to zero at the
 * quarters (a straight day/night line) and grows to the full radius at new/full.
 *
 * Pure and side-effect free so it can be unit-tested independently of the SVG.
 *
 * @param fraction   illuminated fraction, 0–1
 * @param waxing     true while the moon is growing (SunCalc phase < 0.5)
 * @param hemisphere viewer hemisphere; south mirrors the lit limb
 */
export function moonGeometry(
  fraction: number,
  waxing: boolean,
  hemisphere: Hemisphere,
  cx: number,
  cy: number,
  r: number,
): MoonGeometry {
  const f = Math.min(1, Math.max(0, fraction));
  const gibbous = f > 0.5;

  // Terminator ellipse x-radius: r at new/full, 0 at the quarters. Rounded to a
  // sub-pixel precision so that microsecond drift between the server and client
  // `new Date()` can't change the path string and trigger a hydration mismatch.
  const rx = Math.round(r * Math.abs(1 - 2 * f) * 100) / 100;

  // In the northern hemisphere a waxing moon is lit on the right; the southern
  // hemisphere sees the same moon mirrored.
  const litRight = hemisphere === 'south' ? !waxing : waxing;

  // Outer semicircle sweep places the bulge on the lit limb; the terminator
  // bulges the same way for a gibbous moon and the opposite way for a crescent.
  const outerSweep = litRight ? 1 : 0;
  const innerSweep = gibbous ? outerSweep : 1 - outerSweep;

  const litPath = [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r}`,
    `A ${rx} ${r} 0 0 ${innerSweep} ${cx} ${cy - r}`,
    'Z',
  ].join(' ');

  return { litPath, litRight, gibbous };
}
