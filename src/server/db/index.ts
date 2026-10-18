import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { reportProblem } from '../ops';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

let db: Db | undefined;

// Created on first use rather than at import, so `next build` and pages that
// never touch the database work without DATABASE_URL.
export function getDb(): Db {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    const pool = new Pool({
      connectionString,
      max: 5,
      // Fail fast rather than hang a request when the database is unreachable
      // or a query stalls.
      connectionTimeoutMillis: 10_000,
      statement_timeout: 15_000,
    });
    // An idle client can lose its connection (e.g. Neon suspending); without a
    // listener that error would crash the process. Only the redacted message
    // and code are logged, never the config.
    pool.on('error', err => reportProblem('db-pool-error', {}, err));
    db = drizzle(pool, { schema });
  }
  return db;
}
