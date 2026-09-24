import { describe, it, expect } from 'vitest';
import { getUpcomingEvents, type SpineEvent } from '../events';
import { dayOf } from '../days';
import { formatRelativeDays } from '../format';

// A plain-text line per event, independent of the React presentation layer.
function describeEvent(e: SpineEvent): string {
  switch (e.kind) {
    case 'moon-phase': return e.phase;
    case 'deipnon': return "Hekate's Deipnon";
    case 'sun-ingress': return `Sun enters ${e.sign}`;
    case 'sabbat': return e.sabbat.displayName;
    case 'venus-ingress': return `Venus ${e.retrograde ? 're-enters' : 'enters'} ${e.sign}`;
    case 'mercury-rx': return 'Mercury Retrograde';
    case 'data-expiry': return 'Data expiry';
  }
}

function spine(iso: string, tz: string, hemisphere: 'north' | 'south'): string[] {
  const now = new Date(iso);
  const today = dayOf(now, tz);
  return getUpcomingEvents(now, tz, hemisphere, 8)
    .map(e => `${describeEvent(e)} | ${formatRelativeDays(e.day, today)}`);
}

// Characterisation: the spine's content for fixed instants, captured before the
// day-model refactor. The whole suite also runs under several device zones
// (npm run test:tz); these results must not change with the device zone.
describe('getUpcomingEvents', () => {
  it('matches the known spine for 24 Sep 2026, London', () => {
    expect(spine('2026-09-24T12:00:00Z', 'Europe/London', 'north')).toEqual([
      'Full Moon | in 2 days',
      'Last Quarter | in 9 days',
      "Hekate's Deipnon | in 2 weeks",
      'New Moon | in 2 weeks',
      'First Quarter | in 3 weeks',
      'Sun enters Scorpio | in 4 weeks',
      'Mercury Retrograde | in 4 weeks',
      'Venus re-enters Libra | in 4 weeks',
    ]);
  });

  it('matches the known spine for 20 Dec 2026, Sydney (southern wheel)', () => {
    expect(spine('2026-12-20T12:00:00Z', 'Australia/Sydney', 'south')).toEqual([
      'Summer Solstice (Litha) | Tomorrow',
      'Sun enters Capricorn | in 2 days',
      'Full Moon | in 4 days',
      'Last Quarter | in 11 days',
      "Hekate's Deipnon | in 3 weeks",
      'Venus enters Sagittarius | in 3 weeks',
      'New Moon | in 3 weeks',
      'First Quarter | in 4 weeks',
    ]);
  });

  it('matches the known spine for the eve of Samhain, London', () => {
    expect(spine('2026-10-30T20:00:00Z', 'Europe/London', 'north')).toEqual([
      'Samhain | Tomorrow',
      'Last Quarter | in 2 days',
      "Hekate's Deipnon | in 9 days",
      'New Moon | in 10 days',
      'First Quarter | in 3 weeks',
      'Sun enters Sagittarius | in 3 weeks',
      'Full Moon | in 4 weeks',
      'Last Quarter | in 5 weeks',
    ]);
  });

  // Review finding P0-3: with a London device and New York selected, Samhain
  // two days away was shown as "Tomorrow".
  it('counts calendar days in the selected zone, whatever the device zone', () => {
    const now = new Date('2026-10-29T12:00:00Z');
    for (const tz of ['Europe/London', 'America/New_York', 'Pacific/Honolulu', 'Asia/Tokyo']) {
      const samhain = getUpcomingEvents(now, tz, 'north', 8).find(e => e.kind === 'sabbat');
      expect(samhain && formatRelativeDays(samhain.day, dayOf(now, tz)), tz).toBe('in 2 days');
    }
  });

  it('keeps timed events earlier today and orders same-day events by time', () => {
    const events = getUpcomingEvents(new Date('2026-09-26T20:00:00Z'), 'Europe/London', 'north', 3);
    // The Full Moon peaked at 17:49 BST on the 26th, earlier the same day.
    expect(events[0].kind).toBe('moon-phase');
    expect(events[0].day).toBe('2026-09-26');
  });
});
