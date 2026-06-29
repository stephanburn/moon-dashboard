'use client';

import { useEffect, useState } from 'react';
import { MOON_CORRESPONDENCES } from '@/data/moonCorrespondences';
import { ZODIAC_CORRESPONDENCES } from '@/data/zodiacCorrespondences';
import { SABBAT_CORRESPONDENCES } from '@/data/sabbatCorrespondences';
import { MOON_SIGN_CORRESPONDENCES } from '@/data/moonSignCorrespondences';
import { VENUS_CORRESPONDENCES } from '@/data/venusCorrespondences';
import type { MoonSignChange } from '@/lib/astro';

// ── Content shape discriminated union ──────────────────────────────────────

export interface MoonDetailContent {
  type: 'moon';
  phaseName: string;
  illumination?: number; // 0-100; present only for the current moon, not future events
  ageInDays?: number;    // 0-29.5; present only for the current moon
  moonSignChanges?: MoonSignChange[];
  timezone?: string;
}

export interface ZodiacDetailContent {
  type: 'zodiac';
  signName: string;
}

export interface SabbatDetailContent {
  type: 'sabbat';
  sabbatName: string;
}

export interface VenusDetailContent {
  type: 'venus';
  signName: string;
}

export interface MercuryRetroDetailContent {
  type: 'mercury-retrograde';
  signs: string;
  signFlavour: string;
}

export interface MoonSignDetailContent {
  type: 'moonSign';
  signName: string;
  signSymbol: string;
}

export interface DataExpiryDetailContent {
  type: 'data-expiry';
}

export type DetailContent =
  | MoonDetailContent
  | ZodiacDetailContent
  | SabbatDetailContent
  | VenusDetailContent
  | MercuryRetroDetailContent
  | MoonSignDetailContent
  | DataExpiryDetailContent;

// ── Helpers ────────────────────────────────────────────────────────────────

function CorrespondenceRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-amber/60 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-text-secondary text-sm leading-relaxed">{items.join(', ')}</p>
    </div>
  );
}

function formatTransitTime(date: Date, timezone: string): string {
  const datePart = date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: timezone,
  });
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  });
  return `${datePart}, ${timePart}`;
}

// ── Sub-renderers ──────────────────────────────────────────────────────────

function MoonDetail({ phaseName, illumination, ageInDays, moonSignChanges, timezone }: {
  phaseName: string;
  illumination?: number;
  ageInDays?: number;
  moonSignChanges?: MoonSignChange[];
  timezone?: string;
}) {
  const [expandedTransit, setExpandedTransit] = useState<string | null>(null);
  const data = MOON_CORRESPONDENCES[phaseName];
  if (!data) return <p className="text-text-tertiary text-sm">No data found for {phaseName}.</p>;

  return (
    <div className="space-y-4">
      {typeof illumination === 'number' && typeof ageInDays === 'number' && (
        <p className="text-xs text-text-tertiary">
          <span className="text-amber-light text-sm font-medium">{illumination}%</span>
          {' '}illuminated
          <span className="text-white/15">{' · '}</span>
          Day{' '}
          <span className="text-amber-light text-sm font-medium">{ageInDays}</span>
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

      {/* Lunar Transits */}
      {moonSignChanges && moonSignChanges.length > 0 && timezone && (
        <div className="pt-2 border-t border-white/5 space-y-1">
          <p className="text-amber/60 text-xs uppercase tracking-wider mb-2">Lunar Transits</p>
          {moonSignChanges.map(change => {
            const key = `${change.name}-${change.enterTime.getTime()}`;
            const isOpen = expandedTransit === key;
            const corr = MOON_SIGN_CORRESPONDENCES[change.name];
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setExpandedTransit(isOpen ? null : key)}
                  aria-expanded={isOpen}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-hover-surface bg-transparent border-0 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 ${isOpen ? 'bg-hover-surface' : ''}`}
                >
                  <span className="text-sm text-text-secondary">
                    Moon enters <span className="text-foreground">{change.name} {change.symbol}</span>
                  </span>
                  <span className="text-xs text-text-tertiary flex-shrink-0">
                    {formatTransitTime(change.enterTime, timezone)}
                  </span>
                </button>
                {isOpen && corr && (
                  <div className="mx-3 mb-1 px-3 py-2 rounded-lg bg-hover-surface border border-white/6">
                    <p className="text-xs text-text-secondary leading-relaxed">{corr.energy}</p>
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

function MoonSignDetail({ signName, signSymbol }: { signName: string; signSymbol: string }) {
  const data = MOON_SIGN_CORRESPONDENCES[signName];
  const zodiac = ZODIAC_CORRESPONDENCES[signName];
  if (!data) return <p className="text-text-tertiary text-sm">No data found for Moon in {signName}.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-text-secondary text-xl select-none">☽</span>
        <span className="font-display text-3xl text-amber-light">{signSymbol}</span>
        <div>
          <p className="font-display text-xl text-foreground">Moon in {signName}</p>
          {zodiac && (
            <p className="text-xs text-text-tertiary mt-0.5">{zodiac.element} · {zodiac.modality}</p>
          )}
        </div>
      </div>
      <p className="text-foreground/90 text-sm leading-relaxed">{data.energy}</p>
    </div>
  );
}

function ZodiacDetail({ signName }: { signName: string }) {
  const data = ZODIAC_CORRESPONDENCES[signName];
  if (!data) return <p className="text-text-tertiary text-sm">No data found for {signName}.</p>;

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

function SabbatDetail({ sabbatName }: { sabbatName: string }) {
  const data = SABBAT_CORRESPONDENCES[sabbatName];
  if (!data) return <p className="text-text-tertiary text-sm">No data found for {sabbatName}.</p>;

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

function VenusDetail({ signName }: { signName: string }) {
  const data = VENUS_CORRESPONDENCES[signName];
  const zodiac = ZODIAC_CORRESPONDENCES[signName];
  if (!data) return <p className="text-text-tertiary text-sm">No data found for Venus in {signName}.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl text-amber-light">♀</span>
        {zodiac && (
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl text-foreground">{zodiac.symbol}</span>
            <span className="font-display text-2xl text-foreground">{signName}</span>
          </div>
        )}
      </div>

      <p className="text-foreground/90 text-sm leading-relaxed">{data.energy}</p>

      {zodiac && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <CorrespondenceRow label="Colours"  items={zodiac.colours} />
          <CorrespondenceRow label="Crystals" items={zodiac.crystals} />
        </div>
      )}
    </div>
  );
}

function MercuryRetroDetail({ signs, signFlavour }: { signs: string; signFlavour: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl text-amber-light">☿℞</span>
        <span className="text-sm text-text-secondary">{signs}</span>
      </div>

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
        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{signs}</p>
        <p className="text-sm text-text-secondary leading-relaxed">{signFlavour}</p>
      </div>
    </div>
  );
}

function DataExpiryDetail() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-amber-light text-xl">⚠</span>
        <p className="font-display text-lg text-foreground">Planetary data expiring</p>
      </div>
      <p className="text-foreground/90 text-sm leading-relaxed">
        The Venus and Mercury lookup tables in this dashboard cover up to 31 December 2027.
        After that date, planetary positions will be incorrect. To keep the dashboard accurate,
        the data in <code className="text-amber/70 text-xs">src/lib/planets.ts</code> needs
        to be extended with ephemeris data for 2028 and beyond.
      </p>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────

interface Props {
  content: DetailContent | null;
  onClose: () => void;
  id?: string;
}

export default function DetailPanel({ content, onClose, id }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (content) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      // Reset the enter-animation flag when the panel closes so it replays on the
      // next open; this drives a CSS transition, an external-system sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, [content]);

  if (!content) return null;

  return (
    // grid-template-rows: 0fr → 1fr animates to natural content height without
    // the fixed max-height cap that truncates tall panels.
    <div
      id={id}
      className="detail-panel"
      style={{
        display: 'grid',
        gridTemplateRows: visible ? '1fr' : '0fr',
        opacity: visible ? 1 : 0,
        transition: 'grid-template-rows 0.3s ease, opacity 0.25s ease',
      }}
    >
      <div className="overflow-hidden">
        <div
          className="mt-2 rounded-xl border border-white/8 border-l-2 p-5 relative"
          style={{
            background: 'rgba(18, 18, 52, 0.85)',
            borderLeftColor: 'var(--amber)',
          }}
        >
          {/* Close button — min 44px touch target */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-silver/50 hover:text-text-secondary transition-colors text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40 focus-visible:rounded"
            aria-label="Close panel"
          >
            ×
          </button>

          {/* Content */}
          <div className="pr-6">
            {content.type === 'moon'               && <MoonDetail         phaseName={content.phaseName} illumination={content.illumination} ageInDays={content.ageInDays} moonSignChanges={content.moonSignChanges} timezone={content.timezone} />}
            {content.type === 'moonSign'           && <MoonSignDetail     signName={content.signName} signSymbol={content.signSymbol} />}
            {content.type === 'zodiac'             && <ZodiacDetail       signName={content.signName} />}
            {content.type === 'sabbat'             && <SabbatDetail       sabbatName={content.sabbatName} />}
            {content.type === 'venus'              && <VenusDetail        signName={content.signName} />}
            {content.type === 'mercury-retrograde' && <MercuryRetroDetail signs={content.signs} signFlavour={content.signFlavour} />}
            {content.type === 'data-expiry'        && <DataExpiryDetail />}
          </div>
        </div>
      </div>
    </div>
  );
}
