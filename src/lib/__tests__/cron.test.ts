import { describe, expect, it, vi } from 'vitest';
import { logCutoffs } from '@/server/activity';
import { isCronRequest, pingHeartbeat } from '@/server/cron';

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

describe('pingHeartbeat', () => {
  it('does nothing without a URL', async () => {
    const fetchImpl = vi.fn();
    await pingHeartbeat(undefined, fetchImpl);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('pings the URL', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    await pingHeartbeat('https://hc.example/ping/abc', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('https://hc.example/ping/abc', { signal: expect.any(AbortSignal) });
  });

  it('logs a failed ping without throwing or logging the URL', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await pingHeartbeat('https://hc.example/ping/abc', async () => new Response(null, { status: 503 }));
    await pingHeartbeat('https://hc.example/ping/abc', async () => { throw new Error('offline'); });
    const lines = log.mock.calls.map(([line]) => String(line));
    expect(lines).toEqual(['[ops] heartbeat-failed {"status":503}', '[ops] heartbeat-failed {"error":"Error: offline"}']);
    log.mockRestore();
  });
});
