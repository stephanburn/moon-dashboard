import { useId } from 'react';
import { moonGeometry } from '@/lib/moonDisc';
import type { Hemisphere } from '@/lib/timezones';

// Drawn in a fixed 200×200 viewBox; the caller controls display size via CSS.
const SIZE = 200;
const C = SIZE / 2;
const R = 92; // leaves a little breathing room inside the viewBox for the limb glow

// Fixed surface features (no randomness, so server and client agree and the face
// stays recognisable). Coordinates are in viewBox units, centred on the disc.
const MARIA = [
  { cx: 76,  cy: 74,  rx: 24, ry: 19 },
  { cx: 120, cy: 96,  rx: 18, ry: 22 },
  { cx: 86,  cy: 124, rx: 20, ry: 15 },
  { cx: 128, cy: 60,  rx: 12, ry: 11 },
];

const CRATERS = [
  { cx: 60,  cy: 100, r: 7 },
  { cx: 104, cy: 52,  r: 5 },
  { cx: 134, cy: 122, r: 5 },
  { cx: 96,  cy: 94,  r: 4 },
  { cx: 116, cy: 140, r: 3.5 },
  { cx: 64,  cy: 68,  r: 3.5 },
];

interface Props {
  fraction: number;   // 0-1 illuminated fraction
  waxing: boolean;    // SunCalc phase < 0.5
  hemisphere: Hemisphere;
  className?: string;
}

/**
 * The current moon, drawn from its true illuminated fraction and oriented for
 * the viewer's hemisphere. Decorative — the accessible name lives on the
 * wrapping element in Dashboard, so the SVG itself is aria-hidden.
 */
export default function MoonDisc({ fraction, waxing, hemisphere, className = '' }: Props) {
  const uid = useId();
  const litId = `moon-lit-${uid}`;
  const bodyId = `moon-body-${uid}`;
  const softId = `moon-soft-${uid}`;
  const clipId = `moon-clip-${uid}`;
  const mariaSoftId = `moon-maria-${uid}`;
  const craterId = `moon-crater-${uid}`;

  const { litPath, litRight } = moonGeometry(fraction, waxing, hemisphere, C, C, R);

  // Offset the silver highlight toward the lit limb so the face reads as a sphere.
  const hx = litRight ? '65%' : '35%';

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Unlit body: a sphere in shadow, faintly lit by earthshine. */}
        <radialGradient id={bodyId} cx="50%" cy="42%" r="62%">
          <stop offset="0%"   stopColor="#23244a" />
          <stop offset="70%"  stopColor="#181938" />
          <stop offset="100%" stopColor="#101028" />
        </radialGradient>

        {/* Lit face: silver with the highlight toward the bright limb. */}
        <radialGradient id={litId} cx={hx} cy="38%" r="75%">
          <stop offset="0%"   stopColor="#f6f6ff" />
          <stop offset="55%"  stopColor="#d4d4e4" />
          <stop offset="100%" stopColor="#b6b6cc" />
        </radialGradient>

        {/* Soft, pit-like crater shading that fades to nothing at the rim. */}
        <radialGradient id={craterId} cx="42%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="rgba(48,52,86,0.50)" />
          <stop offset="65%"  stopColor="rgba(64,68,104,0.26)" />
          <stop offset="100%" stopColor="rgba(120,124,150,0)" />
        </radialGradient>

        {/* Soften the terminator so the day/night line isn't a hard edge. */}
        <filter id={softId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>

        {/* Blur the maria into diffuse patches rather than hard shapes. */}
        <filter id={mariaSoftId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        {/* Confine all surface texture to the illuminated region. */}
        <clipPath id={clipId}>
          <path d={litPath} />
        </clipPath>
      </defs>

      {/* Body disc — keeps the moon visible (earthshine) even at New Moon. */}
      <circle cx={C} cy={C} r={R} fill={`url(#${bodyId})`} />

      {/* Illuminated region. */}
      <path d={litPath} fill={`url(#${litId})`} filter={`url(#${softId})`} />

      {/* Surface texture, clipped to the lit face so it vanishes at the terminator. */}
      <g clipPath={`url(#${clipId})`}>
        <g filter={`url(#${mariaSoftId})`}>
          {MARIA.map((m, i) => (
            <ellipse
              key={i}
              cx={m.cx}
              cy={m.cy}
              rx={m.rx}
              ry={m.ry}
              fill="rgba(72,78,118,0.26)"
            />
          ))}
        </g>
        {CRATERS.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={`url(#${craterId})`} />
        ))}
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
