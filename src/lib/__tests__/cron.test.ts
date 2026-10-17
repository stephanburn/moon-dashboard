import { describe, expect, it } from 'vitest';
import { logCutoffs } from '@/server/activity';
import { isCronRequest } from '@/server/cron';

describe('isCronRequest', () => {
  it('accepts the bearer secret', () => {
    expect(isCronRequest('Bearer s3cret', 's3cret')).toBe(true);
  });

  it('refuses a wrong or missing header', () => {
    expect(isCronRequest('Bearer nope', 's3cret')).toBe(false);
    expect(isCronRequest('s3cret', 's3cret')).toBe(false);
    expect(isCronRequest(null, 's3cret')).toBe(false);
  });

  it('refuses everything when no secret is configured', () => {
    expect(isCronRequest('Bearer ', '')).toBe(false);
    expect(isCronRequest('Bearer undefined', undefined)).toBe(false);
  });
});

describe('logCutoffs', () => {
  it('keeps 90 days of logs', () => {
    const { signInBefore, visitDayBefore } = logCutoffs(new Date('2026-10-17T01:30:00Z'));
    expect(signInBefore.toISOString()).toBe('2026-07-19T01:30:00.000Z');
    expect(visitDayBefore).toBe('2026-07-19');
  });
});
