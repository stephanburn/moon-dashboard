import { describe, it, expect } from 'vitest';
import { formatDay, formatPeakText, formatRelativeDays } from '../format';
import { makeDay } from '../days';

describe('formatRelativeDays', () => {
  const today = makeDay(2026, 6, 29);

  it('labels the same day (or earlier) as Today', () => {
    expect(formatRelativeDays(today, today)).toBe('Today');
    expect(formatRelativeDays(makeDay(2026, 6, 28), today)).toBe('Today');
  });

  it('labels the next day as Tomorrow', () => {
    expect(formatRelativeDays(makeDay(2026, 6, 30), today)).toBe('Tomorrow');
  });

  it('counts days up to a fortnight', () => {
    expect(formatRelativeDays(makeDay(2026, 7, 5), today)).toBe('in 6 days');
    expect(formatRelativeDays(makeDay(2026, 7, 13), today)).toBe('in 14 days');
  });

  it('switches to weeks past a fortnight', () => {
    expect(formatRelativeDays(makeDay(2026, 7, 14), today)).toBe('in 2 weeks');
    expect(formatRelativeDays(makeDay(2026, 8, 1), today)).toBe('in 5 weeks');
  });

  it('counts across month and DST boundaries', () => {
    expect(formatRelativeDays(makeDay(2026, 2, 3), makeDay(2026, 1, 28))).toBe('in 6 days');
    // Europe and the US both change clocks in this span.
    expect(formatRelativeDays(makeDay(2026, 3, 31), makeDay(2026, 3, 27))).toBe('in 4 days');
  });
});

// formatDay must read the same whatever the device timezone is. The suite runs
// under several device zones (npm run test:tz), so this guards finding H1/P0-3.
describe('formatDay', () => {
  it('formats a calendar day independently of the device timezone', () => {
    expect(formatDay(makeDay(2026, 5, 20))).toBe('20 May 2026');
    expect(formatDay(makeDay(2026, 12, 31))).toBe('31 Dec 2026');
  });
});

describe('formatPeakText', () => {
  const peak = new Date('2026-09-26T16:49:00Z'); // 17:49 BST

  it('names the day in the selected timezone', () => {
    const now = new Date('2026-09-26T08:00:00Z');
    expect(formatPeakText('Full Moon', peak, now, 'Europe/London')).toBe('Full Moon peaks today at 17:49');
  });

  it('says "peaked yesterday" the following day', () => {
    const now = new Date('2026-09-27T08:00:00Z');
    expect(formatPeakText('Full Moon', peak, now, 'Europe/London')).toBe('Full Moon peaked yesterday at 17:49');
  });

  it('crosses the date line correctly', () => {
    // 16:49 UTC is 06:49 on the 27th in Kiritimati (UTC+14).
    const now = new Date('2026-09-26T08:00:00Z'); // 22:00 on the 26th there
    expect(formatPeakText('Full Moon', peak, now, 'Pacific/Kiritimati')).toMatch(/^Full Moon peaks: 27 Sept? 2026 at 06:49$/);
  });
});
