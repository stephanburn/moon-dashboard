import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getMoonPhaseInfo, getUpcomingMajorPhases } from '@/lib/moon';
import { getCurrentMoonSign, getCurrentSunSign, getNextSunSignIngress } from '@/lib/astro';
import { getUpcomingSabbats } from '@/lib/sabbats';
import { moonGeometry } from '@/lib/moonDisc';
import { MOON_CORRESPONDENCES } from '@/data/moonCorrespondences';

const alt = 'Current moon phase, zodiac transit, and the next sabbat';
const size = { width: 1200, height: 630 };
const contentType = 'image/png';

// Regenerate hourly so the card stays current. Note: Discord caches the image
// per-URL, so an already-posted embed will not tick forward — only fresh posts
// pick up the new render.
export const revalidate = 3600;

// Discord and other unfurlers cache the OG image per-URL and never re-fetch, so
// a stable image URL freezes any already-posted embed on the day it was first
// scraped. Stamping the URL path with a UTC date id makes each day's card a
// distinct URL, so fresh posts pull current data. Relies on the page's ISR
// (`revalidate` in page.tsx) to advance the emitted <meta> tag daily.
export function generateImageMetadata() {
  const id = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return [{ id, alt, size, contentType }];
}

// The OG card is shared generically, so it is rendered for the northern
// hemisphere in UTC rather than any one viewer's zone.
const DAY = 86_400_000;

// Whole-day countdown phrased "today / tomorrow / in N days" — always days, never
// weeks, regardless of distance.
function inDays(target: Date, now: Date): string {
  const d = Math.round((target.getTime() - now.getTime()) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

function forDays(target: Date, now: Date): string {
  const d = Math.max(0, Math.round((target.getTime() - now.getTime()) / DAY));
  return d === 1 ? 'for 1 day' : `for ${d} days`;
}

export default async function Image() {
  const [serif, serifBold, italic] = await Promise.all([
    readFile(join(process.cwd(), 'assets/CormorantGaramond-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/CormorantGaramond-SemiBold.ttf')),
    readFile(join(process.cwd(), 'assets/CormorantGaramond-Italic.ttf')),
  ]);

  const now = new Date();
  const moon = getMoonPhaseInfo(now);
  const moonSign = getCurrentMoonSign(now);
  const sunSign = getCurrentSunSign(now);
  const sunIngress = getNextSunSignIngress(now);
  const nextPhase = getUpcomingMajorPhases(now, 2)[0];
  const nextSabbat = getUpcomingSabbats(now, 12, 'north')[0];
  const energy = MOON_CORRESPONDENCES[moon.name]?.energy ?? '';

  // Real phase disc via the same geometry the dashboard uses.
  const R = 150;
  const C = 160;
  const { litPath } = moonGeometry(moon.fraction, moon.phase < 0.5, 'north', C, C, R);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 64px',
          background: '#0b0d17',
          color: '#f2f0f8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 56, flex: 1 }}>
          <svg width={336} height={336} viewBox="0 0 320 320" style={{ flexShrink: 0 }}>
            <circle cx={C} cy={C} r={R} fill="#161a2b" />
            <path d={litPath} fill="#f2f0f8" />
            <circle cx={C} cy={C} r={R} fill="none" stroke="#34396040" strokeWidth={2} />
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 28, letterSpacing: 6, color: '#9690c4' }}>MOON DASHBOARD</div>
            <div style={{ fontSize: 96, fontWeight: 600, lineHeight: 1.0, marginTop: 4 }}>{moon.name}</div>

            <div style={{ fontSize: 42, color: '#dad6f4', marginTop: 14 }}>
              {`In ${moonSign.name} ${moonSign.symbol} · ${nextPhase.name} ${inDays(nextPhase.date, now)}`}
            </div>

            {energy && (
              <div style={{ fontSize: 37, fontStyle: 'italic', color: '#b0aada', marginTop: 2 }}>
                {energy}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 26, fontSize: 39 }}>
              <div style={{ display: 'flex' }}>
                {`Sun in ${sunSign.sign.name} `}
                <span style={{ color: '#9690c4', marginLeft: 10 }}>{forDays(sunIngress.date, now)}</span>
              </div>
              {nextSabbat && (
                <div style={{ display: 'flex' }}>
                  Next sabbat
                  <span style={{ color: '#9690c4', marginLeft: 10 }}>
                    {`· ${nextSabbat.displayName} ${inDays(nextSabbat.date, now)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 33,
            letterSpacing: 3,
            color: '#938ec0',
          }}
        >
          CLICK LINK FOR LIVE DATA AND CORRESPONDENCES →
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cormorant Garamond', data: serif, style: 'normal', weight: 400 },
        { name: 'Cormorant Garamond', data: serifBold, style: 'normal', weight: 600 },
        { name: 'Cormorant Garamond', data: italic, style: 'italic', weight: 400 },
      ],
    },
  );
}
