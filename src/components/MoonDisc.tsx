import { useId } from 'react';
import { moonGeometry } from '@/lib/moonDisc';
import type { Hemisphere } from '@/lib/timezones';

// Drawn in a fixed 200×200 viewBox; the caller controls display size via CSS.
const SIZE = 200;
const C = SIZE / 2;
const R = 92; // leaves a little breathing room inside the viewBox for the limb glow

// Near-side maria, approximating the real "man in the moon" arrangement so the
// disc is recognisable rather than generically blotchy. Coordinates are viewBox
// units (disc centred at 100,100, r≈92), north up. Each mare is one or more
// overlapping blobs; per-blob opacity (o) keeps the patches irregular rather
// than stamped. Fixed (no randomness) so server and client agree.
const MARIA = [
  // Mare Frigoris — thin arc near the north limb
  { cx: 96,  cy: 44,  rx: 30, ry: 5,  o: 0.14 },
  // Mare Imbrium — the large "left eye"
  { cx: 76,  cy: 64,  rx: 23, ry: 18, o: 0.30 },
  { cx: 64,  cy: 56,  rx: 12, ry: 10, o: 0.20 },
  // Mare Serenitatis — the "right eye"
  { cx: 116, cy: 66,  rx: 15, ry: 15, o: 0.30 },
  // Mare Tranquillitatis — right cheek, trailing down from Serenitatis
  { cx: 132, cy: 90,  rx: 16, ry: 15, o: 0.27 },
  // Mare Crisium — isolated oval near the eastern limb (a strong landmark)
  { cx: 152, cy: 72,  rx: 9,  ry: 8,  o: 0.34 },
  // Mare Fecunditatis / Nectaris — lower right
  { cx: 138, cy: 112, rx: 10, ry: 13, o: 0.24 },
  { cx: 127, cy: 126, rx: 7,  ry: 8,  o: 0.21 },
  // Oceanus Procellarum — the large dark expanse down the western side
  { cx: 56,  cy: 92,  rx: 18, ry: 20, o: 0.21 },
  { cx: 52,  cy: 120, rx: 14, ry: 16, o: 0.19 },
  { cx: 65,  cy: 78,  rx: 10, ry: 12, o: 0.17 },
  // Mare Nubium / Cognitum — the "mouth", lower centre
  { cx: 94,  cy: 130, rx: 15, ry: 9,  o: 0.23 },
  // Mare Humorum — small, lower left
  { cx: 72,  cy: 134, rx: 8,  ry: 8,  o: 0.19 },
  // Sinus Aestuum — faint "nose" at the centre
  { cx: 100, cy: 96,  rx: 7,  ry: 10, o: 0.15 },
];

// The brightest ray-craters read as pale specks at full-disc scale — the
// opposite of the dark pits they look like up close. Kept subtle so they
// don't speckle the face.
const HIGHLIGHTS = [
  { cx: 92, cy: 152, r: 4,   o: 0.45 }, // Tycho
  { cx: 78, cy: 104, r: 3.5, o: 0.40 }, // Copernicus
  { cx: 58, cy: 104, r: 2.5, o: 0.32 }, // Kepler
  { cx: 44, cy: 92,  r: 2.5, o: 0.36 }, // Aristarchus
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

        {/* Soft glow for the bright ray-craters that fades to nothing at the rim. */}
        <radialGradient id={craterId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.9)" />
          <stop offset="55%"  stopColor="rgba(248,248,255,0.35)" />
          <stop offset="100%" stopColor="rgba(248,248,255,0)" />
        </radialGradient>

        {/* Soften the terminator so the day/night line isn't a hard edge. */}
        <filter id={softId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>

        {/* Blur the maria into diffuse patches rather than hard shapes. */}
        <filter id={mariaSoftId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
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

      {/* Surface texture, clipped to the lit face so it vanishes at the terminator.
          Southern-hemisphere viewers see the whole near side rotated 180°. */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={hemisphere === 'south' ? `rotate(180 ${C} ${C})` : undefined}>
          <g filter={`url(#${mariaSoftId})`}>
            {MARIA.map((m, i) => (
              <ellipse
                key={i}
                cx={m.cx}
                cy={m.cy}
                rx={m.rx}
                ry={m.ry}
                fill="#454b76"
                fillOpacity={m.o}
              />
            ))}
          </g>
          {HIGHLIGHTS.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={`url(#${craterId})`} opacity={c.o} />
          ))}
        </g>
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
