// ── Planetary transit data ──────────────────────────────────────────────────
// Mercury retrograde lookup table and Venus ingress table for 2025–2027.
// Station dates are the UTC calendar dates from astronomy-engine.
// To extend: append new entries to MERCURY_RETROGRADES and VENUS_INGRESSES.

import { addDays, makeDay as d, type CalendarDay } from './days';
import type { SignName } from './names';

// ── Mercury Retrograde ──────────────────────────────────────────────────────

export interface MercuryRetrogradePeriod {
  shadowStart: CalendarDay;
  retrogradeStart: CalendarDay;
  retrogradeEnd: CalendarDay;
  shadowEnd: CalendarDay;
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
    shadowStart:     addDays(retrogradeStart, -shadowDays),
    retrogradeStart,
    retrogradeEnd,
    shadowEnd:       addDays(retrogradeEnd, shadowDays),
    signs,
    signFlavour,
  };
}

export const MERCURY_RETROGRADES: MercuryRetrogradePeriod[] = [
  // 2025
  retrograde(2025, 3, 15, 4, 7,   'Aries / Pisces',
    'Communications and new ventures are prone to false starts. Revisit creative projects from the past — what began in fire may need grounding in water before it can proceed.'),
  retrograde(2025, 7, 18, 8, 11,  'Leo',
    'Creative self-expression may feel blocked or misunderstood. Review artistic projects, double-check your work, and avoid grand declarations. Beliefs about your own talents may need revisiting.'),
  retrograde(2025, 11, 9, 11, 29, 'Sagittarius / Scorpio',
    'Philosophy and long-held beliefs come under scrutiny. Travel plans go awry and grand visions lose their clarity. Revisit where your faith is placed — not all maps lead where you think.'),

  // 2026
  retrograde(2026, 2, 26, 3, 20,  'Pisces',
    'Communication becomes foggy and boundaries dissolve. Intuition speaks louder than logic — listen to it, but verify what you hear. Past confusions and unresolved emotional matters resurface.'),
  retrograde(2026, 6, 29, 7, 23,  'Cancer',
    'Emotional communication is strained and old feelings around home and belonging resurface. Family conversations need more patience than usual. Revisit domestic matters before moving forward.'),
  retrograde(2026, 10, 24, 11, 13, 'Scorpio',
    'Deep psychological patterns and hidden truths come to the surface. Investigations and power dynamics in close relationships need careful navigation. Avoid irreversible decisions — what is hidden is not yet fully visible.'),

  // 2027
  retrograde(2027, 2, 9,  3, 3,   'Pisces / Aquarius',
    'The boundary between inspiration and confusion is especially thin. Technology and collective communication systems may be unreliable. Return to older, simpler methods of connection and expression.'),
  retrograde(2027, 6, 10, 7, 4,   'Cancer / Gemini',
    'Domestic matters and family communication become tangled. Misunderstandings between those close to you are likely — seek to understand rather than to be understood. Old correspondence may resurface.'),
  retrograde(2027, 10, 7, 10, 28, 'Scorpio / Libra',
    'Negotiations and agreements are prone to reversal. Buried resentments in partnerships may surface. Revisit commitments rather than making new ones, and resist the urge to expose secrets before all the facts are known.'),
];

export type MercuryStatus = 'retrograde' | 'pre-shadow' | 'post-shadow' | 'direct';

export interface MercuryInfo {
  status: MercuryStatus;
  period: MercuryRetrogradePeriod | null;
}

// Periods are inclusive of both their start and end days.
export function getMercuryStatus(today: CalendarDay): MercuryInfo {
  for (const period of MERCURY_RETROGRADES) {
    if (today >= period.retrogradeStart && today <= period.retrogradeEnd) {
      return { status: 'retrograde', period };
    }
    if (today >= period.shadowStart && today < period.retrogradeStart) {
      return { status: 'pre-shadow', period };
    }
    if (today > period.retrogradeEnd && today <= period.shadowEnd) {
      return { status: 'post-shadow', period };
    }
  }
  return { status: 'direct', period: null };
}

/** Retrogrades starting strictly after `after`, up to and including `through`. */
export function getUpcomingMercuryRetrogrades(after: CalendarDay, through: CalendarDay): MercuryRetrogradePeriod[] {
  return MERCURY_RETROGRADES.filter(p => p.retrogradeStart > after && p.retrogradeStart <= through);
}

// ── Venus Ingresses ─────────────────────────────────────────────────────────

export interface VenusIngress {
  sign: SignName;
  day: CalendarDay;
  retrograde: boolean; // re-entering a sign while Venus is retrograde
}

// Lookup table of Venus sign changes: the UTC calendar date of each ingress,
// generated from astronomy-engine (geocentric apparent tropical longitude) and
// cross-checked by planets.test.ts. Includes the retrograde re-entries of
// Mar–Apr 2025 and Oct–Dec 2026.
// To extend: append new entries at the end.
export const VENUS_INGRESSES: VenusIngress[] = [
  // 2024
  { sign: 'Aquarius',    day: d(2024, 12,  7), retrograde: false },

  // 2025
  { sign: 'Pisces',      day: d(2025,  1,  3), retrograde: false },
  { sign: 'Aries',       day: d(2025,  2,  4), retrograde: false },
  { sign: 'Pisces',      day: d(2025,  3, 27), retrograde: true },
  { sign: 'Aries',       day: d(2025,  4, 30), retrograde: false },
  { sign: 'Taurus',      day: d(2025,  6,  6), retrograde: false },
  { sign: 'Gemini',      day: d(2025,  7,  4), retrograde: false },
  { sign: 'Cancer',      day: d(2025,  7, 31), retrograde: false },
  { sign: 'Leo',         day: d(2025,  8, 25), retrograde: false },
  { sign: 'Virgo',       day: d(2025,  9, 19), retrograde: false },
  { sign: 'Libra',       day: d(2025, 10, 13), retrograde: false },
  { sign: 'Scorpio',     day: d(2025, 11,  6), retrograde: false },
  { sign: 'Sagittarius', day: d(2025, 11, 30), retrograde: false },
  { sign: 'Capricorn',   day: d(2025, 12, 24), retrograde: false },

  // 2026
  { sign: 'Aquarius',    day: d(2026,  1, 17), retrograde: false },
  { sign: 'Pisces',      day: d(2026,  2, 10), retrograde: false },
  { sign: 'Aries',       day: d(2026,  3,  6), retrograde: false },
  { sign: 'Taurus',      day: d(2026,  3, 30), retrograde: false },
  { sign: 'Gemini',      day: d(2026,  4, 24), retrograde: false },
  { sign: 'Cancer',      day: d(2026,  5, 19), retrograde: false },
  { sign: 'Leo',         day: d(2026,  6, 13), retrograde: false },
  { sign: 'Virgo',       day: d(2026,  7,  9), retrograde: false },
  { sign: 'Libra',       day: d(2026,  8,  6), retrograde: false },
  { sign: 'Scorpio',     day: d(2026,  9, 10), retrograde: false },
  { sign: 'Libra',       day: d(2026, 10, 25), retrograde: true },
  { sign: 'Scorpio',     day: d(2026, 12,  4), retrograde: false },

  // 2027
  { sign: 'Sagittarius', day: d(2027,  1,  7), retrograde: false },
  { sign: 'Capricorn',   day: d(2027,  2,  3), retrograde: false },
  { sign: 'Aquarius',    day: d(2027,  3,  1), retrograde: false },
  { sign: 'Pisces',      day: d(2027,  3, 26), retrograde: false },
  { sign: 'Aries',       day: d(2027,  4, 20), retrograde: false },
  { sign: 'Taurus',      day: d(2027,  5, 14), retrograde: false },
  { sign: 'Gemini',      day: d(2027,  6,  8), retrograde: false },
  { sign: 'Cancer',      day: d(2027,  7,  3), retrograde: false },
  { sign: 'Leo',         day: d(2027,  7, 27), retrograde: false },
  { sign: 'Virgo',       day: d(2027,  8, 20), retrograde: false },
  { sign: 'Libra',       day: d(2027,  9, 14), retrograde: false },
  { sign: 'Scorpio',     day: d(2027, 10,  8), retrograde: false },
  { sign: 'Sagittarius', day: d(2027, 11,  1), retrograde: false },
  { sign: 'Capricorn',   day: d(2027, 11, 25), retrograde: false },
  { sign: 'Aquarius',    day: d(2027, 12, 19), retrograde: false },
];

export function getCurrentVenusSign(today: CalendarDay): SignName | null {
  return VENUS_INGRESSES.findLast(v => v.day <= today)?.sign ?? null;
}

/** Ingresses strictly after `after`, up to and including `through`. */
export function getUpcomingVenusIngresses(after: CalendarDay, through: CalendarDay): VenusIngress[] {
  return VENUS_INGRESSES.filter(v => v.day > after && v.day <= through);
}
