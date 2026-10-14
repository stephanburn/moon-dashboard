// Applies the SQL migrations in drizzle/ to DATABASE_URL. Runs before every
// Vercel build (the `vercel-build` script); a no-op when no database is
// configured, so builds without accounts still work.
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log('migrate: DATABASE_URL not set, skipping');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
  console.log('migrate: up to date');
} finally {
  await pool.end();
}
