import { getUpcomingMajorPhases } from './moon';
import { getUpcomingSunIngresses } from './astro';
import { getUpcomingSabbats, type Sabbat } from './sabbats';
import {
  getUpcomingVenusIngresses,
  getUpcomingMercuryRetrogrades,
  type MercuryRetrogradePeriod,
} from './planets';
import { addDays, dayOf, type CalendarDay } from './days';
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
  | { kind: 'sun-ingress'; at: Date; sign: SignName }
  | { kind: 'sabbat'; sabbat: Sabbat }
  | { kind: 'venus-ingress'; at: Date; sign: SignName; retrograde: boolean }
  | { kind: 'mercury-rx'; at: Date; period: MercuryRetrogradePeriod }
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

  // Search from a day early so events earlier today, and a Deipnon today for a
  // new moon tomorrow, are found; the day filter below trims the rest.
  const from = new Date(now.getTime() - DAY_MS);
  const to = new Date(now.getTime() + (HORIZON_DAYS + 1) * DAY_MS);

  const phases = getUpcomingMajorPhases(from, to);
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

  for (const ing of getUpcomingSunIngresses(from, to)) {
    events.push({
      kind: 'sun-ingress',
      key: `sun-${ing.sign}-${ing.at.getTime()}`,
      day: dayOf(ing.at, timezone),
      at: ing.at,
      sign: ing.sign,
    });
  }

  for (const s of getUpcomingSabbats(today, through, hemisphere, timezone)) {
    events.push({ kind: 'sabbat', key: `sabbat-${s.name}-${s.day}`, day: s.day, sabbat: s });
  }

  for (const v of getUpcomingVenusIngresses(from, to)) {
    events.push({
      kind: 'venus-ingress',
      key: `venus-${v.sign}-${v.at.getTime()}`,
      day: dayOf(v.at, timezone),
      at: v.at,
      sign: v.sign,
      retrograde: v.retrograde,
    });
  }

  for (const rx of getUpcomingMercuryRetrogrades(from, to)) {
    events.push({
      kind: 'mercury-rx',
      key: `mercury-rx-${rx.retrogradeStart.getTime()}`,
      day: dayOf(rx.retrogradeStart, timezone),
      at: rx.retrogradeStart,
      period: rx,
    });
  }

  // Same day: all-day events first, then timed events in time order.
  const timeOf = (e: SpineEvent) => e.at?.getTime() ?? -Infinity;
  return events
    .filter(e => e.day >= today && e.day <= through)
    .sort((a, b) => a.day.localeCompare(b.day) || timeOf(a) - timeOf(b))
    .slice(0, count);
}
