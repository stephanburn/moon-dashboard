'use client';

import { useState } from 'react';
import { MOON_CORRESPONDENCES } from '@/data/moonCorrespondences';
import { ZODIAC_CORRESPONDENCES } from '@/data/zodiacCorrespondences';
import { SABBAT_CORRESPONDENCES } from '@/data/sabbatCorrespondences';
import { MOON_SIGN_CORRESPONDENCES } from '@/data/moonSignCorrespondences';
import { VENUS_CORRESPONDENCES } from '@/data/venusCorrespondences';
import type { MoonSignChange } from '@/lib/astro';
import { MERCURY_RETROGRADE_CORRESPONDENCES } from '@/data/mercuryRetrogradeCorrespondences';
import { mercuryRetrogradeSigns, type MercuryRetrogradePeriod } from '@/lib/planets';
import { dayOf } from '@/lib/days';
import { formatDay, formatDayAndTime } from '@/lib/format';
import { SIGN_SYMBOLS, type PhaseName, type SabbatName, type SignName } from '@/lib/names';

// The body of each detail panel. DetailPanel supplies the chrome (animation,
// close button); these supply the content.

function CorrespondenceRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-amber/60 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-text-secondary text-sm leading-relaxed">{items.join(', ')}</p>
    </div>
  );
}

// ── Moon phase ─────────────────────────────────────────────────────────────

export interface CurrentMoon {
  illumination: number; // 0-100
  ageInDays: number;    // 0-29.5
  moonSignChanges: MoonSignChange[];
  timezone: string;
}

/** A moon phase. `current` adds the live figures shown for today's moon. */
export function MoonPhaseDetail({ phase, current }: { phase: PhaseName; current?: CurrentMoon }) {
  const [expandedTransit, setExpandedTransit] = useState<string | null>(null);
  const data = MOON_CORRESPONDENCES[phase];

  return (
    <div className="space-y-4">
      {current && (
        <p className="text-xs text-text-tertiary">
          <span className="text-amber-light text-sm font-medium">{current.illumination}%</span>
          {' '}illuminated
          <span className="text-white/15">{' · '}</span>
          Day{' '}
          <span className="text-amber-light text-sm font-medium">{current.ageInDays}</span>
          {' '}of 29.5
        </p>
      )}

      <div>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.description}</p>
        <p className="text-amber-light/80 text-xs mt-2 italic">{data.energy}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <CorrespondenceRow label="Workings"  items={data.magicalWorkings} />
        <CorrespondenceRow label="Colours"   items={data.colours} />
        <CorrespondenceRow label="Crystals"  items={data.crystals} />
        <CorrespondenceRow label="Herbs"     items={data.herbs} />
      </div>

      {data.esbat && data.esbatNote && (
        <div className="border-l-2 border-amber/30 pl-3">
          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Esbat</p>
          <p className="text-sm text-text-secondary leading-relaxed">{data.esbatNote}</p>
        </div>
      )}

      {current && current.moonSignChanges.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1">
          <p className="text-amber/60 text-xs uppercase tracking-wider mb-2">Lunar Transits</p>
          {current.moonSignChanges.map(change => {
            const key = `${change.sign}-${change.enterTime.getTime()}`;
            const isOpen = expandedTransit === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setExpandedTransit(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-hover-surface bg-transparent border-0 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 ${isOpen ? 'bg-hover-surface' : ''}`}
                >
                  <span className="text-sm text-text-secondary">
                    Moon enters <span className="text-foreground">{change.sign} {SIGN_SYMBOLS[change.sign]}</span>
                  </span>
                  <span className="text-xs text-text-tertiary flex-shrink-0">
                    {formatDayAndTime(change.enterTime, current.timezone)}
                  </span>
                </button>
                {isOpen && (
                  <div className="mx-3 mb-1 px-3 py-2 rounded-lg bg-hover-surface border border-white/6">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {MOON_SIGN_CORRESPONDENCES[change.sign].energy}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Moon sign ──────────────────────────────────────────────────────────────

export function MoonSignDetail({ sign }: { sign: SignName }) {
  const zodiac = ZODIAC_CORRESPONDENCES[sign];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-text-secondary text-xl select-none">☽</span>
        <span className="font-display text-3xl text-amber-light">{SIGN_SYMBOLS[sign]}</span>
        <div>
          <p className="font-display text-xl text-foreground">Moon in {sign}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{zodiac.element} · {zodiac.modality}</p>
        </div>
      </div>
      <p className="text-foreground/90 text-sm leading-relaxed">{MOON_SIGN_CORRESPONDENCES[sign].energy}</p>
    </div>
  );
}

// ── Sun sign ───────────────────────────────────────────────────────────────

export function ZodiacDetail({ sign }: { sign: SignName }) {
  const data = ZODIAC_CORRESPONDENCES[sign];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-display text-3xl text-amber-light">{data.symbol}</span>
        <div className="flex gap-3 text-xs text-text-secondary flex-wrap">
          <span>{data.element}</span>
          <span className="text-white/20">·</span>
          <span>{data.modality}</span>
          <span className="text-white/20">·</span>
          <span>{data.rulingPlanet}</span>
        </div>
      </div>

      <div>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.transitEnergy}</p>
        <p className="text-amber-light/70 text-xs mt-2">{data.qualities.join(' · ')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <CorrespondenceRow label="Colours"  items={data.colours} />
        <CorrespondenceRow label="Crystals" items={data.crystals} />
        <CorrespondenceRow label="Herbs"    items={data.herbs} />
      </div>
    </div>
  );
}

// ── Sabbat ─────────────────────────────────────────────────────────────────

export function SabbatDetail({ sabbat }: { sabbat: SabbatName }) {
  const data = SABBAT_CORRESPONDENCES[sabbat];

  return (
    <div className="space-y-4">
      <div>
        {data.alternateNames.length > 0 && (
          <p className="text-xs text-text-tertiary mb-1">{data.alternateNames.join(' · ')}</p>
        )}
        <p className="text-xs text-amber-light/60 mb-3">{data.dateDescription}</p>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.mythology}</p>
      </div>

      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Themes</p>
        <p className="text-sm text-text-secondary">{data.themes.join(' · ')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <CorrespondenceRow label="Colours"  items={data.colours} />
        <CorrespondenceRow label="Crystals" items={data.crystals} />
        <CorrespondenceRow label="Herbs"    items={data.herbs} />
        <CorrespondenceRow label="Foods"    items={data.foods} />
      </div>

      <div className="border-l-2 border-amber/30 pl-3">
        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Ritual Focus</p>
        <p className="text-sm text-text-secondary leading-relaxed">{data.ritualFocus}</p>
      </div>
    </div>
  );
}

// ── Venus ──────────────────────────────────────────────────────────────────

export function VenusDetail({ sign }: { sign: SignName }) {
  const zodiac = ZODIAC_CORRESPONDENCES[sign];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl text-amber-light">♀</span>
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl text-foreground">{zodiac.symbol}</span>
          <span className="font-display text-2xl text-foreground">{sign}</span>
        </div>
      </div>

      <p className="text-foreground/90 text-sm leading-relaxed">{VENUS_CORRESPONDENCES[sign].energy}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <CorrespondenceRow label="Colours"  items={zodiac.colours} />
        <CorrespondenceRow label="Crystals" items={zodiac.crystals} />
      </div>
    </div>
  );
}

// ── Mercury retrograde ─────────────────────────────────────────────────────

export function MercuryRetroDetail({ period, timezone }: { period: MercuryRetrogradePeriod; timezone: string }) {
  const signs = mercuryRetrogradeSigns(period);
  const day = (d: Date) => formatDay(dayOf(d, timezone), { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl text-amber-light">☿℞</span>
        <span className="text-sm text-text-secondary">{signs}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <dt className="text-text-tertiary">Pre-shadow</dt>
        <dd className="text-text-secondary">from {day(period.shadowStart)}</dd>
        <dt className="text-text-tertiary">Retrograde</dt>
        <dd className="text-text-secondary">{day(period.retrogradeStart)} to {day(period.retrogradeEnd)}</dd>
        <dt className="text-text-tertiary">Post-shadow</dt>
        <dd className="text-text-secondary">until {day(period.shadowEnd)}</dd>
      </dl>

      <div>
        <p className="text-foreground/90 text-sm leading-relaxed">
          Mercury retrograde is a period when the planet appears to travel backwards across the sky.
          In astrological tradition, this time calls for review rather than forward motion. Revisit,
          reflect, and revise. Communications, travel, technology, and agreements are prone to delays
          and misunderstandings. Back up important data, read the small print, and leave room for
          things to be clarified before they are resolved.
        </p>
      </div>

      <div className="border-l-2 border-amber/30 pl-3">
        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">In {period.stationSign}</p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {MERCURY_RETROGRADE_CORRESPONDENCES[period.stationSign].flavour}
        </p>
      </div>
    </div>
  );
}

// ── Hekate's Deipnon ───────────────────────────────────────────────────────

export function DeipnonDetail() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl text-amber-light">⚸</span>
        <div>
          <p className="font-display text-xl text-foreground">Hekate&apos;s Deipnon</p>
          <p className="text-xs text-text-tertiary mt-0.5">Dark of the moon</p>
        </div>
      </div>

      <p className="text-foreground/90 text-sm leading-relaxed">
        The Deipnon is the meal laid out for Hekate on the last night of the lunar
        month, the dark of the moon just before the new crescent returns. It marks
        the close of one cycle before the next begins.
      </p>

      <p className="text-foreground/90 text-sm leading-relaxed">
        Traditionally it is a night for clearing the house, settling debts, and
        carrying out what is finished. An offering is left at the crossroads for
        Hekate, who keeps the keys between the worlds, with thanks and a request
        for protection through the turn of the cycle.
      </p>

      <div className="border-l-2 border-amber/30 pl-3">
        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Observance</p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Cleanse and release, give the offering after dark, and do not look back
          on the way home.
        </p>
      </div>
    </div>
  );
}
