import { getMoonPhaseInfo, getMoonPhasePeak, type MoonPhaseInfo, type MoonPhasePeak } from './moon';
import {
  getCurrentSunSign,
  getCurrentMoonSign,
  getUpcomingMoonSignChanges,
  type SunSignInfo,
  type MoonSignChange,
} from './astro';
import { getSabbatContext, type Sabbat } from './sabbats';
import { getMercuryStatus, getCurrentVenusSign, type MercuryInfo } from './planets';
import { getUpcomingEvents, type SpineEvent } from './events';
import { dayOf, type CalendarDay } from './days';
import { formatDay, formatPeakText } from './format';
import { hemisphereFromTimezone, type Hemisphere } from './timezones';
import type { SignName } from './names';

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
  venusSign: SignName | null;
  mercury: MercuryInfo;
  sabbatToday: Sabbat | null;
  events: SpineEvent[];
}

const SPINE_EVENT_COUNT = 8;

// Two peaks of the same phase within this window are the same event.
const SAME_PEAK_WINDOW_MS = 3 * 86_400_000;

export function buildDashboardModel(now: Date, timezone: string): DashboardModel {
  const hemisphere = hemisphereFromTimezone(timezone);
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
    sunSign: getCurrentSunSign(today),
    venusSign: getCurrentVenusSign(today),
    mercury: getMercuryStatus(today),
    sabbatToday: getSabbatContext(today, hemisphere).today,
    events,
  };
}
