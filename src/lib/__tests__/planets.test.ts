import { describe, it, expect } from 'vitest';
import { VENUS_INGRESSES, MERCURY_RETROGRADES } from '../planets';
import { PLANET_DATA_EXPIRY } from '../config';

// These tables are hand-maintained (see AGENTS.md). getCurrentVenusSign() assumes
// a strictly sorted, gap-free table, so a single mis-ordered or duplicated
// hand-entered date would silently mis-attribute the current sign. These guards
// turn that class of typo into a failing test instead of a wrong dashboard.
describe('planet lookup tables — data integrity', () => {
  it('Venus ingresses are in strict chronological order', () => {
    for (let i = 1; i < VENUS_INGRESSES.length; i++) {
      expect(
        VENUS_INGRESSES[i].date.getTime(),
        `VENUS_INGRESSES[${i}] (${VENUS_INGRESSES[i].sign.name}) is not strictly after the previous entry`,
      ).toBeGreaterThan(VENUS_INGRESSES[i - 1].date.getTime());
    }
  });

  it('every Venus ingress falls on or before the declared data-expiry date', () => {
    for (const v of VENUS_INGRESSES) {
      expect(
        v.date.getTime(),
        `Venus ingress ${v.sign.name} (${v.date.toISOString()}) is past PLANET_DATA_EXPIRY`,
      ).toBeLessThanOrEqual(PLANET_DATA_EXPIRY.getTime());
    }
  });

  it('each Mercury retrograde period is internally ordered (shadow ⊂ retrograde span)', () => {
    for (const p of MERCURY_RETROGRADES) {
      expect(p.shadowStart.getTime()).toBeLessThan(p.retrogradeStart.getTime());
      expect(p.retrogradeStart.getTime()).toBeLessThan(p.retrogradeEnd.getTime());
      expect(p.retrogradeEnd.getTime()).toBeLessThan(p.shadowEnd.getTime());
    }
  });

  it('Mercury retrograde periods are chronological and their shadow windows do not overlap', () => {
    for (let i = 1; i < MERCURY_RETROGRADES.length; i++) {
      expect(
        MERCURY_RETROGRADES[i].shadowStart.getTime(),
        `MERCURY_RETROGRADES[${i}] (${MERCURY_RETROGRADES[i].signs}) overlaps the previous period's shadow window`,
      ).toBeGreaterThan(MERCURY_RETROGRADES[i - 1].shadowEnd.getTime());
    }
  });

  it('every Mercury retrograde falls on or before the declared data-expiry date', () => {
    for (const p of MERCURY_RETROGRADES) {
      expect(p.shadowEnd.getTime()).toBeLessThanOrEqual(PLANET_DATA_EXPIRY.getTime());
    }
  });
});
