import { describe, it, expect } from 'vitest';
import { getSabbatsForYear, getSabbatsForYearSouthern, getSabbatContext } from '../sabbats';
import { SABBAT_DATA_EXPIRY } from '../config';

describe('sabbat calendar', () => {
  // Guards review finding L2: exercise the full documented year range so a
  // missing year in the solstice/equinox tables surfaces as a failing test.
  it('returns 8 validly-dated sabbats per year through SABBAT_DATA_EXPIRY', () => {
    for (let year = 2025; year <= SABBAT_DATA_EXPIRY.getFullYear(); year++) {
      const north = getSabbatsForYear(year);
      const south = getSabbatsForYearSouthern(year);
      expect(north).toHaveLength(8);
      expect(south).toHaveLength(8);
      for (const s of [...north, ...south]) {
        expect(s.date.getFullYear()).toBe(year);
        expect(Number.isNaN(s.date.getTime())).toBe(false);
      }
    }
  });

  it('flips the wheel by six months between hemispheres', () => {
    // On the spring equinox (~20 Mar) the north celebrates Ostara, the south Mabon.
    const date = new Date(2026, 2, 20);
    expect(getSabbatContext(date, 'north').today?.name).toBe('Ostara');
    expect(getSabbatContext(date, 'south').today?.name).toBe('Mabon');
  });
});
