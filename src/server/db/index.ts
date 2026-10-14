import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

let db: Db | undefined;

// Created on first use rather than at import, so `next build` and pages that
// never touch the database work without DATABASE_URL.
export function getDb(): Db {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    db = drizzle(new Pool({ connectionString, max: 5 }), { schema });
  }
  return db;
}
