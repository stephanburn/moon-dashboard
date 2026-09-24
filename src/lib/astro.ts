import { Body, SearchSunLongitude, SunPosition } from 'astronomy-engine';
import { DAY_MS, findSignChanges, HOUR_MS, signAt } from './ephemeris';
import { SIGN_NAMES, type SignName } from './names';

// ── Sun sign ───────────────────────────────────────────────────────────────

export interface SunSignInfo {
  sign: SignName;
  until: Date; // the instant the Sun enters the next sign
}

export interface SunIngress {
  sign: SignName;
  at: Date;
}

// The Sun takes 29–32 days per sign; this comfortably brackets the next ingress.
const SUN_SEARCH_DAYS = 35;

function nextSunIngress(after: Date): SunIngress {
  const idx = Math.floor(SunPosition(after).elon / 30) % 12;
  const nextIdx = (idx + 1) % 12;
  const found = SearchSunLongitude(nextIdx * 30, after, SUN_SEARCH_DAYS);
  if (!found) throw new Error(`No sun ingress found within ${SUN_SEARCH_DAYS} days of ${after.toISOString()}`);
  return { sign: SIGN_NAMES[nextIdx], at: found.date };
}

export function getCurrentSunSign(now: Date): SunSignInfo {
  return { sign: signAt(Body.Sun, now), until: nextSunIngress(now).at };
}

/** Sun sign changes from `from` up to `to`, in order. */
export function getUpcomingSunIngresses(from: Date, to: Date): SunIngress[] {
  const results: SunIngress[] = [];
  for (let ing = nextSunIngress(from); ing.at <= to; ing = nextSunIngress(new Date(ing.at.getTime() + HOUR_MS))) {
    results.push(ing);
  }
  return results;
}

// ── Moon sign ──────────────────────────────────────────────────────────────

export interface MoonSignChange {
  sign: SignName;
  enterTime: Date;
}

export function getCurrentMoonSign(now: Date): SignName {
  return signAt(Body.Moon, now);
}

// The Moon moves at most ~2.1° in 3 hours, so a 3-hour scan can't skip a sign.
const MOON_SCAN_STEP_MS = 3 * HOUR_MS;

/** The next `count` times the Moon changes sign after `from`, to the minute. */
export function getUpcomingMoonSignChanges(from: Date, count = 3): MoonSignChange[] {
  const to = new Date(from.getTime() + (count * 3 + 1) * DAY_MS);
  return findSignChanges(Body.Moon, from, to, MOON_SCAN_STEP_MS)
    .slice(0, count)
    .map(c => ({ sign: c.sign, enterTime: c.at }));
}
