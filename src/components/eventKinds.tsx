import type { ReactNode } from 'react';
import type { CalendarDay } from '@/lib/days';
import type { SpineEvent, SpineEventKind } from '@/lib/events';
import type { Hemisphere } from '@/lib/timezones';
import type { WheelChoice } from '@/lib/wheel';
import { formatDayWithMoment, formatLongDay, formatLongDayAndTime } from '@/lib/format';
import { SIGN_SYMBOLS, type MajorPhaseName, type SabbatName } from '@/lib/names';
import {
  DeipnonDetail,
  MercuryRetroDetail,
  MoonPhaseDetail,
  SabbatDetail,
  VenusDetail,
  ZodiacDetail,
} from './details';

// How each kind of spine event is presented. Adding an event kind means adding
// it to the SpineEvent union in lib/events.ts and one entry here.

export interface EventContext {
  timezone: string;
  hemisphere: Hemisphere; // the timezone's
  wheel: Hemisphere; // the Wheel of the Year followed
  wheelChoice: WheelChoice;
  onWheelChange: (choice: WheelChoice) => void;
}

type EventOf<K extends SpineEventKind> = Extract<SpineEvent, { kind: K }>;

interface KindSpec<K extends SpineEventKind> {
  icon: (event: EventOf<K>) => string;
  title: (event: EventOf<K>) => string;
  /** When it happens, in the selected timezone: shown atop the detail panel. */
  when: (event: EventOf<K>, timezone: string) => string;
  Detail: (props: { event: EventOf<K>; ctx: EventContext }) => ReactNode;
}

const MOON_GLYPHS: Record<MajorPhaseName, string> = {
  'New Moon': '●',
  'First Quarter': '◑',
  'Full Moon': '○',
  'Last Quarter': '◐',
};

// Instants show their date, time and zone; all-day observances only the date.
const instantWhen = (event: { at: Date }, timezone: string) => formatLongDayAndTime(event.at, timezone);
const dayWhen = (event: { day: CalendarDay }) => formatLongDay(event.day);

const SEASON_MOMENTS: Partial<Record<SabbatName, string>> = {
  Ostara: 'equinox',
  Mabon: 'equinox',
  Litha: 'solstice',
  Yule: 'solstice',
};

const EVENT_KINDS: { [K in SpineEventKind]: KindSpec<K> } = {
  'moon-phase': {
    icon: e => MOON_GLYPHS[e.phase],
    title: e => e.phase,
    when: instantWhen,
    Detail: ({ event }) => <MoonPhaseDetail phase={event.phase} />,
  },
  'deipnon': {
    icon: () => '⚸',
    title: () => "Hekate's Deipnon",
    when: dayWhen,
    Detail: () => <DeipnonDetail />,
  },
  'sun-ingress': {
    icon: e => SIGN_SYMBOLS[e.sign],
    title: e => `Sun enters ${e.sign}`,
    when: instantWhen,
    Detail: ({ event }) => <ZodiacDetail sign={event.sign} />,
  },
  'sabbat': {
    icon: () => '☉',
    title: e => e.sabbat.displayName,
    when: ({ day, sabbat }, timezone) => sabbat.at
      ? formatDayWithMoment(day, SEASON_MOMENTS[sabbat.name] ?? 'exact moment', sabbat.at, timezone)
      : formatLongDay(day),
    Detail: ({ event, ctx }) => <SabbatDetail sabbat={event.sabbat.name} ctx={ctx} />,
  },
  'venus-ingress': {
    icon: () => '♀︎',
    title: e => e.retrograde
      ? `Venus re-enters ${e.sign} ${SIGN_SYMBOLS[e.sign]} ℞`
      : `Venus enters ${e.sign} ${SIGN_SYMBOLS[e.sign]}`,
    when: instantWhen,
    Detail: ({ event }) => <VenusDetail sign={event.sign} />,
  },
  'mercury-rx': {
    icon: () => '☿︎',
    title: () => 'Mercury Retrograde ☿℞',
    when: instantWhen,
    Detail: ({ event, ctx }) => <MercuryRetroDetail period={event.period} timezone={ctx.timezone} />,
  },
};

// The mapped type guarantees each entry matches its own kind; TypeScript can't
// correlate `EVENT_KINDS[event.kind]` with `event`, hence the one cast here.
function specFor(event: SpineEvent): KindSpec<SpineEventKind> {
  return EVENT_KINDS[event.kind] as unknown as KindSpec<SpineEventKind>;
}

export const eventIcon = (event: SpineEvent) => specFor(event).icon(event);
export const eventTitle = (event: SpineEvent) => specFor(event).title(event);

export function EventDetail({ event, ctx }: { event: SpineEvent; ctx: EventContext }) {
  const { Detail, when } = specFor(event);
  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary">
        <time dateTime={event.at ? event.at.toISOString() : event.day}>
          {when(event, ctx.timezone)}
        </time>
      </p>
      <Detail event={event} ctx={ctx} />
    </div>
  );
}
