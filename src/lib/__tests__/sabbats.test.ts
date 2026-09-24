import { describe, it, expect } from 'vitest';
import { getSabbatsForYear, getSabbatContext, getUpcomingSabbats } from '../sabbats';
import { makeDay } from '../days';
import { SABBAT_DATA_EXPIRY } from '../config';

describe('sabbat calendar', () => {
  // Exercise the full documented year range so a missing year in the
  // solstice/equinox tables surfaces as a failing test.
  it('returns 8 sabbats per year in each hemisphere through SABBAT_DATA_EXPIRY', () => {
    for (let year = 2025; year <= Number(SABBAT_DATA_EXPIRY.slice(0, 4)); year++) {
      for (const hemisphere of ['north', 'south'] as const) {
        const sabbats = getSabbatsForYear(year, hemisphere);
        expect(sabbats).toHaveLength(8);
        expect(new Set(sabbats.map(s => s.name)).size).toBe(8);
        for (const s of sabbats) expect(s.day.startsWith(`${year}-`)).toBe(true);
      }
    }
  });

  it('flips the wheel by six months between hemispheres', () => {
    // On the spring equinox (~20 Mar) the north celebrates Ostara, the south Mabon.
    const day = makeDay(2026, 3, 20);
    expect(getSabbatContext(day, 'north').today?.name).toBe('Ostara');
    expect(getSabbatContext(day, 'south').today?.name).toBe('Mabon');
  });

  it('finds the next sabbat across the year boundary', () => {
    const ctx = getSabbatContext(makeDay(2026, 12, 25), 'north');
    expect(ctx.today).toBeNull();
    expect(ctx.nextSabbat?.name).toBe('Imbolc');
    expect(ctx.nextSabbat?.day).toBe('2027-02-01');
  });

  it('lists upcoming sabbats strictly after the start day', () => {
    const upcoming = getUpcomingSabbats(makeDay(2026, 10, 31), makeDay(2027, 3, 31), 'north');
    expect(upcoming.map(s => s.name)).toEqual(['Yule', 'Imbolc', 'Ostara']);
  });
});
