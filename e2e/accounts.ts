// Seeds users and sessions straight into the e2e database, using Better
// Auth's test helpers with the same secret as the server under test, so the
// signed-in flows run without going through Discord.
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { testUtils } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/server/db/schema';

import { E2E_DATABASE_URL, E2E_PORT, E2E_SECRET } from './env';

export { E2E_DATABASE_URL };

let pool: Pool | undefined;

export function testDb() {
  pool ??= new Pool({ connectionString: E2E_DATABASE_URL, max: 2 });
  return drizzle(pool, { schema });
}

function testAuth() {
  return betterAuth({
    baseURL: `http://localhost:${E2E_PORT}`,
    secret: E2E_SECRET,
    database: drizzleAdapter(testDb(), { provider: 'pg', schema }),
    plugins: [testUtils()],
  });
}

export async function seedSignedInUser(name: string) {
  const { test } = await testAuth().$context;
  const user = await test.saveUser(test.createUser({ name, email: `${crypto.randomUUID()}@example.test` }));
  const cookies = await test.getCookies({ userId: user.id, domain: 'localhost' });
  return { user, cookies };
}
