import { getMoonPhaseInfo, getMoonPhasePeak, type MoonPhaseInfo, type MoonPhasePeak } from './moon';
import {
  getCurrentSunSign,
  getCurrentMoonSign,
  getUpcomingMoonSignChanges,
  type SunSignInfo,
  type MoonSignChange,
} from './astro';
import { getSabbatContext, type Sabbat } from './sabbats';
import { getMercuryStatus, getCurrentVenusSign, type MercuryInfo, type MercuryRetrogradePeriod } from './planets';
import { getUpcomingEvents, type SpineEvent } from './events';
import { getCraftContext, type CraftContext } from './craft';
import { dayOf, type CalendarDay } from './days';
import { formatDay, formatPeakText } from './format';
import { hemisphereFromTimezone, type Hemisphere } from './timezones';
import type { SignName } from './names';

/** A Mercury period under way whose retrograde station has already passed. */
export interface MercuryNow {
  status: 'retrograde' | 'post-shadow';
  period: MercuryRetrogradePeriod;
  until: Date; // end of the current stage
}

/** Everything the dashboard shows, for one instant as seen from one timezone. */
export interface DashboardModel {
  timezone: string;
  hemisphere: Hemisphere;
  today: CalendarDay;
  todayLabel: string; // "Thu 24 Sept"
  moon: MoonPhaseInfo;
  moonPeak: MoonPhasePeak;
  moonPeakText: string;
  moonSign: SignName;
  moonSignChanges: MoonSignChange[];
  sunSign: SunSignInfo;
  venusSign: SignName;
  mercury: MercuryInfo;
  mercuryNow: MercuryNow | null;
  sabbatToday: Sabbat | null;
  events: SpineEvent[];
  craft: CraftContext;
}

const SPINE_EVENT_COUNT = 8;

// Two peaks of the same phase within this window are the same event.
const SAME_PEAK_WINDOW_MS = 3 * 86_400_000;

// Once Mercury stations retrograde its spine event is in the past, so the Now
// node carries the period until the shadow clears. Before the station, the
// upcoming retrograde event on the spine covers the pre-shadow.
function getMercuryNow({ status, period }: MercuryInfo): MercuryNow | null {
  if (!period) return null;
  if (status === 'retrograde') return { status, period, until: period.retrogradeEnd };
  if (status === 'post-shadow') return { status, period, until: period.shadowEnd };
  return null;
}

export function buildDashboardModel(now: Date, timezone: string): DashboardModel {
  const hemisphere = hemisphereFromTimezone(timezone, now);
  const today = dayOf(now, timezone);
  const moon = getMoonPhaseInfo(now);
  const moonPeak = getMoonPhasePeak(now, moon.name);

  // The hero already announces the current/next phase peak, so drop the spine
  // node for that same peak. Fetch one extra event to keep the spine full.
  const upcoming = getUpcomingEvents(now, timezone, hemisphere, SPINE_EVENT_COUNT + 1);
  const heroPeakIndex = upcoming.findIndex(e =>
    e.kind === 'moon-phase'
    && e.phase === moonPeak.phaseName
    && Math.abs(e.at.getTime() - moonPeak.peakTime.getTime()) <= SAME_PEAK_WINDOW_MS,
  );
  const events = upcoming.filter((_, i) => i !== heroPeakIndex).slice(0, SPINE_EVENT_COUNT);
  const mercury = getMercuryStatus(now);

  return {
    timezone,
    hemisphere,
    today,
    todayLabel: formatDay(today, { weekday: 'short', day: 'numeric', month: 'short' }),
    moon,
    moonPeak,
    moonPeakText: formatPeakText(moonPeak.phaseName, moonPeak.peakTime, now, timezone),
    moonSign: getCurrentMoonSign(now),
    moonSignChanges: getUpcomingMoonSignChanges(now, 3),
    sunSign: getCurrentSunSign(now),
    venusSign: getCurrentVenusSign(now),
    mercury,
    mercuryNow: getMercuryNow(mercury),
    sabbatToday: getSabbatContext(today, hemisphere, timezone).today,
    events,
    craft: getCraftContext(now, timezone, hemisphere),
  };
}
