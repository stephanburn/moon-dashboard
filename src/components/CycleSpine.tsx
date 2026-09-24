'use client';

import Chevron from './Chevron';
import DetailPanel from './DetailPanel';
import { SabbatDetail, VenusDetail, ZodiacDetail } from './details';
import { EventDetail, eventIcon, eventTitle, type EventContext } from './eventKinds';
import type { SpineEvent } from '@/lib/events';
import type { SunSignInfo } from '@/lib/astro';
import type { Sabbat } from '@/lib/sabbats';
import { dayOf, type CalendarDay } from '@/lib/days';
import { SIGN_SYMBOLS, type SignName } from '@/lib/names';
import { formatDay, formatRelativeDays } from '@/lib/format';

// Rail geometry — kept in one place so the connector segments meet the dots.
const DOT_CENTER = 19.5; // px from a node's top edge to the vertical centre of its dot

interface Props {
  today: CalendarDay;
  todayLabel: string;
  sunSign: SunSignInfo;
  venusSign: SignName;
  sabbatToday: Sabbat | null;
  events: SpineEvent[];
  ctx: EventContext;
  expandedKey: string | null;
  /** `kind` names what was opened (for analytics); `key` identifies the item. */
  onToggle: (key: string, kind: string) => void;
  onClose: () => void;
  /** Bounce the first event's chevron once, to teach first-time visitors. */
  nudge: boolean;
}

// ── Rail primitives ─────────────────────────────────────────────────────────
// A node row: reserves a left gutter for the connector + dot, then its content.
// `isFirst` trims the line above the Now dot; `isLast` trims it below the final dot.

function Node({
  isFirst = false,
  isLast = false,
  now = false,
  children,
}: {
  isFirst?: boolean;
  isLast?: boolean;
  now?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-9 pb-4 last:pb-0">
      <span
        className="spine-connector"
        aria-hidden
        style={{
          top: isFirst ? DOT_CENTER : 0,
          bottom: isLast ? 'auto' : 0,
          height: isLast ? DOT_CENTER : undefined,
        }}
      />
      <span className={`spine-dot${now ? ' spine-dot-now' : ''}`} aria-hidden style={{ top: DOT_CENTER }} />
      {children}
    </li>
  );
}

// ── Cycle spine ─────────────────────────────────────────────────────────────

export default function CycleSpine({
  today,
  todayLabel,
  sunSign,
  venusSign,
  sabbatToday,
  events,
  ctx,
  expandedKey,
  onToggle,
  onClose,
  nudge,
}: Props) {

  return (
    <div className="card mx-auto w-full p-5 sm:p-6">
      <ol className="list-none m-0 p-0">

        {/* ── Now node ── */}
        <Node isFirst now isLast={events.length === 0}>
          <div className="flex items-baseline gap-3">
            <p className="flex-1 text-xs tracking-[0.2em] uppercase text-amber-light/80">Now</p>
            <span className="text-xs text-text-tertiary whitespace-nowrap">{todayLabel}</span>
          </div>

          <div className="mt-2 -ml-2 mr-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle('sunSign', 'sun-sign')}
              aria-expanded={expandedKey === 'sunSign'}
              aria-controls="spine-panel-sun"
              className="inline-flex items-center gap-2 text-left disclosure-base disclosure-row rounded-xl px-3 py-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
            >
              <span className="text-sm text-foreground">
                <span className="text-text-tertiary">Sun in</span>{' '}
                <span className="whitespace-nowrap"><span className="text-amber-light">{SIGN_SYMBOLS[sunSign.sign]}</span> {sunSign.sign}</span>
                <span className="text-text-tertiary whitespace-nowrap"> · until {formatDay(dayOf(sunSign.until, ctx.timezone))}</span>
              </span>
              <Chevron open={expandedKey === 'sunSign'} />
            </button>

            <button
              type="button"
              onClick={() => onToggle('venusNow', 'venus-sign')}
              aria-expanded={expandedKey === 'venusNow'}
              aria-controls="spine-panel-venus"
              className="inline-flex items-center gap-2 text-left disclosure-base disclosure-row rounded-xl px-3 py-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
            >
              <span className="text-sm text-foreground">
                <span className="text-text-tertiary">Venus in</span>{' '}
                <span className="text-amber-light/80">{SIGN_SYMBOLS[venusSign]}</span> {venusSign}
              </span>
              <Chevron open={expandedKey === 'venusNow'} />
            </button>
          </div>

          {expandedKey === 'sunSign' && (
            <DetailPanel id="spine-panel-sun" onClose={onClose}>
              <ZodiacDetail sign={sunSign.sign} />
            </DetailPanel>
          )}
          {expandedKey === 'venusNow' && (
            <DetailPanel id="spine-panel-venus" onClose={onClose}>
              <VenusDetail sign={venusSign} />
            </DetailPanel>
          )}

          {sabbatToday && (
            <>
              <button
                type="button"
                onClick={() => onToggle('sabbat', 'sabbat-today')}
                aria-expanded={expandedKey === 'sabbat'}
                aria-controls="spine-panel-sabbat"
                className="mt-2 -ml-2 w-full flex items-center gap-2 text-left disclosure-base disclosure-row rounded-xl px-3 py-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
              >
                <span className="text-sm text-amber-light flex-1">Blessed {sabbatToday.displayName}</span>
                <Chevron open={expandedKey === 'sabbat'} />
              </button>
              {expandedKey === 'sabbat' && (
                <DetailPanel id="spine-panel-sabbat" onClose={onClose}>
                  <SabbatDetail sabbat={sabbatToday.name} hemisphere={ctx.hemisphere} />
                </DetailPanel>
              )}
            </>
          )}
        </Node>

        {/* ── Future event nodes ── */}
        {events.map((event, i) => {
          const isOpen = expandedKey === event.key;
          const panelId = `spine-panel-${i}`;
          return (
            <Node key={event.key} isLast={i === events.length - 1}>
              <button
                type="button"
                onClick={() => onToggle(event.key, event.kind)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full flex items-center gap-3 text-left disclosure-base disclosure-row rounded-xl -mx-2 px-2 py-1 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
              >
                <span className="text-lg w-6 text-center flex-shrink-0 select-none text-text-secondary" aria-hidden>
                  {eventIcon(event)}
                </span>
                <span className="flex-1 min-w-0 text-sm text-foreground">{eventTitle(event)}</span>
                <span className="text-xs text-text-tertiary flex-shrink-0 whitespace-nowrap">
                  {formatRelativeDays(event.day, today)}
                </span>
                <Chevron open={isOpen} nudge={nudge && i === 0} />
              </button>
              {isOpen && (
                <DetailPanel id={panelId} onClose={onClose}>
                  <EventDetail event={event} ctx={ctx} />
                </DetailPanel>
              )}
            </Node>
          );
        })}
      </ol>
    </div>
  );
}
