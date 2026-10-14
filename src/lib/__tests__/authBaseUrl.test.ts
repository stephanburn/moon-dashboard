import { describe, expect, it } from 'vitest';
import { authBaseURL } from '@/server/baseUrl';

const vercel = {
  VERCEL_PROJECT_PRODUCTION_URL: 'moon.example.com',
  VERCEL_BRANCH_URL: 'moon-dashboard-git-test-team.vercel.app',
  VERCEL_URL: 'moon-dashboard-abc123-team.vercel.app',
};

describe('authBaseURL', () => {
  it('uses the production domain in production', () => {
    expect(authBaseURL({ ...vercel, VERCEL_ENV: 'production' })).toBe('https://moon.example.com');
  });

  it("uses the branch's stable URL in previews, not the per-deployment one", () => {
    expect(authBaseURL({ ...vercel, VERCEL_ENV: 'preview' })).toBe('https://moon-dashboard-git-test-team.vercel.app');
  });

  it('lets BETTER_AUTH_URL override', () => {
    expect(authBaseURL({ ...vercel, VERCEL_ENV: 'preview', BETTER_AUTH_URL: 'http://localhost:3000' })).toBe('http://localhost:3000');
  });

  it('is undefined off Vercel without BETTER_AUTH_URL', () => {
    expect(authBaseURL({})).toBeUndefined();
  });
});
