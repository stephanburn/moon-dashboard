import { describe, it, expect } from 'vitest';
import { VENUS_INGRESSES, MERCURY_RETROGRADES, getMercuryStatus } from '../planets';
import { PLANET_DATA_EXPIRY } from '../config';
import { makeDay } from '../days';

// These tables are hand-maintained (see AGENTS.md). getCurrentVenusSign() assumes
// a strictly sorted, gap-free table, so a single mis-ordered or duplicated
// hand-entered date would silently mis-attribute the current sign. These guards
// turn that class of typo into a failing test instead of a wrong dashboard.
describe('planet lookup tables — data integrity', () => {
  it('Venus ingresses are in strict chronological order', () => {
    for (let i = 1; i < VENUS_INGRESSES.length; i++) {
      expect(
        VENUS_INGRESSES[i].day > VENUS_INGRESSES[i - 1].day,
        `VENUS_INGRESSES[${i}] (${VENUS_INGRESSES[i].sign}) is not strictly after the previous entry`,
      ).toBe(true);
    }
  });

  it('every Venus ingress falls on or before the declared data-expiry date', () => {
    for (const v of VENUS_INGRESSES) {
      expect(v.day <= PLANET_DATA_EXPIRY, `Venus ingress ${v.sign} (${v.day}) is past PLANET_DATA_EXPIRY`).toBe(true);
    }
  });

  it('each Mercury retrograde period is internally ordered (shadow ⊂ retrograde span)', () => {
    for (const p of MERCURY_RETROGRADES) {
      expect(p.shadowStart < p.retrogradeStart).toBe(true);
      expect(p.retrogradeStart < p.retrogradeEnd).toBe(true);
      expect(p.retrogradeEnd < p.shadowEnd).toBe(true);
    }
  });

  it('Mercury retrograde periods are chronological and their shadow windows do not overlap', () => {
    for (let i = 1; i < MERCURY_RETROGRADES.length; i++) {
      expect(
        MERCURY_RETROGRADES[i].shadowStart > MERCURY_RETROGRADES[i - 1].shadowEnd,
        `MERCURY_RETROGRADES[${i}] (${MERCURY_RETROGRADES[i].signs}) overlaps the previous period's shadow window`,
      ).toBe(true);
    }
  });

  it('every Mercury retrograde falls on or before the declared data-expiry date', () => {
    for (const p of MERCURY_RETROGRADES) {
      expect(p.shadowEnd <= PLANET_DATA_EXPIRY).toBe(true);
    }
  });
});

// 2026 Pisces retrograde: shadow 12 Feb, retrograde 26 Feb – 20 Mar, shadow end
// 3 Apr. Periods are inclusive of their start and end days.
describe('getMercuryStatus — day boundaries', () => {
  it('is retrograde on the stated start and end days', () => {
    expect(getMercuryStatus(makeDay(2026, 2, 26)).status).toBe('retrograde');
    expect(getMercuryStatus(makeDay(2026, 3, 20)).status).toBe('retrograde');
  });

  it('becomes post-shadow the day after the end date', () => {
    expect(getMercuryStatus(makeDay(2026, 3, 21)).status).toBe('post-shadow');
  });

  it('reports pre-shadow during the shadow window before the station', () => {
    expect(getMercuryStatus(makeDay(2026, 2, 13)).status).toBe('pre-shadow');
  });

  it('includes the final shadow day, then returns to direct', () => {
    expect(getMercuryStatus(makeDay(2026, 4, 3)).status).toBe('post-shadow');
    expect(getMercuryStatus(makeDay(2026, 4, 4)).status).toBe('direct');
  });

  it('is direct well outside any retrograde window', () => {
    expect(getMercuryStatus(makeDay(2026, 1, 1)).status).toBe('direct');
  });
});
