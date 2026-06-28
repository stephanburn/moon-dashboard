// ── Planetary transit data ──────────────────────────────────────────────────
// Mercury retrograde lookup table and Venus ingress table for 2025–2027.
// To extend: append new entries to MERCURY_RETROGRADES and VENUS_INGRESSES.

const DAY = 24 * 60 * 60 * 1000;

// Helper: local-midnight Date (month is 1-based)
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// ── Mercury Retrograde ──────────────────────────────────────────────────────

export interface MercuryRetrogradePeriod {
  shadowStart: Date;
  retrogradeStart: Date;
  retrogradeEnd: Date;
  shadowEnd: Date;
  signs: string;        // display label, e.g. "Aries / Pisces"
  signFlavour: string;  // sign-specific retrograde description
}

function retrograde(
  year: number,
  startMonth: number, startDay: number,
  endMonth: number,   endDay: number,
  signs: string,
  signFlavour: string,
  shadowDays = 14,
): MercuryRetrogradePeriod {
  const retrogradeStart = d(year, startMonth, startDay);
  const retrogradeEnd   = d(year, endMonth,   endDay);
  return {
    shadowStart:     new Date(retrogradeStart.getTime() - shadowDays * DAY),
    retrogradeStart,
    retrogradeEnd,
    shadowEnd:       new Date(retrogradeEnd.getTime()   + shadowDays * DAY),
    signs,
    signFlavour,
  };
}

export const MERCURY_RETROGRADES: MercuryRetrogradePeriod[] = [
  // 2025
  retrograde(2025, 3, 15, 4, 7,   'Aries / Pisces',
    'Communications and new ventures are prone to false starts. Revisit creative projects from the past — what began in fire may need grounding in water before it can proceed.'),
  retrograde(2025, 7, 18, 8, 11,  'Leo / Virgo',
    'Creative self-expression may feel blocked or misunderstood. Review artistic projects, double-check your work, and avoid grand declarations. Beliefs about your own talents may need revisiting.'),
  retrograde(2025, 11, 9, 11, 29, 'Sagittarius',
    'Philosophy and long-held beliefs come under scrutiny. Travel plans go awry and grand visions lose their clarity. Revisit where your faith is placed — not all maps lead where you think.'),

  // 2026
  retrograde(2026, 2, 26, 3, 20,  'Pisces',
    'Communication becomes foggy and boundaries dissolve. Intuition speaks louder than logic — listen to it, but verify what you hear. Past confusions and unresolved emotional matters resurface.'),
  retrograde(2026, 7, 2,  7, 26,  'Leo / Cancer',
    'Emotional communication is strained and creative projects may stall. Old feelings around home and belonging resurface. Revisit domestic matters and unfinished creative work before moving forward.'),
  retrograde(2026, 10, 25, 11, 15, 'Scorpio',
    'Deep psychological patterns and hidden truths come to the surface. Investigations and power dynamics in close relationships need careful navigation. Avoid irreversible decisions — what is hidden is not yet fully visible.'),

  // 2027
  retrograde(2027, 2, 9,  3, 3,   'Pisces / Aquarius',
    'The boundary between inspiration and confusion is especially thin. Technology and collective communication systems may be unreliable. Return to older, simpler methods of connection and expression.'),
  retrograde(2027, 6, 10, 7, 4,   'Cancer / Gemini',
    'Domestic matters and family communication become tangled. Misunderstandings between those close to you are likely — seek to understand rather than to be understood. Old correspondence may resurface.'),
  retrograde(2027, 10, 7, 10, 29, 'Scorpio / Libra',
    'Negotiations and agreements are prone to reversal. Buried resentments in partnerships may surface. Revisit commitments rather than making new ones, and resist the urge to expose secrets before all the facts are known.'),
];

export type MercuryStatus = 'retrograde' | 'pre-shadow' | 'post-shadow' | 'direct';

export interface MercuryInfo {
  status: MercuryStatus;
  period: MercuryRetrogradePeriod | null;
}

export function getMercuryStatus(now: Date): MercuryInfo {
  const t = now.getTime();
  for (const period of MERCURY_RETROGRADES) {
    // End dates are local-midnight markers, but a period runs through the END of
    // its end day. Extend each end bound by one day so the status doesn't flip a
    // day early (e.g. at 00:00 on the stated retrograde-end date).
    const retrogradeEnd = period.retrogradeEnd.getTime() + DAY;
    const shadowEnd     = period.shadowEnd.getTime() + DAY;
    if (t >= period.retrogradeStart.getTime() && t < retrogradeEnd) {
      return { status: 'retrograde', period };
    }
    if (t >= period.shadowStart.getTime() && t < period.retrogradeStart.getTime()) {
      return { status: 'pre-shadow', period };
    }
    if (t >= retrogradeEnd && t < shadowEnd) {
      return { status: 'post-shadow', period };
    }
  }
  return { status: 'direct', period: null };
}

export function getUpcomingMercuryRetrogrades(from: Date, count = 3): MercuryRetrogradePeriod[] {
  return MERCURY_RETROGRADES
    .filter(p => p.retrogradeStart > from)
    .slice(0, count);
}

// ── Venus Ingresses ─────────────────────────────────────────────────────────

export interface VenusIngress {
  sign: { name: string; symbol: string };
  date: Date;
}

// Lookup table of Venus sign changes.
// Dates for 2025 are approximate (affected by Venus retrograde Mar–May 2025).
// 2026 dates from ephemeris data. 2027 dates are approximate.
// To extend: append new entries at the end.
export const VENUS_INGRESSES: VenusIngress[] = [
  // 2025 (approximate, retrograde re-entries noted)
  { sign: { name: 'Pisces',      symbol: '♓' }, date: d(2025, 1,  3)  },
  { sign: { name: 'Aries',       symbol: '♈' }, date: d(2025, 2,  4)  },
  { sign: { name: 'Pisces',      symbol: '♓' }, date: d(2025, 4, 12)  }, // retrograde re-entry
  { sign: { name: 'Aries',       symbol: '♈' }, date: d(2025, 5, 31)  }, // stations direct
  { sign: { name: 'Taurus',      symbol: '♉' }, date: d(2025, 6, 26)  },
  { sign: { name: 'Gemini',      symbol: '♊' }, date: d(2025, 7, 30)  },
  { sign: { name: 'Cancer',      symbol: '♋' }, date: d(2025, 8, 25)  },
  { sign: { name: 'Leo',         symbol: '♌' }, date: d(2025, 9, 19)  },
  { sign: { name: 'Virgo',       symbol: '♍' }, date: d(2025, 10, 13) },
  { sign: { name: 'Libra',       symbol: '♎' }, date: d(2025, 11,  8) },
  { sign: { name: 'Scorpio',     symbol: '♏' }, date: d(2025, 12,  2) },
  { sign: { name: 'Sagittarius', symbol: '♐' }, date: d(2025, 12, 27) },

  // 2026
  { sign: { name: 'Capricorn',   symbol: '♑' }, date: d(2026, 1,  4)  },
  { sign: { name: 'Aquarius',    symbol: '♒' }, date: d(2026, 1, 28)  },
  { sign: { name: 'Pisces',      symbol: '♓' }, date: d(2026, 2, 22)  },
  { sign: { name: 'Aries',       symbol: '♈' }, date: d(2026, 3, 18)  },
  { sign: { name: 'Taurus',      symbol: '♉' }, date: d(2026, 4, 12)  },
  { sign: { name: 'Gemini',      symbol: '♊' }, date: d(2026, 5,  7)  },
  { sign: { name: 'Cancer',      symbol: '♋' }, date: d(2026, 6,  3)  },
  { sign: { name: 'Leo',         symbol: '♌' }, date: d(2026, 6, 29)  },
  { sign: { name: 'Virgo',       symbol: '♍' }, date: d(2026, 7, 25)  },
  { sign: { name: 'Libra',       symbol: '♎' }, date: d(2026, 8, 21)  },
  { sign: { name: 'Scorpio',     symbol: '♏' }, date: d(2026, 9, 18)  },
  { sign: { name: 'Sagittarius', symbol: '♐' }, date: d(2026, 10, 17) },
  { sign: { name: 'Capricorn',   symbol: '♑' }, date: d(2026, 11, 14) },
  { sign: { name: 'Aquarius',    symbol: '♒' }, date: d(2026, 12, 12) },

  // 2027 (approximate — no retrograde expected this year)
  { sign: { name: 'Pisces',      symbol: '♓' }, date: d(2027, 1,  8)  },
  { sign: { name: 'Aries',       symbol: '♈' }, date: d(2027, 2,  5)  },
  { sign: { name: 'Taurus',      symbol: '♉' }, date: d(2027, 3,  5)  },
  { sign: { name: 'Gemini',      symbol: '♊' }, date: d(2027, 4,  4)  },
  { sign: { name: 'Cancer',      symbol: '♋' }, date: d(2027, 5,  6)  },
  { sign: { name: 'Leo',         symbol: '♌' }, date: d(2027, 6,  2)  },
  { sign: { name: 'Virgo',       symbol: '♍' }, date: d(2027, 6, 28)  },
  { sign: { name: 'Libra',       symbol: '♎' }, date: d(2027, 7, 24)  },
  { sign: { name: 'Scorpio',     symbol: '♏' }, date: d(2027, 8, 20)  },
  { sign: { name: 'Sagittarius', symbol: '♐' }, date: d(2027, 9, 17)  },
  { sign: { name: 'Capricorn',   symbol: '♑' }, date: d(2027, 10, 14) },
  { sign: { name: 'Aquarius',    symbol: '♒' }, date: d(2027, 11, 11) },
  { sign: { name: 'Pisces',      symbol: '♓' }, date: d(2027, 12, 10) },
];

export function getCurrentVenusSign(now: Date): { name: string; symbol: string } | null {
  const past = VENUS_INGRESSES.filter(v => v.date <= now);
  if (past.length === 0) return null;
  return past[past.length - 1].sign;
}

export function getUpcomingVenusIngresses(from: Date, count = 10): VenusIngress[] {
  return VENUS_INGRESSES
    .filter(v => v.date > from)
    .slice(0, count);
}
