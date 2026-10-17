import { describe, expect, it } from 'vitest';
import { isAllowedAuthPath } from '@/server/authRoutes';

const at = (path: string) => `https://moon.example${path}`;

describe('isAllowedAuthPath', () => {
  it('lets through the routes sign-in needs', () => {
    expect(isAllowedAuthPath(at('/api/auth/callback/discord?code=x&state=y'))).toBe(true);
    expect(isAllowedAuthPath(at('/api/auth/sign-in/social'))).toBe(true);
    expect(isAllowedAuthPath(at('/api/auth/sign-out'))).toBe(true);
    expect(isAllowedAuthPath(at('/api/auth/get-session/'))).toBe(true);
  });

  it('refuses the stock routes the app does not use', () => {
    for (const path of ['/update-user', '/delete-user', '/link-social', '/list-sessions', '/callback/github', '/ok', '']) {
      expect(isAllowedAuthPath(at(`/api/auth${path}`)), path).toBe(false);
    }
  });

  it('refuses paths that only look like an allowed one', () => {
    expect(isAllowedAuthPath(at('/api/auth/get-session/../update-user'))).toBe(false);
    expect(isAllowedAuthPath(at('/api/auth/update%2Duser'))).toBe(false);
    expect(isAllowedAuthPath(at('/api/authx/get-session'))).toBe(false);
  });
});
