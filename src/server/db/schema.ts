// Database schema. The first five tables are the ones Better Auth expects
// (user, session, account, verification, rate_limit); app tables follow. Every app table
// references user.id with ON DELETE CASCADE, so deleting an account removes
// all of its data.
//
// After changing this file, run `npm run db:generate` to write a migration
// into drizzle/ and commit it.
//
// The one module here without `import 'server-only'`: drizzle-kit and the e2e
// seeder load it outside Next, and it holds table definitions, not data or
// secrets. The connection (./index.ts) is server-only.

import { sql } from 'drizzle-orm';
import { bigint, boolean, check, index, integer, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // Set by hand in the database; declared to Better Auth with input: false so
  // no one can set it through the auth API.
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  },
  table => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('account_user_id_idx').on(table.userId),
    // One app account per Discord identity.
    unique('account_provider_account_unique').on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Request counts for rate limiting, shared by every serverless instance.
// Better Auth keeps its /api/auth limits here (`rateLimit.storage:
// 'database'`), and server/rateLimit.ts the app's own, under keys starting
// with `app:`. `last_request` is in milliseconds since the epoch.
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

// ── App tables ─────────────────────────────────────────────────────────────

// Preferences that follow the user across devices. `timezone` is the zone the
// dashboard showed on the first signed-in visit, then whatever the user picks.
// `wheel` is the seasonal wheel ('auto' follows the timezone); null until the
// user first chooses one.
export const userSettings = pgTable(
  'user_settings',
  {
    userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    timezone: text('timezone'),
    wheel: text('wheel', { enum: ['auto', 'north', 'south'] }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [check('user_settings_wheel_check', sql`${table.wheel} in ('auto', 'north', 'south')`)],
);

// One row per sign-in attempt that reached the membership check. Refused
// attempts (Discord accounts not in the server) have no user_id; they are
// identified by their Discord id and name instead, and are kept when an
// account is deleted. Rows older than LOG_RETENTION_DAYS are purged daily
// (server/activity.ts).
export const signInLog = pgTable(
  'sign_in_log',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    outcome: text('outcome', { enum: ['signed-in', 'refused'] }).notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    discordId: text('discord_id'),
    discordName: text('discord_name'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  table => [
    index('sign_in_log_at_idx').on(table.at),
    check('sign_in_log_outcome_check', sql`${table.outcome} in ('signed-in', 'refused')`),
  ],
);

// Dashboard visits by signed-in members, one row per member per UTC day,
// purged with the sign-in log.
export const visitLog = pgTable(
  'visit_log',
  {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    day: text('day').notNull(), // CalendarDay in UTC
    firstAt: timestamp('first_at', { withTimezone: true }).notNull().defaultNow(),
    lastAt: timestamp('last_at', { withTimezone: true }).notNull().defaultNow(),
    count: integer('count').notNull().default(1),
  },
  table => [
    primaryKey({ columns: [table.userId, table.day] }),
    // For the retention cleanup, which deletes by day alone.
    index('visit_log_day_idx').on(table.day),
    check('visit_log_count_check', sql`${table.count} > 0`),
  ],
);
