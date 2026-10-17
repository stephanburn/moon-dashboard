import { describe, it, expect } from 'vitest';
import { parseWheelChoice, resolveWheel } from '../wheel';
import { buildDashboardModel } from '../dashboardModel';

describe('seasonal wheel choice', () => {
  const at = new Date('2026-10-17T12:00:00Z');

  it('reads anything unknown as auto', () => {
    expect(parseWheelChoice('south')).toBe('south');
    expect(parseWheelChoice('north')).toBe('north');
    expect(parseWheelChoice(null)).toBe('auto');
    expect(parseWheelChoice('Southern')).toBe('auto');
  });

  it('follows the timezone only on auto', () => {
    expect(resolveWheel('auto', 'Australia/Sydney', at)).toBe('south');
    expect(resolveWheel('auto', 'Europe/London', at)).toBe('north');
    expect(resolveWheel('south', 'Europe/London', at)).toBe('south');
    expect(resolveWheel('north', 'Australia/Sydney', at)).toBe('north');
  });

  it('moves the sabbats but not the moon', () => {
    const sabbats = (choice: 'auto' | 'south') =>
      buildDashboardModel(at, 'Europe/London', choice).events.flatMap(e => (e.kind === 'sabbat' ? [e.sabbat.name] : []));
    expect(sabbats('auto')).toEqual(['Samhain']);
    expect(sabbats('south')).toEqual(['Beltane']);

    const south = buildDashboardModel(at, 'Europe/London', 'south');
    expect(south.wheel).toBe('south');
    expect(south.hemisphere).toBe('north');
  });
});
