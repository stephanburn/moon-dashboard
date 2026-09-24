import { describe, it, expect } from 'vitest';
import { buildDashboardModel } from '../dashboardModel';

describe('buildDashboardModel', () => {
  const now = new Date('2026-09-24T12:00:00Z');

  it('derives everything for the selected zone', () => {
    const model = buildDashboardModel(now, 'Europe/London');
    expect(model.today).toBe('2026-09-24');
    expect(model.hemisphere).toBe('north');
    expect(model.moon.name).toBe('Waxing Gibbous');
    expect(model.moonPeak.phaseName).toBe('Full Moon');
    expect(model.moonPeakText).toMatch(/^Full Moon peaks: 26 Sept? 2026 at 17:49$/);
    expect(model.sunSign.sign).toBe('Libra');
    expect(model.venusSign).toBe('Scorpio');
    expect(model.events).toHaveLength(8);
  });

  it('drops the spine node for the peak the hero already shows', () => {
    const model = buildDashboardModel(now, 'Europe/London');
    const fullMoonTimes = model.events.flatMap(e =>
      e.kind === 'moon-phase' && e.phase === 'Full Moon' ? [e.at.getTime()] : []);
    for (const t of fullMoonTimes) {
      expect(t - model.moonPeak.peakTime.getTime()).toBeGreaterThan(20 * 86_400_000);
    }
  });

  it('flips the hemisphere with the timezone', () => {
    expect(buildDashboardModel(now, 'Australia/Sydney').hemisphere).toBe('south');
  });
});
