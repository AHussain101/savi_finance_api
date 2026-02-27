/**
 * Database Schema for VaultLine MVP
 *
 * This file defines the database schema using Drizzle ORM.
 * The schema is designed for the two-tier MVP (Sandbox + Standard).
 *
 * Tables:
 * - users: User accounts with authentication credentials
 * - api_keys: API keys for data access (hashed storage)
 * - subscriptions: Stripe subscription state
 * - usage_logs: API usage tracking for analytics
 * - rates: Financial rate data (EOD only for MVP)
 *
 * Note: This is a placeholder. The Data role will implement the full schema.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  bigserial,
  numeric,
  date,
  unique,
} from 'drizzle-orm/pg-core';

// Plan types for MVP
export type Plan = 'sandbox' | 'standard';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';
export type AssetClass = 'fiat' | 'crypto' | 'stocks' | 'metals';
export type BillingInterval = 'month' | 'year';

/**
 * Users table
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  plan: text('plan').notNull().default('sandbox').$type<Plan>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * API Keys table
 * Raw key is shown once at creation; only the hash is stored
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').unique().notNull(),
  label: text('label'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Subscriptions table
 * Tracks Stripe subscription state
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  plan: text('plan').notNull().default('sandbox').$type<Plan>(),
  billingInterval: text('billing_interval').$type<BillingInterval>(),
  status: text('status').notNull().default('active').$type<SubscriptionStatus>(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Usage Logs table
 * For analytics and rate-limit verification (Redis is source-of-truth for real-time enforcement)
 */
export const usageLogs = pgTable('usage_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  apiKeyId: uuid('api_key_id')
    .notNull()
    .references(() => apiKeys.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  calledAt: timestamp('called_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Rates table
 * Financial rate data - EOD only for MVP
 */
export const rates = pgTable(
  'rates',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    assetClass: text('asset_class').notNull().$type<AssetClass>(),
    symbol: text('symbol').notNull(),
    rate: numeric('rate', { precision: 20, scale: 8 }).notNull(),
    baseCurrency: text('base_currency').notNull(),
    recordedDate: date('recorded_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('rates_symbol_date_unique').on(table.symbol, table.recordedDate),
  ]
);

// Type exports for use in queries
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
export type Rate = typeof rates.$inferSelect;
export type NewRate = typeof rates.$inferInsert;
