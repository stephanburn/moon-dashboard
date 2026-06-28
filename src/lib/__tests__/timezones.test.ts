import { describe, it, expect } from 'vitest';
import { normalizeTimezone, SUPPORTED_TIMEZONES } from '../timezones';
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
