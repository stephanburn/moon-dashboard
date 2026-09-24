'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  id?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The expandable panel chrome shared by every disclosure: enter animation and
 * close button. The content comes from components/details.tsx. Rendered only
 * while open, so the enter animation replays on each open.
 */
export default function DetailPanel({ id, onClose, children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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

          <div className="pr-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
