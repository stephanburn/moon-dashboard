import { useId } from 'react';
import { moonGeometry } from '@/lib/moonDisc';
import type { Hemisphere } from '@/lib/timezones';

// Drawn in a fixed 200×200 viewBox; the caller controls display size via CSS.
const SIZE = 200;
const C = SIZE / 2;
const R = 92; // leaves a little breathing room inside the viewBox for the limb glow

// The NASA full-moon photo (public domain) is a centred disc filling 46.875% of
// the frame's half-width. Map that disc exactly onto our radius-R circle so the
// phase shadow lines up with the photographed limb. Derived from the image's
// luminance bounding box (centre ≈ frame centre, radius ≈ 0.46875·width).
const DISC_FRACTION = 0.46875;
const IMG = R / DISC_FRACTION;        // rendered image edge length in viewBox units
const IMG_OFFSET = C - IMG / 2;       // top-left so the disc centre sits at (C, C)

interface Props {
  fraction: number;   // 0-1 illuminated fraction
  waxing: boolean;    // SunCalc phase < 0.5
  hemisphere: Hemisphere;
  className?: string;
}

/**
 * The current moon: a real photograph of the full disc with the unlit portion
 * darkened by a phase mask. The shadow is translucent rather than black, so even
 * a New Moon shows a faint earthshine disc. Oriented for the viewer's hemisphere
 * (southern viewers see the near side rotated 180°).
 *
 * Decorative — the accessible name lives on the wrapping element in Dashboard,
 * so the SVG itself is aria-hidden.
 */
export default function MoonDisc({ fraction, waxing, hemisphere, className = '' }: Props) {
  const uid = useId();
  const discId = `moon-disc-${uid}`;
  const shadowId = `moon-shadow-${uid}`;
  const softId = `moon-soft-${uid}`;

  const { litPath } = moonGeometry(fraction, waxing, hemisphere, C, C, R);

  // Southern-hemisphere viewers see the whole near side rotated 180°. The lit
  // limb is already mirrored inside moonGeometry, so only the photo rotates.
  const photoTransform = hemisphere === 'south' ? `rotate(180 ${C} ${C})` : undefined;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Confine the photo to the disc, clipping the image's black corners. */}
        <clipPath id={discId}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>

        {/* Soften the day/night terminator so it isn't a hard edge. */}
        <filter id={softId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>

        {/* Shadow mask: white shows the shadow, the lit region punches it back
            out. Luminance mask, so the lit path is painted black. */}
        <mask id={shadowId} maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
          <circle cx={C} cy={C} r={R} fill="#fff" />
          <path d={litPath} fill="#000" filter={`url(#${softId})`} />
        </mask>
      </defs>

      <g clipPath={`url(#${discId})`}>
        {/* The photographed full moon. */}
        <image
          href="/moon.jpg"
          x={IMG_OFFSET}
          y={IMG_OFFSET}
          width={IMG}
          height={IMG}
          transform={photoTransform}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Darken the unlit portion. Not opaque — the photo still shows through
            faintly as earthshine, so a New Moon reads as a dim disc, not a hole. */}
        <rect
          x="0"
          y="0"
          width={SIZE}
          height={SIZE}
          fill="rgba(7,9,24,0.86)"
          mask={`url(#${shadowId})`}
        />
      </g>

      {/* Limb hairline to define the edge against the dark sky. */}
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="rgba(200,200,216,0.18)"
        strokeWidth="1"
      />
    </svg>
  );
}
