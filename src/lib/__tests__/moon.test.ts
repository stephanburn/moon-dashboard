import { describe, it, expect } from 'vitest';
import { getMoonPhaseInfo, getMoonPhasePeak } from '../moon';

const VALID_NAMES = new Set([
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
]);

const DAY = 24 * 60 * 60 * 1000;

describe('getMoonPhaseInfo', () => {
  // Characterisation of the shared-scan refactor (M5): these classifications
  // must stay stable. 3 Jan 2026 is a full moon; 17 Jan 2026 a new moon.
  it('classifies a known full moon', () => {
    const info = getMoonPhaseInfo(new Date('2026-01-03T12:00:00Z'));
    expect(info.name).toBe('Full Moon');
    expect(info.illumination).toBe(100);
  });

  it('classifies a known new moon', () => {
    const info = getMoonPhaseInfo(new Date('2026-01-17T12:00:00Z'));
    expect(info.name).toBe('New Moon');
    expect(info.illumination).toBeLessThan(5);
  });

  it('returns structurally valid info across a lunar month', () => {
    const start = new Date('2026-06-01T12:00:00Z').getTime();
    for (let day = 0; day < 30; day++) {
      const info = getMoonPhaseInfo(new Date(start + day * DAY));
      expect(VALID_NAMES.has(info.name)).toBe(true);
      expect(info.illumination).toBeGreaterThanOrEqual(0);
      expect(info.illumination).toBeLessThanOrEqual(100);
      expect(info.ageInDays).toBeGreaterThanOrEqual(0);
      expect(info.ageInDays).toBeLessThanOrEqual(29.53);
    }
  });
});

describe('getMoonPhasePeak', () => {
  it('returns the nearest peak for a major phase within ~16 days', () => {
    const now = new Date('2026-01-03T12:00:00Z');
    const peak = getMoonPhasePeak(now, 'Full Moon');
    expect(peak.phaseName).toBe('Full Moon');
    expect(Math.abs(peak.peakTime.getTime() - now.getTime())).toBeLessThanOrEqual(16 * DAY);
  });

  it('returns a future peak of the upcoming major phase for a transitional phase', () => {
    const now = new Date('2026-01-24T12:00:00Z'); // Waxing Crescent -> First Quarter
    const peak = getMoonPhasePeak(now, 'Waxing Crescent');
    expect(peak.phaseName).toBe('First Quarter');
    expect(peak.peakTime.getTime()).toBeGreaterThan(now.getTime());
  });
});
