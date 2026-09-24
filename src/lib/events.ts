import { getUpcomingMajorPhases } from './moon';
import { getUpcomingSunIngresses } from './astro';
import { getUpcomingSabbats, type Sabbat } from './sabbats';
import {
  getUpcomingVenusIngresses,
  getUpcomingMercuryRetrogrades,
  type MercuryRetrogradePeriod,
} from './planets';
import { PLANET_DATA_EXPIRY } from './config';
import { addDays, dayOf, diffDays, type CalendarDay } from './days';
import type { MajorPhaseName, SignName } from './names';
import type { Hemisphere } from './timezones';

// Every event on the cycle spine. `day` is the calendar day in the viewer's
// selected timezone; `at` is the exact instant for events that have one.
// Presentation (icon, title, detail panel) lives in components/eventKinds.tsx.
interface EventBase {
  key: string;
  day: CalendarDay;
  at?: Date;
}

export type SpineEvent = EventBase & (
  | { kind: 'moon-phase'; at: Date; phase: MajorPhaseName }
  | { kind: 'deipnon'; newMoonAt: Date }
  | { kind: 'sun-ingress'; sign: SignName }
  | { kind: 'sabbat'; sabbat: Sabbat }
  | { kind: 'venus-ingress'; sign: SignName; retrograde: boolean }
  | { kind: 'mercury-rx'; period: MercuryRetrogradePeriod }
  | { kind: 'data-expiry' }
);

export type SpineEventKind = SpineEvent['kind'];

const HORIZON_DAYS = 180;
const DAY_MS = 86_400_000;

/**
 * The next `count` events from `now`, as seen from `timezone`. Events earlier
 * today are kept (they read as "Today"), except today's sabbat, which the Now
 * node announces instead.
 */
export function getUpcomingEvents(
  now: Date,
  timezone: string,
  hemisphere: Hemisphere,
  count = 8,
): SpineEvent[] {
  const today = dayOf(now, timezone);
  const through = addDays(today, HORIZON_DAYS);
  const events: SpineEvent[] = [];

  // Start a day early so phases earlier today, and a Deipnon today for a new
  // moon tomorrow, are both found; the day filter below trims the rest.
  const phases = getUpcomingMajorPhases(
    new Date(now.getTime() - DAY_MS),
    new Date(now.getTime() + (HORIZON_DAYS + 1) * DAY_MS),
  );
  for (const p of phases) {
    events.push({
      kind: 'moon-phase',
      key: `moon-${p.name}-${p.date.getTime()}`,
      day: dayOf(p.date, timezone),
      at: p.date,
      phase: p.name,
    });
    if (p.name === 'New Moon') {
      // The Deipnon is kept on the dark-moon night before the new moon.
      const day = addDays(dayOf(p.date, timezone), -1);
      events.push({ kind: 'deipnon', key: `deipnon-${day}`, day, newMoonAt: p.date });
    }
  }

  for (const ing of getUpcomingSunIngresses(today, through)) {
    events.push({ kind: 'sun-ingress', key: `sun-${ing.sign}-${ing.day}`, day: ing.day, sign: ing.sign });
  }

  for (const s of getUpcomingSabbats(today, through, hemisphere)) {
    events.push({ kind: 'sabbat', key: `sabbat-${s.name}-${s.day}`, day: s.day, sabbat: s });
  }

  for (const v of getUpcomingVenusIngresses(today, through)) {
    events.push({
      kind: 'venus-ingress',
      key: `venus-${v.sign}-${v.day}`,
      day: v.day,
      sign: v.sign,
      retrograde: v.retrograde,
    });
  }

  for (const rx of getUpcomingMercuryRetrogrades(today, through)) {
    events.push({ kind: 'mercury-rx', key: `mercury-rx-${rx.retrogradeStart}`, day: rx.retrogradeStart, period: rx });
  }

  if (diffDays(PLANET_DATA_EXPIRY, today) <= 90) {
    events.push({ kind: 'data-expiry', key: 'data-expiry', day: PLANET_DATA_EXPIRY });
  }

  // Same day: all-day events first, then timed events in time order.
  const timeOf = (e: SpineEvent) => e.at?.getTime() ?? -Infinity;
  return events
    .filter(e => e.day >= today && e.day <= through)
    .sort((a, b) => a.day.localeCompare(b.day) || timeOf(a) - timeOf(b))
    .slice(0, count);
}
