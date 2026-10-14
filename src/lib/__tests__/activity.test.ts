import { describe, expect, it } from 'vitest';
import { requestInfo } from '@/server/activity';

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
