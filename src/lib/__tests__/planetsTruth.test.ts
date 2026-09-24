import { describe, it, expect } from 'vitest';
import { Body, GeoVector, Rotation_EQJ_ECT, RotateVector } from 'astronomy-engine';
import { VENUS_INGRESSES, MERCURY_RETROGRADES, getCurrentVenusSign } from '../planets';

// The ordering checks in planets.test.ts can't tell a well-formed table from a
// wrong one. These compare the hand-maintained tables against astronomy-engine
// so that a bad date fails here instead of shipping (review finding P0-1).

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Geocentric apparent ecliptic longitude of date (tropical), in degrees.
function longitude(body: Body, t: number): number {
  const date = new Date(t);
  const ecl = RotateVector(Rotation_EQJ_ECT(date), GeoVector(body, date, true));
  return ((Math.atan2(ecl.y, ecl.x) * 180) / Math.PI + 360) % 360;
}

const signAt = (body: Body, t: number) => SIGNS[Math.floor(longitude(body, t) / 30)];

function dailyMotion(body: Body, t: number): number {
  let d = longitude(body, t + 12 * HOUR) - longitude(body, t - 12 * HOUR);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// Distance in days from `t` to the nearest table ingress.
function daysToNearestIngress(t: number): number {
  return Math.min(...VENUS_INGRESSES.map(v => Math.abs(v.date.getTime() - t))) / DAY;
}

describe('Venus ingress table matches the ephemeris', () => {
  it('gives the true Venus sign on every day of 2025–2027 (±1 day at ingresses)', () => {
    const wrong: string[] = [];
    for (let t = new Date(2025, 0, 1, 12).getTime(); t < new Date(2028, 0, 1).getTime(); t += DAY) {
      const table = getCurrentVenusSign(new Date(t))?.name;
      const truth = signAt(Body.Venus, t);
      if (table !== truth && daysToNearestIngress(t) > 1) {
        wrong.push(`${new Date(t).toDateString()}: table ${table}, ephemeris ${truth}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe('Mercury retrograde table matches the ephemeris', () => {
  it('each stated retrograde start and end is within a day of a real station', () => {
    for (const p of MERCURY_RETROGRADES) {
      // Stations are where daily motion changes sign. Retrograde periods are
      // well inside the stated range; just outside it Mercury is direct.
      const mid = (p.retrogradeStart.getTime() + p.retrogradeEnd.getTime()) / 2;
      expect(dailyMotion(Body.Mercury, mid), `${p.signs}: not retrograde mid-period`).toBeLessThan(0);
      expect(dailyMotion(Body.Mercury, p.retrogradeStart.getTime() - DAY)).toBeGreaterThan(0);
      expect(dailyMotion(Body.Mercury, p.retrogradeStart.getTime() + 2 * DAY)).toBeLessThan(0);
      expect(dailyMotion(Body.Mercury, p.retrogradeEnd.getTime() - DAY)).toBeLessThan(0);
      expect(dailyMotion(Body.Mercury, p.retrogradeEnd.getTime() + 2 * DAY)).toBeGreaterThan(0);
    }
  });

  it('labels each period with the signs of its two stations', () => {
    for (const p of MERCURY_RETROGRADES) {
      const [startSign, endSign = startSign] = p.signs.split(' / ');
      expect(signAt(Body.Mercury, p.retrogradeStart.getTime() + 12 * HOUR)).toBe(startSign);
      expect(signAt(Body.Mercury, p.retrogradeEnd.getTime() + 12 * HOUR)).toBe(endSign);
    }
  });
});
