'use client';

import { useCallback, useEffect, useState } from 'react';
import TimezoneSelector from './TimezoneSelector';
import DetailPanel, { DetailContent } from './DetailPanel';
import { getMoonPhaseInfo, getMoonPhasePeak, MoonPhaseInfo, MoonPhasePeak } from '@/lib/moon';
import { getCurrentSunSign, SunSignInfo } from '@/lib/astro';
import { getSabbatContext, SabbatContext } from '@/lib/sabbats';
import { getUpcomingEvents, UpcomingEvent } from '@/lib/upcomingEvents';

const DEFAULT_TZ = 'Europe/London';

function formatDate(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  });
}

function formatShortDate(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  });
}

function formatDateTime(date: Date, timezone: string): string {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

// Convert a UTC Date to a local midnight Date in the given timezone
function toLocalDate(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0');
  return new Date(get('year'), get('month') - 1, get('day'));
}

// ── Clickable card wrapper ─────────────────────────────────────────────────

function ClickableCard({
  itemKey,
  expandedKey,
  onToggle,
  children,
  className = '',
}: {
  itemKey: string;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isOpen = expandedKey === itemKey;
  return (
    <div
      className={`card p-5 space-y-3 cursor-pointer select-none transition-all hover:border-white/15 hover:bg-white/3 ${isOpen ? 'border-amber/30 bg-white/3' : ''} ${className}`}
      onClick={() => onToggle(itemKey)}
      role="button"
      aria-expanded={isOpen}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(itemKey); } }}
    >
      {children}
      <div className="flex justify-end">
        <span className={`text-silver/30 text-xs inline-block transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [timezone, setTimezone] = useState(DEFAULT_TZ);
  const [moon, setMoon] = useState<MoonPhaseInfo | null>(null);
  const [moonPeak, setMoonPeak] = useState<MoonPhasePeak | null>(null);
  const [sunSign, setSunSign] = useState<SunSignInfo | null>(null);
  const [sabbatCtx, setSabbatCtx] = useState<SabbatContext | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [todayLabel, setTodayLabel] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [panelContent, setPanelContent] = useState<DetailContent | null>(null);

  const recalculate = useCallback((tz: string) => {
    const now = new Date();
    const localDate = toLocalDate(now, tz);

    const moonInfo = getMoonPhaseInfo(localDate);
    setMoon(moonInfo);
    setMoonPeak(getMoonPhasePeak(now, moonInfo.name));
    setSunSign(getCurrentSunSign(localDate));
    setSabbatCtx(getSabbatContext(localDate));
    setUpcomingEvents(getUpcomingEvents(localDate));
    setTodayLabel(formatDate(now, tz));
  }, []);

  const handleTimezoneChange = useCallback((tz: string) => {
    setTimezone(tz);
    recalculate(tz);
  }, [recalculate]);

  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem('moon-dashboard-timezone') ?? DEFAULT_TZ)
      : DEFAULT_TZ;
    setTimezone(stored);
    recalculate(stored);
  }, [recalculate]);

  // Toggle expand/collapse for a given item key
  const handleToggle = useCallback((key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
  }, []);

  // Derive panel content from the currently expanded key
  useEffect(() => {
    if (!expandedKey) {
      setPanelContent(null);
      return;
    }
    if (expandedKey === 'moon' && moon) {
      setPanelContent({ type: 'moon', phaseName: moon.name });
    } else if (expandedKey === 'sunSign' && sunSign) {
      setPanelContent({ type: 'zodiac', signName: sunSign.sign.name });
    } else if (expandedKey === 'sabbat' && sabbatCtx) {
      // Show the relevant sabbat: today's if it's a sabbat, else the next one
      const name = sabbatCtx.today?.name ?? sabbatCtx.nextSabbat?.name ?? null;
      setPanelContent(name ? { type: 'sabbat', sabbatName: name } : null);
    } else {
      // Upcoming event key
      const event = upcomingEvents.find(e => e.key === expandedKey);
      if (!event) { setPanelContent(null); return; }
      if (event.type === 'moon' && event.moonPhaseName) {
        setPanelContent({ type: 'moon', phaseName: event.moonPhaseName });
      } else if (event.type === 'ingress' && event.zodiacSignName) {
        setPanelContent({ type: 'zodiac', signName: event.zodiacSignName });
      } else if (event.type === 'sabbat' && event.sabbatName) {
        setPanelContent({ type: 'sabbat', sabbatName: event.sabbatName });
      } else {
        setPanelContent(null);
      }
    }
  }, [expandedKey, moon, sunSign, sabbatCtx, upcomingEvents]);

  // ── Sabbat card display ──────────────────────────────────────────────────
  const sabbatCardContent = (() => {
    if (!sabbatCtx) return null;
    if (sabbatCtx.today) {
      return {
        primary: `Blessed ${sabbatCtx.today.name}`,
        secondary: sabbatCtx.today.altName
          ? `${sabbatCtx.today.name} — ${sabbatCtx.today.altName}`
          : sabbatCtx.today.name,
        sub: formatShortDate(sabbatCtx.today.date, timezone),
        isToday: true,
      };
    }
    if (sabbatCtx.nextSabbat) {
      const days = sabbatCtx.daysUntilNext;
      return {
        primary: `${days} day${days !== 1 ? 's' : ''} until ${sabbatCtx.nextSabbat.name}`,
        secondary: null,
        sub: formatShortDate(sabbatCtx.nextSabbat.date, timezone),
        isToday: false,
      };
    }
    return null;
  })();

  return (
    <div className="relative z-10 min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h1 className="font-display text-lg tracking-widest text-silver/60 uppercase">
            Moon &amp; Sabbat
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {todayLabel && (
            <span className="hidden sm:block font-display text-xs text-silver/30 tracking-wide">
              {todayLabel}
            </span>
          )}
          <TimezoneSelector onChange={handleTimezoneChange} />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-8 py-8 max-w-4xl mx-auto w-full space-y-10">

        {/* ── Hero: Moon Phase ── */}
        <section className="fade-in space-y-4">

          {/* Clickable moon hero */}
          <div
            className={`text-center space-y-5 cursor-pointer rounded-xl p-4 transition-colors hover:bg-white/3 ${expandedKey === 'moon' ? 'bg-white/3' : ''}`}
            onClick={() => handleToggle('moon')}
            role="button"
            aria-expanded={expandedKey === 'moon'}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle('moon'); } }}
          >
            {/* Moon emoji with glow halo */}
            <div className="relative inline-flex items-center justify-center">
              <div className="moon-glow" />
              <div
                className="text-[100px] sm:text-[120px] leading-none select-none relative"
                role="img"
                aria-label={moon?.name}
              >
                {moon?.emoji ?? '🌑'}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
                {moon?.name}
              </h2>
              <div className="flex items-center justify-center gap-5 text-silver/50 text-xs mt-1 flex-wrap">
                <span>
                  <span className="text-amber-light text-sm font-medium">{moon?.illumination}%</span>
                  {' '}illuminated
                </span>
                <span className="text-white/15">·</span>
                <span>
                  Day{' '}
                  <span className="text-amber-light text-sm font-medium">{moon?.ageInDays}</span>
                  {' '}of 29.5
                </span>
                {moonPeak && (
                  <>
                    <span className="text-white/15">·</span>
                    <span>
                      {moonPeak.phaseName} peaks:{' '}
                      <span className="text-silver/60">{formatDateTime(moonPeak.peakTime, timezone)}</span>
                    </span>
                  </>
                )}
              </div>
              <div className="flex justify-center pt-1">
                <span className={`text-silver/30 text-xs inline-block transition-transform duration-300 ${expandedKey === 'moon' ? 'rotate-180' : ''}`}>▾</span>
              </div>
            </div>
          </div>

          {/* Moon detail panel */}
          <DetailPanel
            content={expandedKey === 'moon' ? panelContent : null}
            onClose={() => setExpandedKey(null)}
          />
        </section>

        {/* ── Subtle divider ── */}
        <div className="fade-in fade-in-delay-1 border-t border-white/5" />

        {/* ── Current Info Row ── */}
        <section className="fade-in fade-in-delay-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Sun Sign card */}
          <ClickableCard itemKey="sunSign" expandedKey={expandedKey} onToggle={handleToggle}>
            <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Current Sun Sign</p>
            {sunSign && (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl text-amber-light">
                    {sunSign.sign.symbol}
                  </span>
                  <span className="font-display text-3xl text-foreground">
                    {sunSign.sign.name}
                  </span>
                </div>
                <p className="text-xs text-silver/50">
                  until {formatShortDate(sunSign.transitEnd, timezone)}
                </p>
              </>
            )}
          </ClickableCard>

          {/* Sabbat card */}
          <ClickableCard itemKey="sabbat" expandedKey={expandedKey} onToggle={handleToggle}>
            <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Wheel of the Year</p>
            {sabbatCardContent && (
              <>
                <p className={`font-display text-2xl leading-snug ${sabbatCardContent.isToday ? 'text-amber-light' : 'text-foreground'}`}>
                  {sabbatCardContent.primary}
                </p>
                <p className="text-xs text-silver/50">{sabbatCardContent.sub}</p>
              </>
            )}
          </ClickableCard>

        </section>

        {/* Panels for current-row cards (appear below the row, full width) */}
        {(expandedKey === 'sunSign' || expandedKey === 'sabbat') && (
          <div className="fade-in-delay-1">
            <DetailPanel
              content={panelContent}
              onClose={() => setExpandedKey(null)}
            />
          </div>
        )}

        {/* ── Divider ── */}
        <div className="fade-in fade-in-delay-2 border-t border-white/5" />

        {/* ── Coming Up ── */}
        <section className="fade-in fade-in-delay-2 space-y-3">
          <h3 className="font-display text-xl tracking-widest text-silver/40 uppercase">
            Coming Up
          </h3>

          <ul className="space-y-1">
            {upcomingEvents.map(event => (
              <li key={event.key}>
                {/* Event row */}
                <div
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:bg-white/4 ${expandedKey === event.key ? 'bg-white/4 border border-white/8' : 'border border-transparent'}`}
                  onClick={() => handleToggle(event.key)}
                  role="button"
                  aria-expanded={expandedKey === event.key}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(event.key); } }}
                >
                  <span className="text-xl w-8 text-center flex-shrink-0 select-none" aria-hidden>
                    {event.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{event.name}</p>
                    <p className="text-xs text-silver/50">{formatShortDate(event.date, timezone)}</p>
                  </div>
                  <span className={`text-silver/30 text-xs flex-shrink-0 inline-block transition-transform duration-300 ${expandedKey === event.key ? 'rotate-180' : ''}`}>▾</span>
                </div>

                {/* Detail panel for this event */}
                <div className="px-2">
                  <DetailPanel
                    content={expandedKey === event.key ? panelContent : null}
                    onClose={() => setExpandedKey(null)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

      </main>

      <footer className="px-6 py-5 text-center border-t border-white/5 space-y-1">
        {todayLabel && (
          <p className="font-display text-sm text-silver/30 tracking-wide sm:hidden">{todayLabel}</p>
        )}
        <p className="text-xs text-white/20">All calculations are local &amp; astronomical — no external APIs.</p>
      </footer>
    </div>
  );
}
