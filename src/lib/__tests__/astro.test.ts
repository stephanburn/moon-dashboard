import { describe, it, expect } from 'vitest';
import { getCurrentSunSign, getUpcomingSunIngresses } from '../astro';
import { makeDay } from '../days';

// The Capricorn case exercises the Dec->Jan year-boundary wrap, the trickiest
// branch of the sun-sign table.
describe('getCurrentSunSign: Capricorn year boundary & cusps', () => {
  it('treats early January as Capricorn, running until 19 January', () => {
    const info = getCurrentSunSign(makeDay(2026, 1, 10));
    expect(info.sign).toBe('Capricorn');
    expect(info.until).toBe('2026-01-19');
  });

  it('treats late December as Capricorn, running into the next year', () => {
    const info = getCurrentSunSign(makeDay(2026, 12, 25));
    expect(info.sign).toBe('Capricorn');
    expect(info.until).toBe('2027-01-19');
  });

  it('places the Capricorn -> Aquarius cusp on 20 January', () => {
    expect(getCurrentSunSign(makeDay(2026, 1, 19)).sign).toBe('Capricorn');
    expect(getCurrentSunSign(makeDay(2026, 1, 20)).sign).toBe('Aquarius');
  });

  it('places the Aries -> Taurus cusp on 20 April', () => {
    expect(getCurrentSunSign(makeDay(2026, 4, 19)).sign).toBe('Aries');
    expect(getCurrentSunSign(makeDay(2026, 4, 20)).sign).toBe('Taurus');
  });
});

describe('getUpcomingSunIngresses', () => {
  it('lists every ingress in the range, across the year boundary', () => {
    const ingresses = getUpcomingSunIngresses(makeDay(2026, 11, 1), makeDay(2027, 2, 28));
    expect(ingresses.map(i => `${i.sign} ${i.day}`)).toEqual([
      'Sagittarius 2026-11-22',
      'Capricorn 2026-12-22',
      'Aquarius 2027-01-20',
      'Pisces 2027-02-19',
    ]);
  });
});
