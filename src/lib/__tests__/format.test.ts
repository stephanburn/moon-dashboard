import { describe, it, expect } from 'vitest';
import { formatDay, formatDayAndTime, formatPeakText, formatRelativeDays, formatTime } from '../format';
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

// When clocks go back an hour of wall-clock time repeats, so a bare "01:30" is
// ambiguous. Times in that hour carry the zone; all others stay bare.
describe('formatTime around daylight saving changes', () => {
  it('labels both passes through the repeated hour (London, 25 Oct 2026)', () => {
    expect(formatTime(new Date('2026-10-25T00:30:00Z'), 'Europe/London')).toBe('01:30 BST');
    expect(formatTime(new Date('2026-10-25T01:30:00Z'), 'Europe/London')).toBe('01:30 GMT');
  });

  it('labels the real Halifax case: Moon enters Leo, 1 Nov 2026', () => {
    expect(formatTime(new Date('2026-11-01T04:18:45Z'), 'America/Halifax')).toBe('01:18 GMT-3');
    expect(formatTime(new Date('2026-11-01T05:18:45Z'), 'America/Halifax')).toBe('01:18 GMT-4');
  });

  it('handles the 30-minute shift on Lord Howe Island', () => {
    expect(formatTime(new Date('2027-04-03T14:45:00Z'), 'Australia/Lord_Howe')).toBe('01:45 GMT+11');
    expect(formatTime(new Date('2027-04-03T15:15:00Z'), 'Australia/Lord_Howe')).toBe('01:45 GMT+10:30');
  });

  it('leaves ordinary times and the skipped spring-forward hour unlabelled', () => {
    expect(formatTime(new Date('2026-09-26T16:49:00Z'), 'Europe/London')).toBe('17:49');
    expect(formatTime(new Date('2027-03-28T00:59:00Z'), 'Europe/London')).toBe('00:59');
    expect(formatTime(new Date('2027-03-28T01:00:00Z'), 'Europe/London')).toBe('02:00');
  });

  it('never shows two different instants the same way across a changeover night', () => {
    const zones = ['Europe/London', 'America/New_York', 'America/Halifax', 'Australia/Sydney',
      'Pacific/Auckland', 'America/Santiago', 'Australia/Lord_Howe', 'Africa/Casablanca'];
    const HOUR = 3_600_000;
    let changeovers = 0;
    for (const tz of zones) {
      // Find each changeover in the year (the wall-clock hour stops advancing
      // by exactly one), then check every quarter hour for 3 hours either side:
      // each displayed "day, time" must be unique.
      const hourOf = (t: number) => Number(new Date(t).toLocaleString('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }));
      for (let t = Date.parse('2026-09-26T00:00:00Z'); t < Date.parse('2027-09-26T00:00:00Z'); t += HOUR) {
        if ((hourOf(t) + 1) % 24 === hourOf(t + HOUR)) continue;
        changeovers++;
        const seen = new Map<string, string>();
        for (let s = t - 3 * HOUR; s <= t + 3 * HOUR; s += 15 * 60_000) {
          const shown = formatDayAndTime(new Date(s), tz);
          const clash = seen.get(shown);
          expect(clash, `${tz}: ${new Date(s).toISOString()} and ${clash} both show as "${shown}"`).toBeUndefined();
          seen.set(shown, new Date(s).toISOString());
        }
      }
    }
    expect(changeovers).toBeGreaterThanOrEqual(14); // 7 DST zones × 2, plus Casablanca's Ramadan shifts
  });
});
