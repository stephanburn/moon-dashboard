import { getUpcomingMajorPhases } from './moon';
import { getUpcomingSunIngresses } from './astro';
import { getUpcomingSabbats } from './sabbats';

export type UpcomingEventType = 'moon' | 'ingress' | 'sabbat';

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
}

export function getUpcomingEvents(from: Date, count = 5): UpcomingEvent[] {
  const moonPhases = getUpcomingMajorPhases(from, 6);
  const ingresses  = getUpcomingSunIngresses(from, 10);
  const sabbats    = getUpcomingSabbats(from, 6);

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
      name: s.name,
      icon: '☀️',
      date: s.date,
      key: `sabbat-${s.name}-${s.date.getFullYear()}`,
      sabbatName: s.name,
    })),
  ];

  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}
