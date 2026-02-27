import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getDb } from '../client';
import { rates, type Rate, type NewRate, type AssetClass } from '../schema';

/**
 * Get rates for a symbol within a date range
 * Results are ordered by date descending (most recent first)
 */
export async function getRates(
  symbol: string,
  fromDate: Date,
  toDate: Date
): Promise<Rate[]> {
  const db = getDb();
  return db
    .select()
    .from(rates)
    .where(
      and(
        eq(rates.symbol, symbol),
        gte(rates.recordedDate, fromDate.toISOString().split('T')[0]),
        lte(rates.recordedDate, toDate.toISOString().split('T')[0])
      )
    )
    .orderBy(desc(rates.recordedDate));
}

/**
 * Get the latest rate for a symbol
 */
export async function getLatestRate(symbol: string): Promise<Rate | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(rates)
    .where(eq(rates.symbol, symbol))
    .orderBy(desc(rates.recordedDate))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Get all unique symbols for an asset class
 */
export async function getSymbolsByAssetClass(assetClass: AssetClass): Promise<string[]> {
  const db = getDb();
  const result = await db
    .selectDistinct({ symbol: rates.symbol })
    .from(rates)
    .where(eq(rates.assetClass, assetClass))
    .orderBy(rates.symbol);
  return result.map((r) => r.symbol);
}

/**
 * Get all available asset classes with their symbol counts
 */
export async function getAssetClassSummary(): Promise<{ assetClass: AssetClass; count: number }[]> {
  const db = getDb();
  const result = await db
    .select({
      assetClass: rates.assetClass,
      count: sql<number>`count(distinct ${rates.symbol})::int`,
    })
    .from(rates)
    .groupBy(rates.assetClass);
  return result as { assetClass: AssetClass; count: number }[];
}

/**
 * Upsert a rate (insert or ignore if exists)
 * Used by the ingestion pipeline
 */
export async function upsertRate(data: NewRate): Promise<Rate | null> {
  const db = getDb();
  const result = await db
    .insert(rates)
    .values(data)
    .onConflictDoNothing({ target: [rates.symbol, rates.recordedDate] })
    .returning();
  return result[0] ?? null;
}

/**
 * Bulk upsert rates
 * Used by the ingestion pipeline for efficiency
 */
export async function bulkUpsertRates(data: NewRate[]): Promise<number> {
  if (data.length === 0) return 0;

  const db = getDb();
  const result = await db
    .insert(rates)
    .values(data)
    .onConflictDoNothing({ target: [rates.symbol, rates.recordedDate] })
    .returning();
  return result.length;
}

/**
 * Delete rates older than a specified date
 * Used by the pruning script to keep only 90 days of data for MVP
 */
export async function deleteRatesOlderThan(date: Date): Promise<number> {
  const db = getDb();
  const dateStr = date.toISOString().split('T')[0];
  const result = await db
    .delete(rates)
    .where(sql`${rates.recordedDate} < ${dateStr}`)
    .returning();
  return result.length;
}
