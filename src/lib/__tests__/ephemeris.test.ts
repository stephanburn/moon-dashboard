import { describe, it, expect } from 'vitest';
import { Body } from 'astronomy-engine';
import { getCurrentSunSign, getUpcomingSunIngresses, getCurrentMoonSign, getUpcomingMoonSignChanges } from '../astro';
import { getMercuryStatus, getUpcomingMercuryRetrogrades, getUpcomingVenusIngresses, mercuryRetrogradeSigns } from '../planets';
import { findStations } from '../ephemeris';

// Fixtures are PUBLISHED values, not this code's own output, so these tests
// check the implementation against an independent source. Published station
// times vary between ephemerides by up to several hours (a planet is nearly
// motionless at a station), hence the wider tolerances there.
//
// Sources (retrieved Sep 2026):
// - Seasons 2026: USNO "Earth's Seasons" as reproduced by farmersalmanac.com
//   and trackyouryear.com (14:46, 08:25, 00:05, 20:50 UTC).
// - Mercury Oct 2026: myrahpenaloza.com "Mercury Retrograde October 2026"
//   (Rx 24 Oct 07:12 UTC, D 13 Nov 15:53 UTC, pre-shadow 4 Oct 09:09 UTC,
//   post-shadow to 30 Nov).
// - Venus Oct 2026: astroak.com / theastroacademy.com (Rx 3 Oct 09:15 CEST at
//   8°29' Scorpio, re-enters Libra 25 Oct, D 14 Nov at 22°51' Libra).
// - Venus enters Sagittarius 7 Jan 2027 03:53 EST: cafeastrology.com.
// - Full Moon 26 Sep 2026 12:49 EDT at 3° Aries: cafeastrology.com.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const utc = (iso: string) => new Date(iso + 'Z');
const within = (actual: Date, expected: Date, tolerance: number) =>
  expect(Math.abs(actual.getTime() - expected.getTime()), `${actual.toISOString()} vs ${expected.toISOString()}`)
    .toBeLessThanOrEqual(tolerance);

describe('Sun ingresses (cardinal ingresses = the 2026 seasons)', () => {
  it('matches the published equinox and solstice instants to 2 minutes', () => {
    const ingresses = getUpcomingSunIngresses(utc('2026-01-01T00:00'), utc('2027-01-01T00:00'));
    const at = (sign: string) => ingresses.find(i => i.sign === sign)!.at;
    within(at('Aries'), utc('2026-03-20T14:46'), 2 * MIN);
    within(at('Cancer'), utc('2026-06-21T08:25'), 2 * MIN);
    within(at('Libra'), utc('2026-09-23T00:05'), 2 * MIN);
    within(at('Capricorn'), utc('2026-12-21T20:50'), 2 * MIN);
    expect(ingresses).toHaveLength(12);
  });

  it('reports the current sign and when it ends', () => {
    const info = getCurrentSunSign(utc('2026-09-24T12:00'));
    expect(info.sign).toBe('Libra');
    expect(info.until.toISOString().slice(0, 10)).toBe('2026-10-23'); // Scorpio ingress
  });
});

describe('Moon sign', () => {
  it('puts the 26 Sep 2026 Full Moon (3° Aries) in Aries', () => {
    expect(getCurrentMoonSign(utc('2026-09-26T16:49'))).toBe('Aries');
  });

  it('finds consecutive sign changes 2–3 days apart, in zodiac order', () => {
    const changes = getUpcomingMoonSignChanges(utc('2026-09-24T12:00'), 3);
    expect(changes).toHaveLength(3);
    for (const c of changes) {
      expect(getCurrentMoonSign(new Date(c.enterTime.getTime() - 2 * MIN))).not.toBe(c.sign);
      expect(getCurrentMoonSign(new Date(c.enterTime.getTime() + 2 * MIN))).toBe(c.sign);
    }
    for (let i = 1; i < changes.length; i++) {
      const gap = changes[i].enterTime.getTime() - changes[i - 1].enterTime.getTime();
      expect(gap).toBeGreaterThan(1.8 * DAY);
      expect(gap).toBeLessThan(3 * DAY);
    }
  });
});

describe('Mercury retrograde (Oct–Nov 2026)', () => {
  const [rx] = getUpcomingMercuryRetrogrades(utc('2026-10-01T00:00'), utc('2026-11-01T00:00'));

  it('matches the published stations to 1 hour', () => {
    within(rx.retrogradeStart, utc('2026-10-24T07:12'), HOUR);
    within(rx.retrogradeEnd, utc('2026-11-13T15:53'), HOUR);
    expect(mercuryRetrogradeSigns(rx)).toBe('Scorpio');
  });

  it('matches the published shadow period', () => {
    within(rx.shadowStart, utc('2026-10-04T09:09'), 2 * HOUR);
    expect(rx.shadowEnd.toISOString().slice(0, 10)).toBe('2026-11-30');
  });

  it('reports status through the cycle', () => {
    expect(getMercuryStatus(utc('2026-10-03T12:00')).status).toBe('direct');
    expect(getMercuryStatus(utc('2026-10-10T12:00')).status).toBe('pre-shadow');
    expect(getMercuryStatus(utc('2026-10-30T12:00')).status).toBe('retrograde');
    expect(getMercuryStatus(utc('2026-11-20T12:00')).status).toBe('post-shadow');
    expect(getMercuryStatus(utc('2026-12-05T12:00')).status).toBe('direct');
  });

  it('labels a retrograde that backs into the previous sign (Oct 2027)', () => {
    const [p] = getUpcomingMercuryRetrogrades(utc('2027-09-15T00:00'), utc('2027-10-31T00:00'));
    expect(mercuryRetrogradeSigns(p)).toBe('Scorpio / Libra');
  });
});

describe('Venus (retrograde of Oct–Nov 2026)', () => {
  it('matches the published retrograde station to 1 hour', () => {
    const stations = findStations(Body.Venus, utc('2026-09-01T00:00'), utc('2026-12-31T00:00'));
    expect(stations.map(s => s.kind)).toEqual(['retrograde', 'direct']);
    within(stations[0].at, utc('2026-10-03T07:15'), HOUR);
    expect(stations[1].at.toISOString().slice(0, 10)).toBe('2026-11-14');
  });

  it('includes the retrograde re-entry into Libra and the return to Scorpio', () => {
    const ingresses = getUpcomingVenusIngresses(utc('2026-10-01T00:00'), utc('2027-01-31T00:00'));
    expect(ingresses.map(i => `${i.sign}${i.retrograde ? ' Rx' : ''} ${i.at.toISOString().slice(0, 10)}`)).toEqual([
      'Libra Rx 2026-10-25',
      'Scorpio 2026-12-04',
      'Sagittarius 2027-01-07',
    ]);
    within(ingresses[2].at, utc('2027-01-07T08:53'), 10 * MIN);
  });
});

describe('performance', () => {
  it('computes the planetary windows for a new day quickly', () => {
    const start = performance.now();
    // A day far from any other test's cache entry.
    getUpcomingVenusIngresses(utc('2031-05-01T00:00'), utc('2031-11-01T00:00'));
    getUpcomingMercuryRetrogrades(utc('2031-05-01T00:00'), utc('2031-11-01T00:00'));
    expect(performance.now() - start).toBeLessThan(1500);
  });
});
