import { CRAFT_ACTIVITIES, CRAFT_ELEMENTS, DAY_RULERS, type CraftActivity } from '@/data/craftActivities';
import { getUpcomingMajorPhases } from './moon';
import { getSabbatContext, type Sabbat } from './sabbats';
import { dayOf, dayToUTCMs, diffDays, type CalendarDay } from './days';
import type { MajorPhaseName } from './names';
import type { Hemisphere } from './timezones';

const DAY_MS = 86_400_000;

/** What the daily craft activities need to know about today. */
export interface CraftContext {
  today: CalendarDay;
  weekday: string;
  planet: string;
  sabbatToday: Sabbat | null;
  nextSabbat: Sabbat | null;
  nextPhase: MajorPhaseName;
  /** Set when today is within a day of a New or Full Moon (for moonwater). */
  moonwater: { phase: 'New Moon' | 'Full Moon'; offsetDays: -1 | 0 | 1 } | null;
}

export function getCraftContext(now: Date, timezone: string, hemisphere: Hemisphere): CraftContext {
  const today = dayOf(now, timezone);
  const { weekday, planet } = DAY_RULERS[new Date(dayToUTCMs(today)).getUTCDay()];
  const sabbats = getSabbatContext(today, hemisphere, timezone);

  // Quarters are ~7.4 days apart, so ten days always holds the next one.
  const nextPhase = getUpcomingMajorPhases(now, new Date(now.getTime() + 10 * DAY_MS))[0].name;

  let moonwater: CraftContext['moonwater'] = null;
  for (const p of getUpcomingMajorPhases(new Date(now.getTime() - 3 * DAY_MS), new Date(now.getTime() + 3 * DAY_MS))) {
    if (p.name !== 'New Moon' && p.name !== 'Full Moon') continue;
    const offsetDays = diffDays(today, dayOf(p.date, timezone));
    if (offsetDays === -1 || offsetDays === 0 || offsetDays === 1) moonwater = { phase: p.name, offsetDays };
  }

  return { today, weekday, planet, sabbatToday: sabbats.today, nextSabbat: sabbats.nextSabbat, nextPhase, moonwater };
}

export function isEligible(activity: CraftActivity, ctx: CraftContext): boolean {
  switch (activity.when) {
    case undefined: return true;
    case 'moonwater': return ctx.moonwater !== null;
    case 'sabbat-today': return ctx.sabbatToday !== null;
    case 'no-sabbat-today': return ctx.sabbatToday === null && ctx.nextSabbat !== null;
  }
}

/**
 * A chosen activity. `seed` also picks the variant (which element), so a pick
 * reads the same every time it is shown.
 */
export interface CraftPick {
  id: string;
  seed: number;
}

/** A pick as saved in storage: only valid on the day it was made. */
export interface SavedCraftPick extends CraftPick {
  day: CalendarDay;
}

export const CRAFT_STORAGE_KEY = 'moon-dashboard-craft';

function activityById(id: string): CraftActivity | undefined {
  return CRAFT_ACTIVITIES.find(a => a.id === id);
}

// Scramble a seed so the activity choice and the variant don't move in step.
function mix(n: number): number {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

// FNV-1a: a stable 32-bit number for a day, so the first pick is fixed all day.
function hashDay(day: CalendarDay): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

function choose(ctx: CraftContext, seed: number, excludeId?: string): CraftPick {
  const pool = CRAFT_ACTIVITIES.filter(a => a.id !== excludeId && isEligible(a, ctx));
  const total = pool.reduce((sum, a) => sum + (a.weight ?? 1), 0);
  let roll = mix(seed) % total;
  for (const a of pool) {
    roll -= a.weight ?? 1;
    if (roll < 0) return { id: a.id, seed };
  }
  return { id: pool[pool.length - 1].id, seed };
}

/** Today's first pick: the same for the whole day. */
export function dailyPick(ctx: CraftContext): CraftPick {
  return choose(ctx, hashDay(ctx.today));
}

/** A random 32-bit seed for `rerollPick`. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

/** A different eligible activity, chosen by `seed` (a random 32-bit number). */
export function rerollPick(current: CraftPick, ctx: CraftContext, seed: number): CraftPick {
  return choose(ctx, seed, current.id);
}

/** The saved pick if it was made today and still fits, else today's first pick. */
export function resolvePick(saved: SavedCraftPick | null, ctx: CraftContext): CraftPick {
  const activity = saved && saved.day === ctx.today ? activityById(saved.id) : undefined;
  return saved && activity && isEligible(activity, ctx) ? { id: saved.id, seed: saved.seed } : dailyPick(ctx);
}

export function parseSavedPick(raw: string | null): SavedCraftPick | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (
      v && typeof v === 'object'
      && 'day' in v && typeof v.day === 'string'
      && 'id' in v && typeof v.id === 'string'
      && 'seed' in v && typeof v.seed === 'number'
    ) {
      return { day: v.day as CalendarDay, id: v.id, seed: v.seed };
    }
  } catch {
    // corrupt value; fall back to today's pick
  }
  return null;
}

function moonwaterText(m: NonNullable<CraftContext['moonwater']>): string {
  if (m.offsetDays === 0) return `It is the ${m.phase}`;
  return `It is the day ${m.offsetDays === -1 ? 'before' : 'after'} the ${m.phase}`;
}

/** The activity's text with today's details filled in. */
export function craftText(pick: CraftPick, ctx: CraftContext): string {
  const activity = activityById(pick.id);
  if (!activity) return '';
  const values: Record<string, string | undefined> = {
    sabbat: (ctx.sabbatToday ?? ctx.nextSabbat)?.displayName,
    phase: ctx.nextPhase,
    weekday: ctx.weekday,
    planet: ctx.planet,
    element: CRAFT_ELEMENTS[pick.seed % CRAFT_ELEMENTS.length],
    moonwater: ctx.moonwater ? moonwaterText(ctx.moonwater) : undefined,
  };
  return activity.text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
