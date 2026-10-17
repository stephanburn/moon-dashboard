import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeError, redact, reportProblem } from '@/server/ops';

afterEach(() => vi.restoreAllMocks());

describe('redact', () => {
  it('drops credentials and query strings from URLs', () => {
    expect(redact('connect to postgres://app:hunter2@ep-x.neon.tech/main?sslmode=require failed')).toBe(
      'connect to postgres://[redacted]@ep-x.neon.tech/main failed',
    );
    expect(redact('GET https://moon.example/api/me?check=1#x')).toBe('GET https://moon.example/api/me');
  });

  it('drops bearer tokens, cookies and authorization headers', () => {
    expect(redact('sent Bearer abc.def')).toBe('sent Bearer [redacted]');
    expect(redact('cookie: session=abc; other=1')).toBe('cookie: [redacted]');
    expect(redact('"authorization":"Basic xyz"')).toBe('"authorization":[redacted]');
  });

  it('drops the parameters of a failed query', () => {
    expect(redact('Failed query: insert into "visit_log" values ($1, $2)\nparams: user-1,203.0.113.7')).toBe(
      'Failed query: insert into "visit_log" values ($1, $2)\nparams: [redacted]',
    );
  });
});

describe('describeError', () => {
  it('includes the cause and its code, redacted, without the stack', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    const err = new Error('Failed query: select 1\nparams: 203.0.113.7', { cause });
    const text = describeError(err);
    expect(text).toBe('Error: Failed query: select 1\nparams: [redacted] <- Error ECONNREFUSED: connect ECONNREFUSED');
    expect(text).not.toContain('at ');
  });

  it('caps the length', () => {
    expect(describeError(new Error('x'.repeat(2000))).length).toBe(500);
  });
});

describe('reportProblem', () => {
  it('logs one line with the event name and redacted fields', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    reportProblem('activity-write-failed', { what: 'visit' }, new Error('timeout via postgres://u:p@h/db'));
    expect(log).toHaveBeenCalledTimes(1);
    const [line] = log.mock.calls[0];
    expect(line).toBe('[ops] activity-write-failed {"what":"visit","error":"Error: timeout via postgres://[redacted]@h/db"}');
  });
});
