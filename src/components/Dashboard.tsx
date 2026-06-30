'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TimezoneSelector from './TimezoneSelector';
import MoonDisc from './MoonDisc';
import CycleSpine from './CycleSpine';
import DetailPanel, { DetailContent } from './DetailPanel';
import { getMoonPhaseInfo, getMoonPhasePeak, MoonPhaseInfo, MoonPhasePeak } from '@/lib/moon';
import { getCurrentSunSign, getCurrentMoonSign, getUpcomingMoonSignChanges, SunSignInfo, MoonSignChange } from '@/lib/astro';
import { getSabbatContext, SabbatContext } from '@/lib/sabbats';
import { getUpcomingEvents, UpcomingEvent } from '@/lib/upcomingEvents';
import { getMercuryStatus, getCurrentVenusSign, MercuryInfo } from '@/lib/planets';
import { DEFAULT_TZ } from '@/lib/config';
import { formatCalendarDate } from '@/lib/format';
import { STORAGE_KEY, normalizeTimezone, hemisphereFromTimezone, type Hemisphere } from '@/lib/timezones';

// Stable IDs linking each disclosure trigger to its detail panel via aria-controls.
const PANEL_HERO = 'detail-panel-hero';
const PANEL_HERO_SIGN = 'detail-panel-hero-sign';

// Once the user has opened any disclosure, they've learned the gesture — retire
// the "tap any item" hint for good.
const HINT_DISMISSED_KEY = 'moon-dashboard-hint-dismissed';

function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}

// Short date for a true instant (e.g. a moon-phase peak), shown in the viewer's
// selected timezone. For calendar "this day" values use formatCalendarDate.
function formatInstantDate(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  });
}

// Convert a UTC Date to the day index (ms since epoch at local midnight) for comparison
function toLocalDayMs(date: Date, timezone: string): number {
  return toLocalDate(date, timezone).getTime();
}

function formatPeakText(phaseName: string, peakTime: Date, now: Date, timezone: string): string {
  const peakDayMs  = toLocalDayMs(peakTime, timezone);
  const todayMs    = toLocalDayMs(now, timezone);
  const isPast     = peakTime < now;
  const isToday    = peakDayMs === todayMs;
  const isYesterday = peakDayMs === todayMs - 86_400_000;
  const timeStr    = formatTime(peakTime, timezone);

  if (isToday) {
    return isPast
      ? `${phaseName} peaked today at ${timeStr}`
      : `${phaseName} peaks today at ${timeStr}`;
  }
  if (isYesterday) return `${phaseName} peaked yesterday at ${timeStr}`;

  const verb    = isPast ? 'peaked' : 'peaks';
  const dateStr = formatInstantDate(peakTime, timezone);
  return `${phaseName} ${verb}: ${dateStr} at ${timeStr}`;
}

// Convert a UTC Date to a local midnight Date in the given timezone
function toLocalDate(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => {
    const value = parts.find(p => p.type === type)?.value;
    // timezone is validated upstream (normalizeTimezone), so every part is
    // present; throw rather than silently building a bogus date if that breaks.
    if (value === undefined) throw new Error(`Missing "${type}" part for timezone ${timezone}`);
    return parseInt(value, 10);
  };
  return new Date(get('year'), get('month') - 1, get('day'));
}

// ── Disclosure button ──────────────────────────────────────────────────────
// Native <button> handles Enter/Space natively; no onKeyDown needed.
// focus-visible ring is baked into the base class and follows the element's
// own border-radius via box-shadow (Tailwind ring implementation).

function Disclosure({
  isOpen,
  onToggle,
  panelId,
  children,
  className = '',
}: {
  isOpen: boolean;
  onToggle: () => void;
  panelId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={`w-full disclosure-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 ${className}`}
    >
      {children}
    </button>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [timezone, setTimezone] = useState(DEFAULT_TZ);
  const hemisphere: Hemisphere = hemisphereFromTimezone(timezone);

  // TZ-independent state: initialised eagerly so the hero is populated on
  // first paint without waiting for the mount effect.
  const [moon, setMoon] = useState<MoonPhaseInfo | null>(() => getMoonPhaseInfo(new Date()));
  const [moonPeak, setMoonPeak] = useState<MoonPhasePeak | null>(() => {
    const now = new Date();
    return getMoonPhasePeak(now, getMoonPhaseInfo(now).name);
  });
  const [moonSign, setMoonSign] = useState<{ name: string; symbol: string } | null>(() => getCurrentMoonSign(new Date()));
  const [moonSignChanges, setMoonSignChanges] = useState<MoonSignChange[]>(() => getUpcomingMoonSignChanges(new Date(), 3));
  const [venusSign, setVenusSign] = useState<{ name: string; symbol: string } | null>(() => getCurrentVenusSign(new Date()));
  const [mercuryInfo, setMercuryInfo] = useState<MercuryInfo | null>(() => getMercuryStatus(new Date()));

  // Eagerly computed with DEFAULT_TZ so the spine is fully populated on first
  // paint (no post-mount growth/CLS); the mount effect reconciles the stored TZ.
  const [sunSign, setSunSign] = useState<SunSignInfo | null>(() =>
    getCurrentSunSign(toLocalDate(new Date(), DEFAULT_TZ)),
  );
  const [sabbatCtx, setSabbatCtx] = useState<SabbatContext | null>(() =>
    getSabbatContext(toLocalDate(new Date(), DEFAULT_TZ), hemisphereFromTimezone(DEFAULT_TZ)),
  );
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>(() =>
    getUpcomingEvents(toLocalDate(new Date(), DEFAULT_TZ), 8, hemisphereFromTimezone(DEFAULT_TZ)),
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // Hidden on first paint (hydration-safe); the mount effect reveals it only for
  // users who haven't yet dismissed it, so returning users never see a flash.
  const [showHint, setShowHint] = useState(false);

  // Timezone-independent: moon phase, moon sign, venus, mercury
  const recalculateAstro = useCallback(() => {
    const now = new Date();
    const moonInfo = getMoonPhaseInfo(now);
    setMoon(moonInfo);
    setMoonPeak(getMoonPhasePeak(now, moonInfo.name));
    setMoonSign(getCurrentMoonSign(now));
    setMoonSignChanges(getUpcomingMoonSignChanges(now, 3));
    setVenusSign(getCurrentVenusSign(now));
    setMercuryInfo(getMercuryStatus(now));
  }, []);

  // Timezone-dependent: sun sign, sabbat, upcoming events, date label
  const recalculateTz = useCallback((tz: string, hem: Hemisphere) => {
    const now = new Date();
    const localDate = toLocalDate(now, tz);
    setSunSign(getCurrentSunSign(localDate));
    setSabbatCtx(getSabbatContext(localDate, hem));
    setUpcomingEvents(getUpcomingEvents(localDate, 8, hem));
  }, []);

  const handleTimezoneChange = useCallback((tz: string) => {
    const safeTz = normalizeTimezone(tz);
    setTimezone(safeTz);
    localStorage.setItem(STORAGE_KEY, safeTz);
    recalculateTz(safeTz, hemisphereFromTimezone(safeTz));
  }, [recalculateTz]);

  // Initial load: restore the (validated) stored timezone and compute everything.
  useEffect(() => {
    const storedTz = normalizeTimezone(
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : DEFAULT_TZ,
    );
    // localStorage is only readable after mount, so restoring the persisted
    // timezone necessarily happens here; the initial render uses DEFAULT_TZ to
    // stay hydration-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(storedTz);
    recalculateAstro();
    recalculateTz(storedTz, hemisphereFromTimezone(storedTz));
    // Show the tap hint only to users who haven't dismissed it before.
    if (localStorage.getItem(HINT_DISMISSED_KEY) !== '1') {
      setShowHint(true);
    }
  }, [recalculateAstro, recalculateTz]);

  // Keep the view fresh on long-open tabs: recompute on an interval and whenever
  // the tab regains focus, so phase peaks, the date label, and "Coming Up" don't
  // go stale across midnight or a phase/sign change.
  useEffect(() => {
    const refresh = () => {
      recalculateAstro();
      recalculateTz(timezone, hemisphere);
    };
    const interval = setInterval(refresh, 5 * 60 * 1000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [timezone, hemisphere, recalculateAstro, recalculateTz]);

  // Toggle expand/collapse for a given item key
  const handleToggle = useCallback((key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
    // First interaction teaches the gesture; retire the hint permanently.
    setShowHint(false);
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
  }, []);

  // Which region owns the currently expanded key. The hero renders its own
  // panel; the spine renders its panel inline beneath the active node.
  const activeSection: 'hero' | 'spine' | null =
    !expandedKey ? null
    : expandedKey === 'moon' || expandedKey === 'moonSign' ? 'hero'
    : 'spine';

  // Derive panel content from the currently expanded key (pure: computed during
  // render rather than via an effect, so it never lags a frame behind expandedKey).
  const panelContent = useMemo<DetailContent | null>(() => {
    if (!expandedKey) return null;
    if (expandedKey === 'moon' && moon) {
      return {
        type: 'moon',
        phaseName: moon.name,
        illumination: moon.illumination,
        ageInDays: moon.ageInDays,
        moonSignChanges,
        timezone,
      };
    }
    if (expandedKey === 'moonSign' && moonSign) {
      return { type: 'moonSign', signName: moonSign.name, signSymbol: moonSign.symbol };
    }
    if (expandedKey === 'venusNow' && venusSign) {
      return { type: 'venus', signName: venusSign.name };
    }
    if (expandedKey === 'sunSign' && sunSign) {
      return { type: 'zodiac', signName: sunSign.sign.name };
    }
    if (expandedKey === 'sabbat' && sabbatCtx) {
      // Show the relevant sabbat: today's if it's a sabbat, else the next one
      const name = sabbatCtx.today?.name ?? sabbatCtx.nextSabbat?.name ?? null;
      return name ? { type: 'sabbat', sabbatName: name } : null;
    }
    // Upcoming event key
    const event = upcomingEvents.find(e => e.key === expandedKey);
    if (!event) return null;
    if (event.type === 'moon' && event.moonPhaseName) {
      return { type: 'moon', phaseName: event.moonPhaseName };
    }
    if (event.type === 'ingress' && event.zodiacSignName) {
      return { type: 'zodiac', signName: event.zodiacSignName };
    }
    if (event.type === 'sabbat' && event.sabbatName) {
      return { type: 'sabbat', sabbatName: event.sabbatName };
    }
    if (event.type === 'venus' && event.venusSignName) {
      return { type: 'venus', signName: event.venusSignName };
    }
    if (event.type === 'mercury-retrograde' && event.mercuryRetroSigns) {
      return { type: 'mercury-retrograde', signs: event.mercuryRetroSigns, signFlavour: event.mercuryRetroSignFlavour ?? '' };
    }
    if (event.type === 'deipnon') {
      return { type: 'deipnon' };
    }
    if (event.type === 'data-expiry') {
      return { type: 'data-expiry' };
    }
    return null;
  }, [expandedKey, moon, moonSign, venusSign, sunSign, sabbatCtx, upcomingEvents, moonSignChanges, timezone]);

  const closePanel = useCallback(() => setExpandedKey(null), []);

  // Compact "Mon 29 Jun" label for the spine's Now node, in the viewer's zone.
  const nowShort = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: timezone,
  });

  // The hero already announces the current/next phase peak (moonPeak). Drop the
  // upcoming node that refers to that same peak — same phase, and within a few
  // days of it (the spine's day-resolution date differs slightly from the hero's
  // minute-resolution peak) — so the same Full Moon isn't shown twice. A genuine
  // next-cycle occurrence (~a month away) falls outside the window and is kept.
  const spineEvents = useMemo(() => {
    if (!moonPeak) return upcomingEvents;
    const peakMs = moonPeak.peakTime.getTime();
    const window = 3 * 24 * 60 * 60 * 1000;
    let dropped = false;
    return upcomingEvents.filter(e => {
      if (!dropped && e.type === 'moon' && e.moonPhaseName === moonPeak.phaseName
          && Math.abs(e.date.getTime() - peakMs) <= window) {
        dropped = true;
        return false;
      }
      return true;
    });
  }, [upcomingEvents, moonPeak]);

  return (
    <div className="relative z-10 min-h-dvh flex flex-col">
      {/* Header — full-bleed border, content constrained to match main */}
      <header className="border-b border-white/5">
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-xl mx-auto w-full">
          <div>
            <h1 className="font-display text-base sm:text-lg tracking-wider sm:tracking-widest text-text-secondary uppercase whitespace-nowrap">
              Moon &amp; Sabbat
            </h1>
          </div>
          {/* Right side: flex-nowrap prevents wrapping to two rows at 360px */}
          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
            {/* Retrograde badge: informational, not interactive. Pre/post-shadow
                states are visible in "Coming Up" and removed here to reduce clutter. */}
            {mercuryInfo?.status === 'retrograde' && mercuryInfo.period && (
              <div
                aria-label={`Mercury retrograde until ${formatCalendarDate(mercuryInfo.period.retrogradeEnd)}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-xs text-red-300 flex-shrink-0"
              >
                <span aria-hidden>☿</span>
                <span>Rx</span>
                <span className="hidden sm:inline">· until {formatCalendarDate(mercuryInfo.period.retrogradeEnd)}</span>
              </div>
            )}
            <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-8 pt-4 pb-8 max-w-xl mx-auto w-full space-y-4">

        {/* Discoverability hint: the disclosures aren't obviously tappable, so
            name the gesture once, quietly, above the fold — until first tap. */}
        {showHint && (
          <p className="fade-in text-center text-xs text-text-tertiary">
            Tap any item to reveal its meaning
          </p>
        )}

        {/* ── Hero: Moon Phase ── */}
        <section className="fade-in space-y-4" aria-label="Moon phase">

          {/* Moon hero + sign row grouped together */}
          <div className="space-y-1">

            {/* Clickable moon hero */}
            <Disclosure
              isOpen={expandedKey === 'moon'}
              onToggle={() => handleToggle('moon')}
              panelId={PANEL_HERO}
              className={`text-center space-y-4 rounded-xl px-4 pt-2 pb-2 transition-colors hover:bg-hover-surface ${expandedKey === 'moon' ? 'bg-hover-surface' : ''}`}
            >
              {/* Drawn moon with glow halo */}
              <div className="relative inline-flex items-center justify-center" role="img" aria-label={moon?.name}>
                <div className="moon-glow" />
                <MoonDisc
                  fraction={moon?.fraction ?? 0}
                  waxing={(moon?.phase ?? 0) < 0.5}
                  hemisphere={hemisphere}
                  className="relative w-[150px] sm:w-[190px] lg:w-[230px] h-auto select-none"
                />
              </div>

              <div className="space-y-3">
                {/* role="heading" avoids nesting a block-level <h2> inside <button> */}
                <p role="heading" aria-level={2} className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
                  {moon?.name}
                </p>

                {/* Phase peak — the one number that's about *time*; the rest
                    (illumination, age) now live in the pop-down. */}
                {moonPeak && (
                  <p className="text-text-secondary text-xs sm:text-sm text-center">
                    {formatPeakText(moonPeak.phaseName, moonPeak.peakTime, new Date(), timezone)}
                  </p>
                )}

                <div className="flex justify-center pt-1">
                  <span className={`text-silver/75 text-base inline-block transition-transform duration-300 motion-reduce:transition-none ${expandedKey === 'moon' ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </div>
            </Disclosure>

            {/* Moon sign — separate clickable row; min-h-[44px] ensures touch target */}
            {moonSign && (
              <Disclosure
                isOpen={expandedKey === 'moonSign'}
                onToggle={() => handleToggle('moonSign')}
                panelId={PANEL_HERO_SIGN}
                className={`min-h-[44px] flex items-center justify-center py-1 px-4 rounded-lg transition-colors hover:bg-hover-surface ${expandedKey === 'moonSign' ? 'bg-hover-surface' : ''}`}
              >
                <span className="text-xs text-text-tertiary">
                  Moon in{' '}
                  <span className="text-text-secondary">
                    {moonSign.name} {moonSign.symbol}
                  </span>
                </span>
                <span className={`ml-1.5 text-silver/75 text-base inline-block transition-transform duration-300 motion-reduce:transition-none ${expandedKey === 'moonSign' ? 'rotate-180' : ''}`}>▾</span>
              </Disclosure>
            )}
          </div>

          {/* Detail panel — shown for moon phase or moon sign */}
          {activeSection === 'hero' && (
            <DetailPanel
              id={expandedKey === 'moonSign' ? PANEL_HERO_SIGN : PANEL_HERO}
              content={panelContent}
              onClose={closePanel}
            />
          )}
        </section>

        {/* ── Subtle divider ── */}
        <div className="fade-in fade-in-delay-1 border-t border-white/5" />

        {/* ── Cycle spine: one descending axis of sacred time ── */}
        <section className="fade-in fade-in-delay-1 pt-2" aria-label="Cycle of sacred time">
          <CycleSpine
            todayLabel={nowShort}
            sunSign={sunSign}
            venusSign={venusSign}
            sabbatCtx={sabbatCtx}
            events={spineEvents}
            timezone={timezone}
            expandedKey={expandedKey}
            onToggle={handleToggle}
            panelContent={panelContent}
            onClose={closePanel}
          />
        </section>

      </main>

      <footer className="px-6 py-5 text-center border-t border-white/5 space-y-1">
        <p className="text-xs text-silver/55">Calculated locally. No tracking, no APIs.</p>
        {process.env.NEXT_PUBLIC_COMMIT && (
          <p aria-hidden className="text-xs text-white/10 font-mono">{process.env.NEXT_PUBLIC_COMMIT}</p>
        )}
      </footer>
    </div>
  );
}
