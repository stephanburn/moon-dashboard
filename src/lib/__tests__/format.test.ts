import { describe, it, expect } from 'vitest';
import { formatRelativeDays } from '../format';

// Day boundaries are evaluated in UTC here so the constructed instants map
// directly onto calendar days without device-zone interference.
const TZ = 'UTC';
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

describe('formatRelativeDays', () => {
  const now = day(2026, 6, 29);

  it('labels the same day as Today', () => {
    expect(formatRelativeDays(day(2026, 6, 29), now, TZ)).toBe('Today');
    // An earlier instant on the same day is still Today
    expect(formatRelativeDays(new Date(Date.UTC(2026, 5, 29, 1, 0, 0)), now, TZ)).toBe('Today');
  });

  it('labels the next day as Tomorrow', () => {
    expect(formatRelativeDays(day(2026, 6, 30), now, TZ)).toBe('Tomorrow');
  });

  it('counts days up to a fortnight', () => {
    expect(formatRelativeDays(day(2026, 7, 5), now, TZ)).toBe('in 6 days');
    expect(formatRelativeDays(day(2026, 7, 13), now, TZ)).toBe('in 14 days');
  });

  it('switches to weeks past a fortnight', () => {
    expect(formatRelativeDays(day(2026, 7, 14), now, TZ)).toBe('in 2 weeks');
    expect(formatRelativeDays(day(2026, 8, 1), now, TZ)).toBe('in 5 weeks');
  });

  it('counts across a month boundary', () => {
    const lateJan = day(2026, 1, 28);
    expect(formatRelativeDays(day(2026, 2, 3), lateJan, TZ)).toBe('in 6 days');
    expect(formatRelativeDays(day(2026, 1, 29), lateJan, TZ)).toBe('Tomorrow');
  });
});
