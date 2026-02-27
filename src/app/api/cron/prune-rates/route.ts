import { NextResponse } from 'next/server';
import { sql, lt } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { rates, usageLogs } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RETENTION_DAYS = 90;
const USAGE_LOG_RETENTION_DAYS = 90;

/**
 * Verify the request is from Vercel Cron
 */
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * GET /api/cron/prune-rates
 *
 * Cron endpoint for weekly data pruning.
 * Removes rate data and usage logs older than the retention period.
 * Called by Vercel Cron every Sunday at 3 AM UTC.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const db = getDb();
    const rateCutoffDate = getDaysAgo(RETENTION_DAYS);
    const usageLogCutoffDate = new Date();
    usageLogCutoffDate.setDate(usageLogCutoffDate.getDate() - USAGE_LOG_RETENTION_DAYS);

    // Count before pruning
    const beforeRates = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rates);
    const beforeUsage = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usageLogs);

    // Prune old rates
    const prunedRates = await db
      .delete(rates)
      .where(sql`${rates.recordedDate} < ${rateCutoffDate}`)
      .returning({ id: rates.id });

    // Prune old usage logs
    const prunedUsage = await db
      .delete(usageLogs)
      .where(lt(usageLogs.calledAt, usageLogCutoffDate))
      .returning({ id: usageLogs.id });

    // Count after pruning
    const afterRates = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rates);
    const afterUsage = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usageLogs);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      retentionDays: RETENTION_DAYS,
      cutoffDate: rateCutoffDate,
      stats: {
        rates: {
          before: beforeRates[0]?.count ?? 0,
          deleted: prunedRates.length,
          after: afterRates[0]?.count ?? 0,
        },
        usageLogs: {
          before: beforeUsage[0]?.count ?? 0,
          deleted: prunedUsage.length,
          after: afterUsage[0]?.count ?? 0,
        },
      },
      durationMs: duration,
    });
  } catch (error) {
    console.error('Pruning failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
