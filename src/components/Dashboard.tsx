'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TimezoneSelector from './TimezoneSelector';
import MoonDisc from './MoonDisc';
import CycleSpine from './CycleSpine';
import DetailPanel from './DetailPanel';
import { MoonPhaseDetail, MoonSignDetail } from './details';
import { buildDashboardModel } from '@/lib/dashboardModel';
import { DEFAULT_TZ } from '@/lib/config';
import { formatDay } from '@/lib/format';
import { dayOf } from '@/lib/days';
import { SIGN_SYMBOLS } from '@/lib/names';
import { STORAGE_KEY, normalizeTimezone } from '@/lib/timezones';

// Stable IDs linking each disclosure trigger to its detail panel via aria-controls.
const PANEL_HERO = 'detail-panel-hero';
const PANEL_HERO_SIGN = 'detail-panel-hero-sign';

// Once the user has opened any disclosure, they've learned the gesture — retire
// the "tap any item" hint for good.
const HINT_DISMISSED_KEY = 'moon-dashboard-hint-dismissed';

// How often a long-open tab recomputes, so peaks, the date and the spine don't
// go stale across midnight or a phase/sign change.
const REFRESH_MS = 5 * 60 * 1000;

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
  const [now, setNow] = useState(() => new Date());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // Hidden on first paint (hydration-safe); the mount effect reveals it only for
  // users who haven't yet dismissed it, so returning users never see a flash.
  const [showHint, setShowHint] = useState(false);

  // Everything shown is derived from (now, timezone) in one pure step.
  const model = useMemo(() => buildDashboardModel(now, timezone), [now, timezone]);
  const { moon, moonSign, mercury } = model;

  const handleTimezoneChange = useCallback((tz: string) => {
    const safeTz = normalizeTimezone(tz);
    setTimezone(safeTz);
    localStorage.setItem(STORAGE_KEY, safeTz);
  }, []);

  // Initial load: restore the (validated) stored timezone.
  useEffect(() => {
    // localStorage is only readable after mount, so restoring the persisted
    // timezone necessarily happens here; the initial render uses DEFAULT_TZ to
    // stay hydration-safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(normalizeTimezone(localStorage.getItem(STORAGE_KEY)));
    setNow(new Date());
    // Show the tap hint only to users who haven't dismissed it before.
    if (localStorage.getItem(HINT_DISMISSED_KEY) !== '1') {
      setShowHint(true);
    }
  }, []);

  // Keep the view fresh on long-open tabs: tick on an interval and whenever the
  // tab regains focus.
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const interval = setInterval(refresh, REFRESH_MS);
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
  }, []);

  // Toggle expand/collapse for a given item key
  const handleToggle = useCallback((key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
    // First interaction teaches the gesture; retire the hint permanently.
    setShowHint(false);
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
  }, []);

  const closePanel = useCallback(() => setExpandedKey(null), []);

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
            {/* Retrograde badge: informational, not interactive. Only the
                retrograde itself is badged; pre/post-shadow status is computed by
                getMercuryStatus but not currently shown anywhere. */}
            {mercury.status === 'retrograde' && mercury.period && (
              <div
                aria-label={`Mercury retrograde until ${formatDay(dayOf(mercury.period.retrogradeEnd, timezone))}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-xs text-red-300 flex-shrink-0"
              >
                <span aria-hidden>☿</span>
                <span>Rx</span>
                <span className="hidden sm:inline">· until {formatDay(dayOf(mercury.period.retrogradeEnd, timezone))}</span>
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
              <div className="relative inline-flex items-center justify-center" role="img" aria-label={moon.name}>
              <div className="moon-glow" />
              <MoonDisc
                fraction={moon.fraction}
                waxing={moon.phase < 0.5}
                hemisphere={model.hemisphere}
                className="relative w-[150px] sm:w-[190px] lg:w-[230px] h-auto select-none"
              />
              </div>

              <div className="space-y-3">
              {/* role="heading" avoids nesting a block-level <h2> inside <button> */}
              <p role="heading" aria-level={2} className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
                {moon.name}
              </p>

              {/* Phase peak — the one number that's about *time*; the rest
                  (illumination, age) now live in the pop-down. */}
              <p className="text-text-secondary text-xs sm:text-sm text-center">
                {model.moonPeakText}
              </p>

              <div className="flex justify-center pt-1">
                <span className={`text-silver/75 text-base inline-block transition-transform duration-300 motion-reduce:transition-none ${expandedKey === 'moon' ? 'rotate-180' : ''}`}>▾</span>
              </div>
              </div>
            </Disclosure>

            {/* Moon sign — separate clickable row; min-h-[44px] ensures touch target */}
            <Disclosure
              isOpen={expandedKey === 'moonSign'}
              onToggle={() => handleToggle('moonSign')}
              panelId={PANEL_HERO_SIGN}
              className={`min-h-[44px] flex items-center justify-center py-1 px-4 rounded-lg transition-colors hover:bg-hover-surface ${expandedKey === 'moonSign' ? 'bg-hover-surface' : ''}`}
            >
              <span className="text-xs text-text-tertiary">
                Moon in{' '}
                <span className="text-text-secondary">
                  {moonSign} {SIGN_SYMBOLS[moonSign]}
                </span>
              </span>
              <span className={`ml-1.5 text-silver/75 text-base inline-block transition-transform duration-300 motion-reduce:transition-none ${expandedKey === 'moonSign' ? 'rotate-180' : ''}`}>▾</span>
            </Disclosure>
          </div>

          {/* Detail panel — shown for moon phase or moon sign */}
          {expandedKey === 'moon' && (
            <DetailPanel id={PANEL_HERO} onClose={closePanel}>
              <MoonPhaseDetail
                phase={moon.name}
                current={{
                  illumination: moon.illumination,
                  ageInDays: moon.ageInDays,
                  moonSignChanges: model.moonSignChanges,
                  timezone,
                }}
              />
            </DetailPanel>
          )}
          {expandedKey === 'moonSign' && (
            <DetailPanel id={PANEL_HERO_SIGN} onClose={closePanel}>
              <MoonSignDetail sign={moonSign} />
            </DetailPanel>
          )}
        </section>

        {/* ── Subtle divider ── */}
        <div className="fade-in fade-in-delay-1 border-t border-white/5" />

        {/* ── Cycle spine: one descending axis of sacred time ── */}
        <section className="fade-in fade-in-delay-1 pt-2" aria-label="Cycle of sacred time">
          <CycleSpine
            today={model.today}
            todayLabel={model.todayLabel}
            sunSign={model.sunSign}
            venusSign={model.venusSign}
            sabbatToday={model.sabbatToday}
            events={model.events}
            ctx={{ timezone, hemisphere: model.hemisphere }}
            expandedKey={expandedKey}
            onToggle={handleToggle}
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
