// Applies the SQL migrations in drizzle/ to DATABASE_URL, reading .env.local
// and friends the way `next dev` does (variables already set win).
//
// `--if-configured` (vercel-build) skips quietly when no database is
// configured, so builds without accounts still work. Run by hand
// (`npm run db:migrate`) it fails instead, so a missing variable can't pass
// for a finished setup.
import nextEnv from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  if (process.argv.includes('--if-configured')) {
    console.log('migrate: DATABASE_URL not set, skipping');
    process.exit(0);
  }
  console.error('migrate: DATABASE_URL is not set (in the environment or .env.local)');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
  console.log('migrate: up to date');
} finally {
  await pool.end();
}
