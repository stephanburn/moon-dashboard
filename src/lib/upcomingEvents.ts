import { getUpcomingMajorPhases } from './moon';
import { getUpcomingSunIngresses } from './astro';
import { getUpcomingSabbats } from './sabbats';
import { getUpcomingVenusIngresses, getUpcomingMercuryRetrogrades } from './planets';

export type UpcomingEventType = 'moon' | 'ingress' | 'sabbat' | 'venus' | 'mercury-retrograde';

export interface UpcomingEvent {
  type: UpcomingEventType;
  name: string;
  icon: string;
  date: Date;
  key: string;
  // For detail panel lookup
  moonPhaseName?: string;
  zodiacSignName?: string;
  sabbatName?: string;
  venusSignName?: string;
  mercuryRetroSigns?: string;
  mercuryRetroSignFlavour?: string;
}

export function getUpcomingEvents(
  from: Date,
  count = 5,
  hemisphere: 'north' | 'south' = 'north',
): UpcomingEvent[] {
  const moonPhases  = getUpcomingMajorPhases(from, 6);
  const ingresses   = getUpcomingSunIngresses(from, 10);
  const sabbats     = getUpcomingSabbats(from, 6, hemisphere);
  const venusEvents = getUpcomingVenusIngresses(from, 14);
  const mercuryRx   = getUpcomingMercuryRetrogrades(from, 6);

  const events: UpcomingEvent[] = [
    ...moonPhases.map(p => ({
      type: 'moon' as const,
      name: p.name,
      icon: p.emoji,
      date: p.date,
      key: `moon-${p.name}-${p.date.getTime()}`,
      moonPhaseName: p.name,
    })),
    ...ingresses.map(ing => ({
      type: 'ingress' as const,
      name: `Sun enters ${ing.sign.name}`,
      icon: ing.sign.symbol,
      date: ing.date,
      key: `ingress-${ing.sign.name}-${ing.date.getTime()}`,
      zodiacSignName: ing.sign.name,
    })),
    ...sabbats.map(s => ({
      type: 'sabbat' as const,
      name: s.displayName,         // shown in the Coming Up list
      icon: '☀️',
      date: s.date,
      key: `sabbat-${s.name}-${s.date.getFullYear()}`,
      sabbatName: s.name,          // key for SABBAT_CORRESPONDENCES lookup
    })),
    ...venusEvents.map(v => ({
      type: 'venus' as const,
      name: `Venus enters ${v.sign.name} ${v.sign.symbol}`,
      icon: '♀',
      date: v.date,
      key: `venus-${v.sign.name}-${v.date.getTime()}`,
      venusSignName: v.sign.name,
    })),
    ...mercuryRx.map(rx => ({
      type: 'mercury-retrograde' as const,
      name: `Mercury Retrograde ☿℞`,
      icon: '☿',
      date: rx.retrogradeStart,
      key: `mercury-rx-${rx.retrogradeStart.getTime()}`,
      mercuryRetroSigns: rx.signs,
      mercuryRetroSignFlavour: rx.signFlavour,
    })),
  ];

  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}
