import { describe, it, expect } from 'vitest';
import { getSabbatsForYear, getSabbatContext, getUpcomingSabbats } from '../sabbats';
import { makeDay } from '../days';

const LONDON = 'Europe/London';

describe('sabbat calendar', () => {
  it('returns 8 distinct sabbats per year in each hemisphere, with no expiry', () => {
    for (let year = 2025; year <= 2040; year++) {
      for (const hemisphere of ['north', 'south'] as const) {
        const sabbats = getSabbatsForYear(year, hemisphere, LONDON);
        expect(sabbats).toHaveLength(8);
        expect(new Set(sabbats.map(s => s.name)).size).toBe(8);
        for (const s of sabbats) expect(s.day.startsWith(`${year}-`)).toBe(true);
      }
    }
  });

  it('flips the wheel by six months between hemispheres', () => {
    // The March 2026 equinox (14:46 UTC on the 20th) is Ostara in London and
    // Mabon in Sydney, where it falls at 01:46 on the 21st.
    expect(getSabbatContext(makeDay(2026, 3, 20), 'north', LONDON).today?.name).toBe('Ostara');
    expect(getSabbatContext(makeDay(2026, 3, 21), 'south', 'Australia/Sydney').today?.name).toBe('Mabon');
  });

  // Review finding P1-3: the Sep 2026 equinox is 00:05 UTC on the 23rd.
  it('puts equinoxes on the viewer-local day', () => {
    const mabon = (tz: string) =>
      getSabbatsForYear(2026, 'north', tz).find(s => s.name === 'Mabon')!.day;
    expect(mabon('Europe/London')).toBe('2026-09-23');
    expect(mabon('America/New_York')).toBe('2026-09-22');
    expect(mabon('Pacific/Honolulu')).toBe('2026-09-22');
    expect(mabon('Asia/Tokyo')).toBe('2026-09-23');
  });

  it('finds the next sabbat across the year boundary', () => {
    const ctx = getSabbatContext(makeDay(2026, 12, 25), 'north', LONDON);
    expect(ctx.today).toBeNull();
    expect(ctx.nextSabbat?.name).toBe('Imbolc');
    expect(ctx.nextSabbat?.day).toBe('2027-02-01');
  });

  it('lists upcoming sabbats strictly after the start day', () => {
    const upcoming = getUpcomingSabbats(makeDay(2026, 10, 31), makeDay(2027, 3, 31), 'north', LONDON);
    expect(upcoming.map(s => s.name)).toEqual(['Yule', 'Imbolc', 'Ostara']);
  });
});
