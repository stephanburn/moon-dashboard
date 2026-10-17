import { describe, it, expect } from 'vitest';
import { addDays, dayOf, dayParts, diffDays, makeDay, startOfDay } from '../days';

describe('makeDay / dayParts', () => {
  it('round-trips and zero-pads', () => {
    expect(makeDay(2026, 3, 5)).toBe('2026-03-05');
    expect(dayParts(makeDay(2026, 3, 5))).toEqual({ year: 2026, month: 3, day: 5 });
  });

  it('rolls over out-of-range parts', () => {
    expect(makeDay(2026, 12, 32)).toBe('2027-01-01');
    expect(makeDay(2028, 2, 30)).toBe('2028-03-01'); // leap year
  });
});

describe('dayOf', () => {
  const instant = new Date('2026-10-29T02:30:00Z');

  it('uses the selected timezone, not the device timezone', () => {
    expect(dayOf(instant, 'Europe/London')).toBe('2026-10-29');
    expect(dayOf(instant, 'America/New_York')).toBe('2026-10-28');
    expect(dayOf(instant, 'Australia/Sydney')).toBe('2026-10-29');
    expect(dayOf(instant, 'Pacific/Honolulu')).toBe('2026-10-28');
  });

  it('handles the DST change-over hour', () => {
    // UK clocks go back at 01:00 UTC on 25 Oct 2026.
    expect(dayOf(new Date('2026-10-24T23:30:00Z'), 'Europe/London')).toBe('2026-10-25');
    expect(dayOf(new Date('2026-10-25T00:30:00Z'), 'Europe/London')).toBe('2026-10-25');
    expect(dayOf(new Date('2026-10-25T23:30:00Z'), 'Europe/London')).toBe('2026-10-25');
  });

  it('handles the year boundary', () => {
    expect(dayOf(new Date('2026-12-31T23:30:00Z'), 'Europe/Berlin')).toBe('2027-01-01');
    expect(dayOf(new Date('2027-01-01T00:30:00Z'), 'America/Los_Angeles')).toBe('2026-12-31');
  });
});

describe('addDays / diffDays', () => {
  it('steps across DST, month and year boundaries by whole days', () => {
    expect(addDays(makeDay(2026, 3, 28), 2)).toBe('2026-03-30');
    expect(addDays(makeDay(2026, 12, 31), 1)).toBe('2027-01-01');
    expect(addDays(makeDay(2026, 3, 1), -1)).toBe('2026-02-28');
  });

  it('counts days between two days', () => {
    expect(diffDays(makeDay(2027, 1, 1), makeDay(2026, 12, 25))).toBe(7);
    expect(diffDays(makeDay(2026, 12, 25), makeDay(2027, 1, 1))).toBe(-7);
    expect(diffDays(makeDay(2026, 11, 1), makeDay(2026, 3, 1))).toBe(245);
  });
});

describe('startOfDay', () => {
  const hours = (day: string, tz: string) => {
    const d = day as ReturnType<typeof makeDay>;
    return (startOfDay(addDays(d, 1), tz).getTime() - startOfDay(d, tz).getTime()) / 3_600_000;
  };

  it('finds local midnight', () => {
    expect(startOfDay(makeDay(2026, 10, 24), 'Europe/London').toISOString()).toBe('2026-10-23T23:00:00.000Z');
    expect(startOfDay(makeDay(2026, 10, 25), 'Asia/Tokyo').toISOString()).toBe('2026-10-24T15:00:00.000Z');
  });

  it('measures 23- and 25-hour days', () => {
    expect(hours('2026-10-25', 'Europe/London')).toBe(25);
    expect(hours('2026-03-29', 'Europe/London')).toBe(23);
    expect(hours('2026-10-24', 'Europe/London')).toBe(24);
  });

  // Chile moves its clocks at midnight, so 6 Sep 2026 starts at 01:00.
  it('handles a day that starts after a skipped midnight', () => {
    const start = startOfDay(makeDay(2026, 9, 6), 'America/Santiago');
    expect(start.toISOString()).toBe('2026-09-06T04:00:00.000Z');
    expect(dayOf(start, 'America/Santiago')).toBe('2026-09-06');
    expect(dayOf(new Date(start.getTime() - 1), 'America/Santiago')).toBe('2026-09-05');
  });
});
