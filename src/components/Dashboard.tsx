'use client';

import { useCallback, useEffect, useState } from 'react';
import TimezoneSelector from './TimezoneSelector';
import { getMoonPhaseInfo, getNextMoonPhases, MoonPhaseInfo, UpcomingMoonPhase } from '@/lib/moon';
import { getCurrentSunSign, getNextSunSignIngress, SunSignInfo, NextIngress } from '@/lib/astro';
import { getSabbatContext, SabbatContext, Sabbat } from '@/lib/sabbats';

const DEFAULT_TZ = 'Europe/London';

function formatDate(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
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

// Convert a UTC Date to local date in the given timezone
function toLocalDate(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0');
  return new Date(get('year'), get('month') - 1, get('day'));
}

export default function Dashboard() {
  const [timezone, setTimezone] = useState(DEFAULT_TZ);
  const [moon, setMoon] = useState<MoonPhaseInfo | null>(null);
  const [nextPhases, setNextPhases] = useState<UpcomingMoonPhase[]>([]);
  const [sunSign, setSunSign] = useState<SunSignInfo | null>(null);
  const [nextIngress, setNextIngress] = useState<NextIngress | null>(null);
  const [sabbatCtx, setSabbatCtx] = useState<SabbatContext | null>(null);
  const [todayLabel, setTodayLabel] = useState('');

  const recalculate = useCallback((tz: string) => {
    const now = new Date();
    const localDate = toLocalDate(now, tz);

    setMoon(getMoonPhaseInfo(localDate));
    setNextPhases(getNextMoonPhases(localDate));
    setSunSign(getCurrentSunSign(localDate));
    setNextIngress(getNextSunSignIngress(localDate));
    setSabbatCtx(getSabbatContext(localDate));
    setTodayLabel(formatDate(now, tz));
  }, []);

  const handleTimezoneChange = useCallback((tz: string) => {
    setTimezone(tz);
    recalculate(tz);
  }, [recalculate]);

  useEffect(() => {
    // Initial load — timezone will be set by TimezoneSelector after mount,
    // but we calculate with default immediately.
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem('moon-dashboard-timezone') ?? DEFAULT_TZ)
      : DEFAULT_TZ;
    setTimezone(stored);
    recalculate(stored);
  }, [recalculate]);

  return (
    <div className="relative z-10 min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h1 className="font-display text-lg tracking-widest text-silver/60 uppercase">
            Moon &amp; Sabbat
          </h1>
        </div>
        <TimezoneSelector onChange={handleTimezoneChange} />
      </header>

      <main className="flex-1 px-4 sm:px-8 py-8 max-w-4xl mx-auto w-full space-y-10">

        {/* ── Hero: Moon Phase ── */}
        <section className="fade-in text-center space-y-4">
          <p className="text-xs tracking-[0.3em] uppercase text-silver/40">{todayLabel}</p>
          <div
            className="text-[100px] sm:text-[120px] leading-none select-none"
            role="img"
            aria-label={moon?.name}
          >
            {moon?.emoji ?? '🌑'}
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
              {moon?.name}
            </h2>
            <div className="flex items-center justify-center gap-6 text-silver/60 text-sm mt-3">
              <span>
                <span className="text-amber-light font-semibold">{moon?.illumination}%</span>
                {' '}illuminated
              </span>
              <span className="text-white/20">·</span>
              <span>
                Day{' '}
                <span className="text-amber-light font-semibold">{moon?.ageInDays}</span>
                {' '}of 29.5
              </span>
            </div>
          </div>
        </section>

        {/* ── Subtle divider ── */}
        <div className="fade-in fade-in-delay-1 border-t border-white/5" />

        {/* ── Current Info Row ── */}
        <section className="fade-in fade-in-delay-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Sun Sign card */}
          <div className="card p-5 space-y-3">
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
                  {formatShortDate(sunSign.transitStart, timezone)}
                  {' – '}
                  {formatShortDate(sunSign.transitEnd, timezone)}
                </p>
              </>
            )}
          </div>

          {/* Sabbat card */}
          <div className="card p-5 space-y-3">
            <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Wheel of the Year</p>
            {sabbatCtx && (
              <>
                <p className="font-display text-2xl text-foreground leading-snug">
                  {sabbatCtx.nearest}
                </p>
                {sabbatCtx.today && (
                  <p className="text-xs text-amber/80 italic">
                    {sabbatCtx.today.description}
                  </p>
                )}
              </>
            )}
          </div>

        </section>

        {/* ── Divider ── */}
        <div className="fade-in fade-in-delay-2 border-t border-white/5" />

        {/* ── Upcoming section ── */}
        <section className="fade-in fade-in-delay-2 space-y-4">
          <h3 className="font-display text-xl tracking-widest text-silver/40 uppercase">
            Coming Up
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Next major moon phases */}
            <div className="card p-5 space-y-3">
              <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Moon Phases</p>
              <ul className="space-y-2">
                {nextPhases.map((p) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <div>
                      <p className="text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-silver/50">
                        {formatShortDate(p.date, timezone)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next sun sign ingress */}
            <div className="card p-5 space-y-3">
              <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Sun Ingress</p>
              {nextIngress && (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl text-amber-light">
                      {nextIngress.sign.symbol}
                    </span>
                    <span className="font-display text-2xl text-foreground">
                      {nextIngress.sign.name}
                    </span>
                  </div>
                  <p className="text-xs text-silver/50">
                    {formatShortDate(nextIngress.date, timezone)}
                  </p>
                </div>
              )}
            </div>

            {/* Next 3 sabbats */}
            <div className="card p-5 space-y-3">
              <p className="text-xs tracking-[0.25em] uppercase text-silver/40">Sabbats</p>
              {sabbatCtx && (
                <ul className="space-y-2">
                  {sabbatCtx.next3.map((s: Sabbat) => (
                    <li key={s.name + s.date.getFullYear()} className="space-y-0.5">
                      <p className="text-sm text-foreground">
                        {s.name}
                        {s.altName && (
                          <span className="text-silver/40 text-xs ml-1">· {s.altName}</span>
                        )}
                      </p>
                      <p className="text-xs text-silver/50">
                        {formatShortDate(s.date, timezone)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </section>

      </main>

      <footer className="px-6 py-4 text-center text-xs text-white/20 border-t border-white/5">
        All calculations are local &amp; astronomical — no external APIs.
      </footer>
    </div>
  );
}
