import type { ReactNode } from 'react';
import type { SpineEvent, SpineEventKind } from '@/lib/events';
import type { Hemisphere } from '@/lib/timezones';
import { SIGN_SYMBOLS, type MajorPhaseName } from '@/lib/names';
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
  hemisphere: Hemisphere;
}

type EventOf<K extends SpineEventKind> = Extract<SpineEvent, { kind: K }>;

interface KindSpec<K extends SpineEventKind> {
  icon: (event: EventOf<K>) => string;
  title: (event: EventOf<K>) => string;
  Detail: (props: { event: EventOf<K>; ctx: EventContext }) => ReactNode;
}

const MOON_GLYPHS: Record<MajorPhaseName, string> = {
  'New Moon': '●',
  'First Quarter': '◑',
  'Full Moon': '○',
  'Last Quarter': '◐',
};

const EVENT_KINDS: { [K in SpineEventKind]: KindSpec<K> } = {
  'moon-phase': {
    icon: e => MOON_GLYPHS[e.phase],
    title: e => e.phase,
    Detail: ({ event }) => <MoonPhaseDetail phase={event.phase} />,
  },
  'deipnon': {
    icon: () => '⚸',
    title: () => "Hekate's Deipnon",
    Detail: () => <DeipnonDetail />,
  },
  'sun-ingress': {
    icon: e => SIGN_SYMBOLS[e.sign],
    title: e => `Sun enters ${e.sign}`,
    Detail: ({ event }) => <ZodiacDetail sign={event.sign} />,
  },
  'sabbat': {
    icon: () => '☉',
    title: e => e.sabbat.displayName,
    Detail: ({ event, ctx }) => <SabbatDetail sabbat={event.sabbat.name} hemisphere={ctx.hemisphere} />,
  },
  'venus-ingress': {
    icon: () => '♀︎',
    title: e => e.retrograde
      ? `Venus re-enters ${e.sign} ${SIGN_SYMBOLS[e.sign]} ℞`
      : `Venus enters ${e.sign} ${SIGN_SYMBOLS[e.sign]}`,
    Detail: ({ event }) => <VenusDetail sign={event.sign} />,
  },
  'mercury-rx': {
    icon: () => '☿︎',
    title: () => 'Mercury Retrograde ☿℞',
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
  const { Detail } = specFor(event);
  return <Detail event={event} ctx={ctx} />;
}
