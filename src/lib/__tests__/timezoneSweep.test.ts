import { describe, it, expect } from 'vitest';
import { buildDashboardModel } from '../dashboardModel';
import { SUPPORTED_TIMEZONES } from '../timezones';
import { addDays, dayOf } from '../days';
import { SIGN_NAMES } from '../names';

// Every selectable zone, plus zones a browser can report that have no listed
// equivalent (no DST, half-hour offsets, a 30-minute DST shift, Ramadan
// changes), sampled where day and DST boundaries fall.
const ZONES = [
  ...SUPPORTED_TIMEZONES,
  'America/Phoenix',
  'Australia/Brisbane',
  'Australia/Adelaide',
  'Australia/Lord_Howe',
  'Asia/Kathmandu',
  'Africa/Casablanca',
];

const MIN = 60_000;
const HOUR = 60 * MIN;

// UK and US autumn changes, then Australia and NZ in April.
const DST_CHANGES = ['2026-10-25T01:00:00Z', '2026-11-01T06:00:00Z', '2027-04-03T14:00:00Z', '2027-04-03T16:00:00Z'];

function localMidnight(isoDay: string, tz: string): number {
  const base = Date.parse(`${isoDay}T00:00:00Z`);
  for (let t = base - 15 * HOUR; t < base + 15 * HOUR; t += 15 * MIN) {
    if (dayOf(new Date(t), tz) !== dayOf(new Date(t - 15 * MIN), tz)) return t;
  }
  throw new Error(`no midnight found for ${tz} on ${isoDay}`);
}

describe('dashboard model in every zone, around midnights and DST changes', () => {
  it('stays self-consistent', () => {
    const problems: string[] = [];
    for (const tz of ZONES) {
      const instants = [
        ...['2026-10-31', '2026-12-21'].flatMap(d => {
          const m = localMidnight(d, tz);
          return [m - MIN, m];
        }),
        ...DST_CHANGES.flatMap(d => [Date.parse(d) - 30 * MIN, Date.parse(d) + 30 * MIN]),
      ];
      for (const t of instants) {
        const now = new Date(t);
        const where = `${tz} @ ${now.toISOString()}`;
        const m = buildDashboardModel(now, tz);

        if (m.today !== dayOf(now, tz)) problems.push(`today ${m.today}: ${where}`);
        if (m.events.length !== 8) problems.push(`${m.events.length} spine events: ${where}`);
        m.events.forEach((e, i) => {
          if (e.day < m.today || e.day > addDays(m.today, 180)) problems.push(`${e.key} on ${e.day} out of range: ${where}`);
          if (i > 0 && e.day < m.events[i - 1].day) problems.push(`${e.key} out of order: ${where}`);
          if (e.at && e.kind !== 'mercury-rx' && dayOf(e.at, tz) !== e.day) problems.push(`${e.key} on the wrong day: ${where}`);
          if (e.kind === 'sabbat' && m.sabbatToday && e.day === m.today) problems.push(`today's sabbat repeated: ${where}`);
        });
        if (m.sunSign.until <= now) problems.push(`sun sign end in the past: ${where}`);

        let idx = SIGN_NAMES.indexOf(m.moonSign);
        let last = t;
        for (const c of m.moonSignChanges) {
          idx = (idx + 1) % 12;
          if (c.sign !== SIGN_NAMES[idx]) problems.push(`moon sign ${c.sign} out of order: ${where}`);
          if (c.enterTime.getTime() <= last) problems.push(`moon sign change not in the future: ${where}`);
          last = c.enterTime.getTime();
        }

        const peakDiff = Math.round((Date.parse(dayOf(m.moonPeak.peakTime, tz)) - Date.parse(m.today)) / (24 * HOUR));
        if ((peakDiff === 0) !== /today/.test(m.moonPeakText)) problems.push(`"${m.moonPeakText}": ${where}`);
        if (peakDiff === -1 && !/yesterday/.test(m.moonPeakText)) problems.push(`"${m.moonPeakText}": ${where}`);
      }
    }
    expect(problems).toEqual([]);
  }, 60_000);
});
