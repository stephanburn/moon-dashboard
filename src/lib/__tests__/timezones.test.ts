import { describe, it, expect } from 'vitest';
import {
  normalizeTimezone,
  SUPPORTED_TIMEZONES,
  SOUTHERN_TIMEZONES,
  hemisphereFromTimezone,
} from '../timezones';
import { DEFAULT_TZ } from '../config';

// Guards review finding M1: an untrusted stored timezone must never reach
// Intl.DateTimeFormat, so anything not in the selector list is coerced to a
// known-good default rather than throwing and blanking the page.
describe('normalizeTimezone', () => {
  it('passes a supported timezone through unchanged', () => {
    expect(normalizeTimezone('America/New_York')).toBe('America/New_York');
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
