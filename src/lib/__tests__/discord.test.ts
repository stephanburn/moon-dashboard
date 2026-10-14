import { describe, expect, it, vi } from 'vitest';
import { isGuildMember, type FetchLike } from '@/server/discord';

const respond = (status: number): FetchLike => async () => new Response(null, { status });

describe('isGuildMember', () => {
  it('asks Discord about the configured server with the user token', async () => {
    const fetchImpl = vi.fn(respond(200));
    expect(await isGuildMember('tok', '123', fetchImpl)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('https://discord.com/api/v10/users/@me/guilds/123/member', {
      headers: { authorization: 'Bearer tok' },
    });
  });

  it('refuses non-members', async () => {
    expect(await isGuildMember('tok', '123', respond(404))).toBe(false);
  });

  it('fails closed when Discord errors or is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await isGuildMember('tok', '123', respond(429))).toBe(false);
    expect(await isGuildMember('tok', '123', respond(500))).toBe(false);
    expect(await isGuildMember('tok', '123', async () => { throw new Error('offline'); })).toBe(false);
  });

  it('refuses everyone when no server is configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = vi.fn(respond(200));
    expect(await isGuildMember('tok', undefined, fetchImpl)).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
