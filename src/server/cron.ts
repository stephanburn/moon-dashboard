import { timingSafeEqual } from 'node:crypto';

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. With no secret
// configured, nothing is accepted.
export function isCronRequest(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
