import { describe, it, expect } from 'vitest';
import { getCurrentSunSign } from '../astro';
import { formatCalendarDate } from '../format';

// Transit boundaries are calendar dates ("this day") and must read the same in
// every timezone. formatCalendarDate is timezone-independent by design; this
// guards against regressing to the old pattern that applied the viewer's
// selected zone and rolled western viewers back a day (review finding H1).
describe('sun-sign transit dates are timezone-independent (H1)', () => {
  it('formats the Taurus transit-end as 20 May 2026', () => {
    const info = getCurrentSunSign(new Date(2026, 4, 15)); // mid-Taurus
    expect(info.sign.name).toBe('Taurus');
    expect(formatCalendarDate(info.transitEnd)).toBe('20 May 2026');
  });

  // The previous bug only surfaced when the device timezone differed from the
  // selected one. A calendar date round-trips through device-local time, so it
  // must stay stable no matter what timezone the device itself is in.
  it('stays stable across device timezones', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'Pacific/Honolulu'; // UTC-10
      const west = formatCalendarDate(getCurrentSunSign(new Date(2026, 4, 15)).transitEnd);
      process.env.TZ = 'Pacific/Auckland'; // UTC+13
      const east = formatCalendarDate(getCurrentSunSign(new Date(2026, 4, 15)).transitEnd);
      expect(west).toBe('20 May 2026');
      expect(east).toBe('20 May 2026');
    } finally {
      process.env.TZ = original;
    }
  });
});
