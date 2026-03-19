'use client';

import { useEffect, useRef, useState } from 'react';
import { MOON_CORRESPONDENCES } from '@/data/moonCorrespondences';
import { ZODIAC_CORRESPONDENCES } from '@/data/zodiacCorrespondences';
import { SABBAT_CORRESPONDENCES } from '@/data/sabbatCorrespondences';

// ── Content shape discriminated union ──────────────────────────────────────

export interface MoonDetailContent {
  type: 'moon';
  phaseName: string;
}

export interface ZodiacDetailContent {
  type: 'zodiac';
  signName: string;
}

export interface SabbatDetailContent {
  type: 'sabbat';
  sabbatName: string;
}

export type DetailContent = MoonDetailContent | ZodiacDetailContent | SabbatDetailContent;

// ── Sub-renderers ──────────────────────────────────────────────────────────

function CorrespondenceRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-amber/60 text-xs uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-silver/65 text-sm leading-relaxed">{items.join(', ')}</p>
    </div>
  );
}

function MoonDetail({ phaseName }: { phaseName: string }) {
  const data = MOON_CORRESPONDENCES[phaseName];
  if (!data) return <p className="text-silver/40 text-sm">No data found for {phaseName}.</p>;

  return (
    <div className="space-y-4">
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
          <p className="text-xs text-silver/50 uppercase tracking-wider mb-1">Esbat</p>
          <p className="text-sm text-silver/70 leading-relaxed">{data.esbatNote}</p>
        </div>
      )}
    </div>
  );
}

function ZodiacDetail({ signName }: { signName: string }) {
  const data = ZODIAC_CORRESPONDENCES[signName];
  if (!data) return <p className="text-silver/40 text-sm">No data found for {signName}.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-display text-3xl text-amber-light">{data.symbol}</span>
        <div className="flex gap-3 text-xs text-silver/50 flex-wrap">
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
  if (!data) return <p className="text-silver/40 text-sm">No data found for {sabbatName}.</p>;

  return (
    <div className="space-y-4">
      <div>
        {data.alternateNames.length > 0 && (
          <p className="text-xs text-silver/40 mb-1">{data.alternateNames.join(' · ')}</p>
        )}
        <p className="text-xs text-amber-light/60 mb-3">{data.dateDescription}</p>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.mythology}</p>
      </div>

      <div>
        <p className="text-xs text-silver/40 uppercase tracking-wider mb-1">Themes</p>
        <p className="text-sm text-silver/70">{data.themes.join(' · ')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <CorrespondenceRow label="Colours"  items={data.colours} />
        <CorrespondenceRow label="Crystals" items={data.crystals} />
        <CorrespondenceRow label="Herbs"    items={data.herbs} />
        <CorrespondenceRow label="Foods"    items={data.foods} />
      </div>

      <div className="border-l-2 border-amber/30 pl-3">
        <p className="text-xs text-silver/50 uppercase tracking-wider mb-1">Ritual Focus</p>
        <p className="text-sm text-silver/70 leading-relaxed">{data.ritualFocus}</p>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────

interface Props {
  content: DetailContent | null;
  onClose: () => void;
}

export default function DetailPanel({ content, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (content) {
      // Small delay so the element is in the DOM before we animate in
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [content]);

  if (!content) return null;

  return (
    <div
      ref={panelRef}
      className="detail-panel overflow-hidden"
      style={{
        maxHeight: visible ? '600px' : '0',
        opacity: visible ? 1 : 0,
        transition: 'max-height 0.3s ease, opacity 0.25s ease',
      }}
    >
      <div
        className="mt-2 rounded-xl border border-white/8 border-l-2 p-5 relative"
        style={{
          background: 'rgba(18, 18, 52, 0.85)',
          borderLeftColor: 'var(--amber)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-silver/30 hover:text-silver/70 transition-colors text-lg leading-none"
          aria-label="Close panel"
        >
          ×
        </button>

        {/* Content */}
        <div className="pr-6">
          {content.type === 'moon'    && <MoonDetail    phaseName={content.phaseName} />}
          {content.type === 'zodiac'  && <ZodiacDetail  signName={content.signName} />}
          {content.type === 'sabbat'  && <SabbatDetail  sabbatName={content.sabbatName} />}
        </div>
      </div>
    </div>
  );
}
