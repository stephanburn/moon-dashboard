import { describe, expect, it } from 'vitest';
import { boundedInfo, MAX_USER_AGENT_LENGTH, requestInfo } from '@/server/activity';

describe('requestInfo', () => {
  it("takes the visitor's address, the first in x-forwarded-for", () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'user-agent': 'Firefox' });
    expect(requestInfo(headers)).toEqual({ ipAddress: '203.0.113.7', userAgent: 'Firefox' });
  });

  it('copes with missing headers', () => {
    expect(requestInfo(new Headers())).toEqual({ ipAddress: null, userAgent: null });
    expect(requestInfo(undefined)).toEqual({ ipAddress: null, userAgent: null });
  });
});

describe('boundedInfo', () => {
  it('drops anything that is not an IP address', () => {
    expect(boundedInfo({ ipAddress: '2001:db8::1', userAgent: null }).ipAddress).toBe('2001:db8::1');
    expect(boundedInfo({ ipAddress: 'not-an-ip', userAgent: null }).ipAddress).toBeNull();
    expect(requestInfo(new Headers({ 'x-forwarded-for': '<script>' })).ipAddress).toBeNull();
  });

  it('cuts the user agent short', () => {
    const { userAgent } = boundedInfo({ ipAddress: null, userAgent: 'x'.repeat(5000) });
    expect(userAgent).toHaveLength(MAX_USER_AGENT_LENGTH);
  });
});
