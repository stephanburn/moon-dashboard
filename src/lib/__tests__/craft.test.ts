import { describe, it, expect } from 'vitest';
import { CRAFT_ACTIVITIES, CRAFT_ELEMENTS } from '@/data/craftActivities';
import {
  craftText,
  dailyPick,
  getCraftContext,
  isEligible,
  parseSavedPick,
  rerollPick,
  resolvePick,
  type CraftContext,
} from '../craft';
import type { CalendarDay } from '../days';

// Moon phases from published almanac values (timeanddate.com / USNO):
// Full Moon 26 Sep 2026 16:49 UTC, New Moon 10 Oct 2026 15:50 UTC.

const london = (iso: string) => getCraftContext(new Date(iso), 'Europe/London', 'north');

describe('moonwater', () => {
  it('is offered from the day before to the day after a Full Moon', () => {
    expect(london('2026-09-24T12:00:00Z').moonwater).toBeNull();
    expect(london('2026-09-25T12:00:00Z').moonwater).toEqual({ phase: 'Full Moon', offsetDays: -1 });
    expect(london('2026-09-26T08:00:00Z').moonwater).toEqual({ phase: 'Full Moon', offsetDays: 0 });
    expect(london('2026-09-26T20:00:00Z').moonwater).toEqual({ phase: 'Full Moon', offsetDays: 0 });
    expect(london('2026-09-27T12:00:00Z').moonwater).toEqual({ phase: 'Full Moon', offsetDays: 1 });
    expect(london('2026-09-28T12:00:00Z').moonwater).toBeNull();
  });

  it('counts days in the selected timezone', () => {
    // The New Moon falls on 11 Oct in Kiritimati (UTC+14), so 12 Oct is the day after.
    const at = new Date('2026-10-12T00:30:00Z'); // 12 Oct 14:30 in Kiritimati, 12 Oct 01:30 in London
    expect(getCraftContext(at, 'Pacific/Kiritimati', 'north').moonwater).toEqual({ phase: 'New Moon', offsetDays: 1 });
    expect(getCraftContext(at, 'Europe/London', 'north').moonwater).toBeNull();
  });

  it('fills in the moonwater text', () => {
    const ctx = london('2026-09-25T12:00:00Z');
    expect(craftText({ id: 'moonwater', seed: 0 }, ctx)).toBe('It is the day before the Full Moon, make moonwater.');
  });
});

describe('day ruler', () => {
  it('uses the weekday in the selected timezone', () => {
    const at = new Date('2026-09-26T20:00:00Z'); // Saturday in London, Sunday in Kiritimati
    expect(getCraftContext(at, 'Europe/London', 'north')).toMatchObject({ weekday: 'Saturday', planet: 'Saturn' });
    expect(getCraftContext(at, 'Pacific/Kiritimati', 'north')).toMatchObject({ weekday: 'Sunday', planet: 'the Sun' });
  });
});

describe('sabbats and phases', () => {
  it('names the next sabbat for the hemisphere', () => {
    const at = new Date('2026-09-26T12:00:00Z');
    expect(craftText({ id: 'next-sabbat', seed: 0 }, getCraftContext(at, 'Europe/London', 'north')))
      .toMatch(/^The next sabbat is Samhain\./);
    expect(craftText({ id: 'next-sabbat', seed: 0 }, getCraftContext(at, 'Australia/Sydney', 'south')))
      .toMatch(/^The next sabbat is Beltane\./);
  });

  it('switches to "Today is" on a sabbat', () => {
    const ctx = london('2026-10-31T12:00:00Z');
    const eligible = CRAFT_ACTIVITIES.filter(a => isEligible(a, ctx)).map(a => a.id);
    expect(eligible).toContain('sabbat-today');
    expect(eligible).not.toContain('next-sabbat');
    expect(craftText({ id: 'sabbat-today', seed: 0 }, ctx)).toMatch(/^Today is Samhain\./);
  });

  it('names the next major phase', () => {
    expect(london('2026-09-24T12:00:00Z').nextPhase).toBe('Full Moon');
    expect(london('2026-09-27T12:00:00Z').nextPhase).toBe('Last Quarter');
  });
});

describe('picking', () => {
  const ctx = london('2026-09-26T12:00:00Z');

  it('keeps the first pick for the whole day', () => {
    expect(dailyPick(london('2026-09-26T00:30:00Z'))).toEqual(dailyPick(london('2026-09-26T22:30:00Z')));
  });

  it('never re-rolls to the same activity or an ineligible one', () => {
    const quiet = london('2026-09-15T12:00:00Z'); // no moonwater, no sabbat
    let pick = dailyPick(quiet);
    for (let seed = 0; seed < 500; seed++) {
      const next = rerollPick(pick, quiet, seed * 7919);
      expect(next.id).not.toBe(pick.id);
      expect(['moonwater', 'sabbat-today']).not.toContain(next.id);
      pick = next;
    }
  });

  it('reaches every eligible activity and every element', () => {
    const ids = new Set<string>();
    const elements = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) {
      const pick = rerollPick({ id: '', seed: 0 }, ctx, seed);
      ids.add(pick.id);
      if (pick.id === 'element') elements.add(craftText(pick, ctx).match(/element of (\w+)/)![1]);
    }
    expect([...ids].sort()).toEqual(CRAFT_ACTIVITIES.filter(a => isEligible(a, ctx)).map(a => a.id).sort());
    expect([...elements].sort()).toEqual([...CRAFT_ELEMENTS].sort());
  });

  it('keeps a saved pick only on its day and while it fits', () => {
    expect(resolvePick({ day: '2026-09-26' as CalendarDay, id: 'sigil', seed: 5 }, ctx)).toEqual({ id: 'sigil', seed: 5 });
    expect(resolvePick({ day: '2026-09-25' as CalendarDay, id: 'sigil', seed: 5 }, ctx)).toEqual(dailyPick(ctx));
    expect(resolvePick({ day: '2026-09-26' as CalendarDay, id: 'gone', seed: 5 }, ctx)).toEqual(dailyPick(ctx));
    const later = london('2026-09-28T12:00:00Z');
    expect(resolvePick({ day: '2026-09-28' as CalendarDay, id: 'moonwater', seed: 5 }, later)).toEqual(dailyPick(later));
  });

  it('ignores corrupt saved values', () => {
    expect(parseSavedPick(null)).toBeNull();
    expect(parseSavedPick('not json')).toBeNull();
    expect(parseSavedPick('{"day":"2026-09-26","id":"sigil"}')).toBeNull();
    expect(parseSavedPick('{"day":"2026-09-26","id":"sigil","seed":3}')).toEqual({ day: '2026-09-26', id: 'sigil', seed: 3 });
  });
});

describe('activity text', () => {
  it('has unique ids', () => {
    const ids = CRAFT_ACTIVITIES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Every day of a year in both hemispheres covers every sabbat, phase,
  // weekday and moonwater wording; every seed mod 5 covers every element.
  it('stays within 130 characters with everything filled in', () => {
    const contexts: CraftContext[] = [];
    for (let d = 0; d < 366; d++) {
      const at = new Date(Date.UTC(2026, 0, 1 + d, 12));
      contexts.push(getCraftContext(at, 'Europe/London', 'north'));
      contexts.push(getCraftContext(at, 'Australia/Sydney', 'south'));
    }
    const problems: string[] = [];
    for (const ctx of contexts) {
      for (const activity of CRAFT_ACTIVITIES.filter(a => isEligible(a, ctx))) {
        for (let seed = 0; seed < CRAFT_ELEMENTS.length; seed++) {
          const text = craftText({ id: activity.id, seed }, ctx);
          if (text.length > 130 || /[{}]/.test(text) || text.includes('—')) problems.push(`${ctx.today}: ${text}`);
        }
      }
    }
    expect(problems).toEqual([]);
    expect(contexts.some(c => c.moonwater?.offsetDays === -1)).toBe(true);
    expect(contexts.some(c => c.sabbatToday)).toBe(true);
  });
});
