'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics';
import TimezoneSelector from './TimezoneSelector';
import MoonDisc from './MoonDisc';
import Chevron from './Chevron';
import CycleSpine from './CycleSpine';
import DetailPanel from './DetailPanel';
import DashboardSkeleton from './DashboardSkeleton';
import { MoonPhaseDetail, MoonSignDetail } from './details';
import { buildDashboardModel, type DashboardModel } from '@/lib/dashboardModel';
import { DEFAULT_TZ } from '@/lib/config';
import { dayOf } from '@/lib/days';
import { formatDay } from '@/lib/format';
import { SIGN_SYMBOLS } from '@/lib/names';
import { safeGet, safeSet } from '@/lib/storage';
import { STORAGE_KEY, detectBrowserTimezone, normalizeTimezone, resolveTimezone } from '@/lib/timezones';

// Stable IDs linking each disclosure trigger to its detail panel via aria-controls.
const PANEL_HERO = 'detail-panel-hero';
const PANEL_HERO_SIGN = 'detail-panel-hero-sign';

// Hero disclosures. Opening one of these doesn't prove the user has found the
// timeline, which is where most of the content lives.
const HERO_KEYS = new Set(['moon', 'moonSign']);

// Once the user has opened something in the timeline card, they've learned the
// gesture: retire the hint and the chevron nudge for good. (A new key: the old
// one was set by any first tap, including the moon, so it can't be trusted.)
const HINT_DISMISSED_KEY = 'moon-dashboard-spine-discovered';

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
      className={`disclosure-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 ${className}`}
    >
      {children}
    </button>
  );
}

// ── Hero + spine, once there is a model to show ────────────────────────────

function DashboardContent({
  model,
  expandedKey,
  onToggle,
  onClose,
  nudge,
}: {
  model: DashboardModel;
  expandedKey: string | null;
  onToggle: (key: string, kind: string) => void;
  onClose: () => void;
  nudge: boolean;
}) {
  const { moon, moonSign, timezone } = model;

  return (
    <>
      {/* ── Hero: Moon Phase ── */}
      <section className="fade-in space-y-4" aria-label="Moon phase">

        {/* Moon hero + sign row grouped together */}
        <div className="space-y-1">

          {/* Clickable moon hero */}
          <Disclosure
            isOpen={expandedKey === 'moon'}
            onToggle={() => onToggle('moon', 'moon-phase-now')}
            panelId={PANEL_HERO}
            className={`group w-full text-center space-y-4 rounded-xl px-4 pt-2 pb-2 transition-colors hover:bg-hover-surface ${expandedKey === 'moon' ? 'bg-hover-surface' : ''}`}
          >
            {/* Drawn moon with glow halo; lifts slightly on hover/focus so the
                moon itself reads as something to tap. */}
            <div className="relative inline-flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none" role="img" aria-label={moon.name}>
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
                <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-amber-light/80">
                  About this phase
                  <Chevron open={expandedKey === 'moon'} />
                </span>
              </div>
            </div>
          </Disclosure>

          {/* Moon sign — separate clickable row; min-h-[44px] ensures touch target */}
          <Disclosure
            isOpen={expandedKey === 'moonSign'}
            onToggle={() => onToggle('moonSign', 'moon-sign')}
            panelId={PANEL_HERO_SIGN}
            className="disclosure-row mx-auto w-fit min-h-[44px] flex items-center justify-center gap-2 py-1 pl-4 pr-2 rounded-xl"
          >
            <span className="text-sm text-text-tertiary">
              Moon in{' '}
              <span className="text-foreground">
                {moonSign} <span className="text-amber-light/80">{SIGN_SYMBOLS[moonSign]}</span>
              </span>
            </span>
            <Chevron open={expandedKey === 'moonSign'} />
          </Disclosure>
        </div>

        {/* Detail panel — shown for moon phase or moon sign */}
        {expandedKey === 'moon' && (
          <DetailPanel id={PANEL_HERO} onClose={onClose}>
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
          <DetailPanel id={PANEL_HERO_SIGN} onClose={onClose}>
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
          onToggle={onToggle}
          onClose={onClose}
          nudge={nudge}
        />
      </section>
    </>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [timezone, setTimezone] = useState(DEFAULT_TZ);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  // null during the server render and hydration: everything shown depends on
  // the current time, so it is only computed in the browser (finding P0-2).
  const [now, setNow] = useState<Date | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Everything shown is derived from (now, timezone) in one pure step.
  const model = useMemo(() => (now ? buildDashboardModel(now, timezone) : null), [now, timezone]);
  const mercury = model?.mercury;

  const handleTimezoneChange = useCallback((tz: string) => {
    const safeTz = normalizeTimezone(tz);
    setTimezone(safeTz);
    safeSet(STORAGE_KEY, safeTz);
  }, []);

  // First client render: pick the zone (saved choice, else the browser's) and
  // start the clock in the same pass, so the first real frame already uses the
  // right zone.
  useEffect(() => {
    // Browser-only state can't be read during render without breaking
    // hydration, so it is picked up here.
    const detected = detectBrowserTimezone();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetectedZone(detected);
    setTimezone(resolveTimezone(safeGet(STORAGE_KEY), detected));
    setNow(new Date());
    // Show the tap hint only to users who haven't dismissed it before.
    if (safeGet(HINT_DISMISSED_KEY) !== '1') {
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
  const handleToggle = useCallback((key: string, kind: string) => {
    const opening = expandedKey !== key;
    setExpandedKey(opening ? key : null);
    // Anonymous count of which kinds of panel get opened, to see whether the
    // detail panels are being discovered. No-op outside Vercel.
    if (opening) track('panel_open', { kind });
    // Opening something in the timeline shows the gesture has been learned;
    // retire the hint and nudge permanently. Hero taps alone don't count.
    if (!HERO_KEYS.has(key)) {
      setShowHint(false);
      safeSet(HINT_DISMISSED_KEY, '1');
    }
  }, [expandedKey]);

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
            {/* Retrograde badge: informational, not interactive. Shadow
                periods are shown in the Mercury retrograde panel instead. */}
            {mercury?.status === 'retrograde' && mercury.period && (
              <div
                aria-label={`Mercury retrograde until ${formatDay(dayOf(mercury.period.retrogradeEnd, timezone))}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-xs text-red-300 flex-shrink-0"
              >
                <span aria-hidden>☿</span>
                <span>Rx</span>
                <span className="hidden sm:inline">· until {formatDay(dayOf(mercury.period.retrogradeEnd, timezone))}</span>
              </div>
            )}
            <TimezoneSelector value={timezone} detectedZone={detectedZone} onChange={handleTimezoneChange} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-8 pt-4 pb-8 max-w-xl mx-auto w-full space-y-4">

        {/* Discoverability hint: name the gesture above the fold until the
            user has opened something in the timeline. */}
        {showHint && (
          <p className="fade-in text-center text-xs text-text-secondary">
            Tap the moon or any item below to reveal its meaning
          </p>
        )}

        {model ? (
          <DashboardContent
            model={model}
            expandedKey={expandedKey}
            onToggle={handleToggle}
            onClose={closePanel}
            nudge={showHint}
          />
        ) : (
          <DashboardSkeleton />
        )}

      </main>

      <footer className="px-6 py-5 text-center border-t border-white/5 space-y-1">
        <p className="text-xs text-silver/55">Calculated locally. Anonymous usage counts only.</p>
        {process.env.NEXT_PUBLIC_COMMIT && (
          <p aria-hidden className="text-xs text-white/10 font-mono">{process.env.NEXT_PUBLIC_COMMIT}</p>
        )}
      </footer>
    </div>
  );
}
