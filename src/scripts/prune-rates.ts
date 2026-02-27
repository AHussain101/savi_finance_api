/**
 * Rate Pruning Script
 *
 * Removes rate data older than the maximum retention period (90 days for MVP).
 * This keeps the database small and fast while maintaining enough history
 * for Standard tier users.
 *
 * Retention periods:
 * - Sandbox: 30 days (enforced at query time, not pruning)
 * - Standard: 90 days (maximum retention)
 *
 * Designed to run weekly via Vercel Cron or GitHub Actions.
 *
 * Run manually: npx tsx src/scripts/prune-rates.ts
 */

import { sql, lt } from 'drizzle-orm';
import { getDb, closeDb } from '../db/client';
import { rates, usageLogs } from '../db/schema';

const RETENTION_DAYS = 90; // Maximum retention for MVP (Standard tier limit)
const USAGE_LOG_RETENTION_DAYS = 90; // Keep usage logs for 90 days

/**
 * Get a date N days ago in YYYY-MM-DD format
 */
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Prune old rate data
 */
async function pruneRates(): Promise<number> {
  const db = getDb();
  const cutoffDate = getDaysAgo(RETENTION_DAYS);

  console.log(`Pruning rates older than ${cutoffDate} (${RETENTION_DAYS} days)...`);

  const result = await db
    .delete(rates)
    .where(sql`${rates.recordedDate} < ${cutoffDate}`)
    .returning({ id: rates.id });

  return result.length;
}

/**
 * Prune old usage logs
 */
async function pruneUsageLogs(): Promise<number> {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - USAGE_LOG_RETENTION_DAYS);

  console.log(`Pruning usage logs older than ${cutoffDate.toISOString().split('T')[0]}...`);

  const result = await db
    .delete(usageLogs)
    .where(lt(usageLogs.calledAt, cutoffDate))
    .returning({ id: usageLogs.id });

  return result.length;
}

/**
 * Get table statistics
 */
async function getStats(): Promise<{ rates: number; usageLogs: number }> {
  const db = getDb();

  const rateCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rates);

  const usageCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageLogs);

  return {
    rates: rateCount[0]?.count ?? 0,
    usageLogs: usageCount[0]?.count ?? 0,
  };
}

/**
 * Main pruning function
 */
async function prune(): Promise<void> {
  console.log('🧹 Starting data pruning...');
  console.log(`📅 Current date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`📊 Retention period: ${RETENTION_DAYS} days\n`);

  // Get before stats
  const beforeStats = await getStats();
  console.log('Before pruning:');
  console.log(`  Rates: ${beforeStats.rates} rows`);
  console.log(`  Usage logs: ${beforeStats.usageLogs} rows\n`);

  // Prune data
  const prunedRates = await pruneRates();
  const prunedUsageLogs = await pruneUsageLogs();

  // Get after stats
  const afterStats = await getStats();

  // Summary
  console.log('\n✅ Pruning complete!');
  console.log(`   Rates deleted: ${prunedRates}`);
  console.log(`   Usage logs deleted: ${prunedUsageLogs}`);
  console.log(`\nAfter pruning:`);
  console.log(`  Rates: ${afterStats.rates} rows`);
  console.log(`  Usage logs: ${afterStats.usageLogs} rows`);

  await closeDb();
}

// Run if executed directly
prune().catch((error) => {
  console.error('❌ Pruning failed:', error);
  process.exit(1);
});

// Export for Vercel Cron
export { prune };
