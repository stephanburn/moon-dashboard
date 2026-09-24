import { describe, it, expect } from 'vitest';
import { getCurrentSunSign } from '../astro';

// The Sun's sign comes from its true ecliptic longitude, so cusp days follow
// the actual ingress instant rather than a fixed calendar table.
describe('getCurrentSunSign around the cusps', () => {
  it('changes sign at the exact ingress instant', () => {
    // Sun enters Libra at the Sep 2026 equinox, 00:05 UTC on the 23rd.
    expect(getCurrentSunSign(new Date('2026-09-23T00:00:00Z')).sign).toBe('Virgo');
    expect(getCurrentSunSign(new Date('2026-09-23T00:10:00Z')).sign).toBe('Libra');
  });

  it('handles Capricorn across the year boundary', () => {
    const info = getCurrentSunSign(new Date('2026-12-25T12:00:00Z'));
    expect(info.sign).toBe('Capricorn');
    expect(info.until.getUTCFullYear()).toBe(2027);
    expect(info.until.getUTCMonth()).toBe(0); // January
  });
});
