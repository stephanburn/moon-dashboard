import {
  Body,
  EclipticGeoMoon,
  GeoVector,
  RotateVector,
  Rotation_EQJ_ECT,
  SunPosition,
} from 'astronomy-engine';
import { SIGN_NAMES, type SignName } from './names';

// Generic searches over geocentric ecliptic longitude: sign changes, stations
// (where a planet turns retrograde or direct) and longitude crossings. Built on
// astronomy-engine, so nothing here expires or needs hand-maintained tables.

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
const MINUTE_MS = 60 * 1000;

/**
 * Geocentric apparent ecliptic longitude of date (the tropical zodiac), in
 * degrees 0–360.
 */
export function eclipticLongitude(body: Body, t: Date): number {
  if (body === Body.Sun) return SunPosition(t).elon;
  if (body === Body.Moon) return EclipticGeoMoon(t).lon;
  const ecl = RotateVector(Rotation_EQJ_ECT(t), GeoVector(body, t, true));
  return ((Math.atan2(ecl.y, ecl.x) * 180) / Math.PI + 360) % 360;
}

const signIndexOf = (lon: number) => Math.floor(lon / 30) % 12;

export function signAt(body: Body, t: Date): SignName {
  return SIGN_NAMES[signIndexOf(eclipticLongitude(body, t))];
}

/** Signed angular difference a − b, wrapped to (−180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Apparent motion in degrees per day; negative while retrograde. */
export function dailyMotion(body: Body, t: Date): number {
  const before = eclipticLongitude(body, new Date(t.getTime() - HOUR_MS));
  const after = eclipticLongitude(body, new Date(t.getTime() + HOUR_MS));
  return angleDiff(after, before) * 12;
}

/**
 * Narrow [lo, hi] to within a minute of where `changed` first becomes true,
 * given changed(lo) is false and changed(hi) is true.
 */
function bisect(changed: (t: number) => boolean, lo: number, hi: number): Date {
  while (hi - lo > MINUTE_MS) {
    const mid = (lo + hi) / 2;
    if (changed(mid)) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}

export interface SignChange {
  at: Date;
  sign: SignName;      // the sign being entered
  retrograde: boolean; // entered while moving backwards
}

/**
 * Every sign change between `from` and `to`. `stepMs` must be shorter than the
 * body's fastest time through a sign and than any retrograde loop across a
 * cusp: 3 h for the Moon, 12 h for Mercury, 1 day for Venus and the Sun.
 */
export function findSignChanges(body: Body, from: Date, to: Date, stepMs: number): SignChange[] {
  const results: SignChange[] = [];
  const signIndex = (t: number) => signIndexOf(eclipticLongitude(body, new Date(t)));
  let prevT = from.getTime();
  let prevIdx = signIndex(prevT);
  for (let t = prevT + stepMs; t < to.getTime() + stepMs; t += stepMs) {
    const idx = signIndex(t);
    if (idx !== prevIdx) {
      const startIdx = prevIdx;
      const at = bisect(x => signIndex(x) !== startIdx, prevT, t);
      if (at <= to) {
        results.push({ at, sign: SIGN_NAMES[idx], retrograde: dailyMotion(body, at) < 0 });
      }
      prevIdx = idx;
    }
    prevT = t;
  }
  return results;
}

export interface Station {
  at: Date;
  kind: 'retrograde' | 'direct'; // the motion the planet turns to
  longitude: number;
}

/** Every station between `from` and `to`, scanning daily. */
export function findStations(body: Body, from: Date, to: Date): Station[] {
  const results: Station[] = [];
  const direction = (t: number) => Math.sign(dailyMotion(body, new Date(t)));
  let prevT = from.getTime();
  let prevDir = direction(prevT);
  for (let t = prevT + DAY_MS; t < to.getTime() + DAY_MS; t += DAY_MS) {
    const dir = direction(t);
    if (dir !== prevDir && dir !== 0) {
      const startDir = prevDir;
      const at = bisect(x => direction(x) !== startDir, prevT, t);
      if (at <= to) {
        results.push({
          at,
          kind: dir < 0 ? 'retrograde' : 'direct',
          longitude: eclipticLongitude(body, at),
        });
      }
      prevDir = dir;
    }
    prevT = t;
  }
  return results;
}

/**
 * The first time in [from, to] that `body`, moving direct, passes `longitude`.
 * Used for the edges of a retrograde's shadow.
 */
export function findLongitudeCrossing(
  body: Body,
  longitude: number,
  from: Date,
  to: Date,
  stepMs = 6 * HOUR_MS,
): Date | null {
  const offset = (t: number) => angleDiff(eclipticLongitude(body, new Date(t)), longitude);
  let prevT = from.getTime();
  let prev = offset(prevT);
  for (let t = prevT + stepMs; t <= to.getTime(); t += stepMs) {
    const cur = offset(t);
    // Crossing from just behind to just ahead; ignore the ±180° wrap.
    if (prev < 0 && cur >= 0 && cur - prev < 90) {
      return bisect(x => offset(x) >= 0, prevT, t);
    }
    prevT = t;
    prev = cur;
  }
  return null;
}
