import { describe, expect, it } from 'vitest';
import { describeUserAgent } from '@/lib/userAgent';

describe('describeUserAgent', () => {
  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'Safari on iPhone'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'Chrome on Mac'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', 'Edge on Windows'],
    ['Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0', 'Firefox on Android'],
  ])('%s', (ua, expected) => {
    expect(describeUserAgent(ua)).toBe(expected);
  });

  it('copes with nothing to go on', () => {
    expect(describeUserAgent(null)).toBe('Unknown browser');
    expect(describeUserAgent('curl/8.0')).toBe('Unknown browser');
  });
});
