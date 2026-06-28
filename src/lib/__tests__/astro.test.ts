import { describe, it, expect } from 'vitest';
import { getCurrentSunSign } from '../astro';

// Dates here are built with `new Date(y, m-1, d)` (local midnight), which is how
// the app derives the sun sign, so these assertions are independent of the
// runner's timezone. The Capricorn case exercises the Dec->Jan year-boundary
// wrap in dateMatchesSign / getCurrentSunSign, the trickiest branch in astro.ts.
describe('getCurrentSunSign — Capricorn year boundary & cusps', () => {
  it('treats early January as Capricorn whose transit began the previous year', () => {
    const info = getCurrentSunSign(new Date(2026, 0, 10)); // 10 Jan 2026
    expect(info.sign.name).toBe('Capricorn');
    expect(info.transitStart.getFullYear()).toBe(2025);
    expect(info.transitStart.getMonth()).toBe(11); // December
    expect(info.transitStart.getDate()).toBe(22);
    expect(info.transitEnd.getFullYear()).toBe(2026);
    expect(info.transitEnd.getMonth()).toBe(0); // January
    expect(info.transitEnd.getDate()).toBe(19);
  });

  it('treats late December as Capricorn whose transit ends the following year', () => {
    const info = getCurrentSunSign(new Date(2026, 11, 25)); // 25 Dec 2026
    expect(info.sign.name).toBe('Capricorn');
    expect(info.transitStart.getFullYear()).toBe(2026);
    expect(info.transitStart.getMonth()).toBe(11);
    expect(info.transitEnd.getFullYear()).toBe(2027);
    expect(info.transitEnd.getMonth()).toBe(0);
    expect(info.transitEnd.getDate()).toBe(19);
  });

  it('places the Capricorn -> Aquarius cusp on 20 January', () => {
    expect(getCurrentSunSign(new Date(2026, 0, 19)).sign.name).toBe('Capricorn');
    expect(getCurrentSunSign(new Date(2026, 0, 20)).sign.name).toBe('Aquarius');
  });

  it('places the Aries -> Taurus cusp on 20 April', () => {
    expect(getCurrentSunSign(new Date(2026, 3, 19)).sign.name).toBe('Aries');
    expect(getCurrentSunSign(new Date(2026, 3, 20)).sign.name).toBe('Taurus');
  });
});
