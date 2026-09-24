/**
 * The "there's more here" affordance on every disclosure: an amber chevron in a
 * small ringed badge, rotating when its panel is open. One component so every
 * tappable item carries the same, recognisable cue. `nudge` plays a one-off
 * attention bounce (used to teach first-time visitors; off under reduced motion).
 */
export default function Chevron({ open, nudge = false }: { open: boolean; nudge?: boolean }) {
  return (
    <span
      aria-hidden
      data-chevron
      className={`chevron-badge flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-amber/35 bg-amber/10 text-amber-light/90 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''} ${nudge && !open ? 'chevron-nudge' : ''}`}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </span>
  );
}
