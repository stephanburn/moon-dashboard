import { describe, it, expect } from 'vitest';
import {
  normalizeTimezone,
  SUPPORTED_TIMEZONES,
  SOUTHERN_TIMEZONES,
  hemisphereFromTimezone,
  detectBrowserTimezone,
  resolveTimezone,
  listedZoneFor,
} from '../timezones';
import { DEFAULT_TZ } from '../config';

// Guards review finding M1: an untrusted stored timezone must never reach
// Intl.DateTimeFormat, so anything Intl rejects is coerced to a known-good
// default rather than throwing and blanking the page.
describe('normalizeTimezone', () => {
  it('passes a supported timezone through unchanged', () => {
    expect(normalizeTimezone('America/New_York')).toBe('America/New_York');
  });

  it('accepts a valid zone that is not in the selector list', () => {
    expect(normalizeTimezone('America/Phoenix')).toBe('America/Phoenix');
  });

  it('falls back to DEFAULT_TZ for an unknown or malformed value', () => {
    expect(normalizeTimezone('Not/AZone')).toBe(DEFAULT_TZ);
    expect(normalizeTimezone('')).toBe(DEFAULT_TZ);
  });

  it('falls back to DEFAULT_TZ when there is no stored value', () => {
    expect(normalizeTimezone(null)).toBe(DEFAULT_TZ);
    expect(normalizeTimezone(undefined)).toBe(DEFAULT_TZ);
  });

  it('treats DEFAULT_TZ as a supported timezone', () => {
    expect(SUPPORTED_TIMEZONES.has(DEFAULT_TZ)).toBe(true);
  });
});

// Guards review finding L7: a southern zone that isn't also offered in the
// selector can never be selected, so the two lists must not drift apart.
describe('hemisphere mapping', () => {
  it('every southern timezone is also a supported (selectable) timezone', () => {
    for (const tz of SOUTHERN_TIMEZONES) {
      expect(SUPPORTED_TIMEZONES.has(tz), `${tz} is southern but not in the selector list`).toBe(true);
    }
  });

  it('maps southern and northern zones correctly', () => {
    expect(hemisphereFromTimezone('Australia/Sydney')).toBe('south');
    expect(hemisphereFromTimezone('Europe/London')).toBe('north');
  });
});

describe('detectBrowserTimezone', () => {
  it('passes a reported zone through', () => {
    expect(detectBrowserTimezone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('treats UTC (usually a privacy setting) and missing values as no signal', () => {
    for (const tz of ['UTC', 'Etc/UTC', 'GMT', '']) expect(detectBrowserTimezone(tz)).toBeNull();
  });

  it('never throws on junk', () => {
    expect(detectBrowserTimezone('Not/AZone')).toBe('Not/AZone'); // rejected later by resolveTimezone
    expect(resolveTimezone(null, 'Not/AZone')).toBe(DEFAULT_TZ);
  });
});

describe('resolveTimezone', () => {
  it('prefers the saved choice over the browser zone', () => {
    expect(resolveTimezone('Asia/Tokyo', 'America/New_York')).toBe('Asia/Tokyo');
  });

  it('uses the browser zone when nothing valid is saved', () => {
    expect(resolveTimezone(null, 'America/New_York')).toBe('America/New_York');
    expect(resolveTimezone('Not/AZone', 'America/New_York')).toBe('America/New_York');
  });

  // Chrome reports the legacy names; the selector lists the modern ones.
  it('maps legacy spellings onto the listed zone', () => {
    expect(resolveTimezone(null, 'Asia/Calcutta')).toBe('Asia/Kolkata');
    expect(resolveTimezone(null, 'Europe/Kiev')).toBe('Europe/Kyiv');
    expect(resolveTimezone(null, 'America/Argentina/Buenos_Aires')).toBe('America/Buenos_Aires');
  });

  it('uses an unlisted browser zone exactly, keeping its own DST rules', () => {
    expect(resolveTimezone(null, 'America/Phoenix')).toBe('America/Phoenix');
    expect(listedZoneFor('America/Phoenix')).toBeUndefined();
  });

  it('falls back to DEFAULT_TZ with no usable signal', () => {
    expect(resolveTimezone(null, null)).toBe(DEFAULT_TZ);
  });
});

describe('hemisphere of zones outside the list', () => {
  const at = new Date('2026-09-26T12:00:00Z');

  it('places DST zones by when their clocks go forward', () => {
    expect(hemisphereFromTimezone('Australia/Adelaide', at)).toBe('south');
    expect(hemisphereFromTimezone('Pacific/Chatham', at)).toBe('south');
    expect(hemisphereFromTimezone('Europe/Zurich', at)).toBe('north');
    expect(hemisphereFromTimezone('America/Havana', at)).toBe('north');
    // Offset changes for Ramadan, never southern-style summer time.
    expect(hemisphereFromTimezone('Africa/Casablanca', at)).toBe('north');
  });

  it('uses the southern list for zones without DST', () => {
    expect(hemisphereFromTimezone('Australia/Brisbane', at)).toBe('south');
    expect(hemisphereFromTimezone('Africa/Maputo', at)).toBe('south');
    expect(hemisphereFromTimezone('America/Asuncion', at)).toBe('south');
  });

  it('defaults other zones without DST to north', () => {
    expect(hemisphereFromTimezone('America/Phoenix', at)).toBe('north');
    expect(hemisphereFromTimezone('Asia/Kathmandu', at)).toBe('north');
  });
});
