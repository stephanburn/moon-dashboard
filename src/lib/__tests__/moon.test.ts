import { describe, it, expect } from 'vitest';
import { getMoonPhaseInfo, getMoonPhasePeak, getUpcomingMajorPhases } from '../moon';

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

  // Lock the 0/1 wrap behaviour around the New Moon. astronomy-engine's
  // MoonPhase returns [0, 360); phase = MoonPhase/360 must stay in [0, 1) and
  // never produce NaN or wrap negative — and the crescent classification must
  // land on the correct side of the wrap. New Moon: 2026-07-14T09:44Z.
  it('keeps phase in [0,1) and stays finite through the New Moon wrap', () => {
    const start = new Date('2026-07-12T00:00:00Z').getTime();
    for (let h = 0; h <= 72; h++) {
      const info = getMoonPhaseInfo(new Date(start + h * 60 * 60 * 1000));
      expect(Number.isFinite(info.phase)).toBe(true);
      expect(info.phase).toBeGreaterThanOrEqual(0);
      expect(info.phase).toBeLessThan(1);
      expect(Number.isFinite(info.ageInDays)).toBe(true);
    }
  });

  it('classifies the waning side of the New Moon wrap', () => {
    const info = getMoonPhaseInfo(new Date('2026-07-12T18:00:00Z'));
    expect(info.name).toBe('Waning Crescent');
    expect(info.phase).toBeGreaterThan(0.85);
  });

  it('classifies the waxing side of the New Moon wrap', () => {
    // Just past the ±1.5-day New Moon window, but still a low phase value.
    const info = getMoonPhaseInfo(new Date('2026-07-16T12:00:00Z'));
    expect(info.name).toBe('Waxing Crescent');
    expect(info.phase).toBeLessThan(0.15);
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

  // Regression: precise phase timings. Before consolidating on astronomy-engine
  // this Full Moon was reported ~48 min late (01:45 BST vs the true 00:57 BST /
  // 23:57 UTC). Lock it to within 5 minutes of the authoritative instant.
  it('pins the June 2026 Full Moon to the precise instant', () => {
    const peak = getMoonPhasePeak(new Date('2026-06-29T12:00:00Z'), 'Full Moon');
    const expected = new Date('2026-06-29T23:57:00Z').getTime();
    expect(Math.abs(peak.peakTime.getTime() - expected)).toBeLessThanOrEqual(5 * 60 * 1000);
  });
});

describe('getUpcomingMajorPhases', () => {
  it('returns chronological phases including a New Moon', () => {
    const phases = getUpcomingMajorPhases(new Date('2026-06-29T12:00:00Z'), 2);
    expect(phases.length).toBeGreaterThan(0);
    expect(phases.some(p => p.name === 'New Moon')).toBe(true);
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].date.getTime()).toBeGreaterThan(phases[i - 1].date.getTime());
    }
  });
});
