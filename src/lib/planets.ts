import { Body } from 'astronomy-engine';
import {
  DAY_MS,
  HOUR_MS,
  findLongitudeCrossing,
  findSignChanges,
  findStations,
  signAt,
  type SignChange,
} from './ephemeris';
import type { SignName } from './names';

// Mercury retrogrades and Venus ingresses, computed from astronomy-engine.
//
// Each search covers a window around the current UTC day and is cached for
// that day, so the dashboard's periodic refresh costs almost nothing.

// Back far enough to find the retrograde behind a shadow period in progress;
// ahead far enough to cover the spine's 180-day horizon.
const WINDOW_BACK_DAYS = 45;
const WINDOW_AHEAD_DAYS = 190;

function windowFor(t: Date): { key: number; from: Date; to: Date } {
  const key = Math.floor(t.getTime() / DAY_MS) * DAY_MS;
  return {
    key,
    from: new Date(key - WINDOW_BACK_DAYS * DAY_MS),
    to: new Date(key + WINDOW_AHEAD_DAYS * DAY_MS),
  };
}

function cachedByDay<T>(compute: (from: Date, to: Date) => T): (t: Date) => T {
  const cache = new Map<number, T>();
  return (t: Date) => {
    const { key, from, to } = windowFor(t);
    let value = cache.get(key);
    if (value === undefined) {
      if (cache.size > 3) cache.clear();
      value = compute(from, to);
      cache.set(key, value);
    }
    return value;
  };
}

// Both planets are scanned twice a day: fast enough that Mercury can't cross
// a sign, or loop back over a cusp at a station, between samples.
const PLANET_SCAN_STEP_MS = 12 * HOUR_MS;

// ── Mercury retrograde ─────────────────────────────────────────────────────

export interface MercuryRetrogradePeriod {
  shadowStart: Date;     // Mercury first reaches the longitude where it will turn direct
  retrogradeStart: Date; // stations retrograde
  retrogradeEnd: Date;   // stations direct
  shadowEnd: Date;       // Mercury gets back to the longitude where it turned retrograde
  stationSign: SignName; // sign at the retrograde station
  directSign: SignName;  // sign at the direct station
}

/** "Scorpio", or "Scorpio / Libra" when the retrograde backs into another sign. */
export function mercuryRetrogradeSigns(p: MercuryRetrogradePeriod): string {
  return p.stationSign === p.directSign ? p.stationSign : `${p.stationSign} / ${p.directSign}`;
}

// Mercury's shadow runs up to ~5 weeks either side of the retrograde.
const SHADOW_SEARCH_DAYS = 50;

const mercuryPeriods = cachedByDay((from, to): MercuryRetrogradePeriod[] => {
  const stations = findStations(
    Body.Mercury,
    new Date(from.getTime() - SHADOW_SEARCH_DAYS * DAY_MS),
    new Date(to.getTime() + SHADOW_SEARCH_DAYS * DAY_MS),
  );
  const periods: MercuryRetrogradePeriod[] = [];
  stations.forEach((rx, i) => {
    const direct = stations[i + 1];
    if (rx.kind !== 'retrograde' || direct?.kind !== 'direct') return;
    const shadowStart = findLongitudeCrossing(
      Body.Mercury, direct.longitude, new Date(rx.at.getTime() - SHADOW_SEARCH_DAYS * DAY_MS), rx.at,
    );
    const shadowEnd = findLongitudeCrossing(
      Body.Mercury, rx.longitude, direct.at, new Date(direct.at.getTime() + SHADOW_SEARCH_DAYS * DAY_MS),
    );
    if (!shadowStart || !shadowEnd) return;
    periods.push({
      shadowStart,
      retrogradeStart: rx.at,
      retrogradeEnd: direct.at,
      shadowEnd,
      stationSign: signAt(Body.Mercury, rx.at),
      directSign: signAt(Body.Mercury, direct.at),
    });
  });
  return periods;
});

export type MercuryStatus = 'retrograde' | 'pre-shadow' | 'post-shadow' | 'direct';

export interface MercuryInfo {
  status: MercuryStatus;
  period: MercuryRetrogradePeriod | null;
}

export function getMercuryStatus(now: Date): MercuryInfo {
  for (const period of mercuryPeriods(now)) {
    if (now >= period.retrogradeStart && now < period.retrogradeEnd) return { status: 'retrograde', period };
    if (now >= period.shadowStart && now < period.retrogradeStart) return { status: 'pre-shadow', period };
    if (now >= period.retrogradeEnd && now < period.shadowEnd) return { status: 'post-shadow', period };
  }
  return { status: 'direct', period: null };
}

/** Retrogrades that begin between `from` and `to`. */
export function getUpcomingMercuryRetrogrades(from: Date, to: Date): MercuryRetrogradePeriod[] {
  return mercuryPeriods(from).filter(p => p.retrogradeStart >= from && p.retrogradeStart <= to);
}

// ── Venus ──────────────────────────────────────────────────────────────────

export type VenusIngress = SignChange; // { at, sign, retrograde }

const venusIngresses = cachedByDay((from, to) =>
  findSignChanges(Body.Venus, from, to, PLANET_SCAN_STEP_MS));

export function getCurrentVenusSign(now: Date): SignName {
  return signAt(Body.Venus, now);
}

/** Venus sign changes between `from` and `to`, including retrograde re-entries. */
export function getUpcomingVenusIngresses(from: Date, to: Date): VenusIngress[] {
  return venusIngresses(from).filter(v => v.at >= from && v.at <= to);
}
