import { eq, and, gte, sql, count } from 'drizzle-orm';
import { getDb } from '../client';
import { usageLogs, type UsageLog } from '../schema';

/**
 * Log an API usage event
 */
export async function logUsage(
  apiKeyId: string,
  userId: string,
  endpoint: string
): Promise<UsageLog> {
  const db = getDb();
  const result = await db
    .insert(usageLogs)
    .values({
      apiKeyId,
      userId,
      endpoint,
    })
    .returning();
  return result[0];
}

/**
 * Get usage count for a user on a specific date
 * Used for analytics and verification (Redis is source-of-truth for real-time enforcement)
 */
export async function getDailyUsageCount(userId: string, date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: count() })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        gte(usageLogs.calledAt, startOfDay),
        sql`${usageLogs.calledAt} <= ${endOfDay}`
      )
    );
  return result[0]?.count ?? 0;
}

/**
 * Get usage count for an API key on a specific date
 */
export async function getDailyUsageCountByKey(apiKeyId: string, date: Date): Promise<number> {
  const db = getDb();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: count() })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.apiKeyId, apiKeyId),
        gte(usageLogs.calledAt, startOfDay),
        sql`${usageLogs.calledAt} <= ${endOfDay}`
      )
    );
  return result[0]?.count ?? 0;
}

/**
 * Get usage summary by endpoint for a user
 */
export async function getUsageSummaryByEndpoint(
  userId: string,
  fromDate: Date
): Promise<{ endpoint: string; count: number }[]> {
  const db = getDb();
  const result = await db
    .select({
      endpoint: usageLogs.endpoint,
      count: count(),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.calledAt, fromDate)))
    .groupBy(usageLogs.endpoint);
  return result.map((r) => ({ endpoint: r.endpoint, count: r.count }));
}

/**
 * Delete old usage logs (for cleanup)
 * Usage logs older than 90 days can be deleted for MVP
 */
export async function deleteOldUsageLogs(olderThan: Date): Promise<number> {
  const db = getDb();
  const result = await db
    .delete(usageLogs)
    .where(sql`${usageLogs.calledAt} < ${olderThan}`)
    .returning();
  return result.length;
}
