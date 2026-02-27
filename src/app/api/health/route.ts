import { NextResponse } from 'next/server';
import { pingDb } from '@/db/client';
import { pingRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  db: 'ok' | 'error';
  redis: 'ok' | 'error';
  timestamp: string;
}

/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring.
 * Pings the database and Redis to verify connectivity.
 *
 * Returns 200 if all services are healthy, 503 if any service is down.
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Check services in parallel
  const [dbOk, redisOk] = await Promise.all([
    pingDb().catch(() => false),
    pingRedis().catch(() => false),
  ]);

  const dbStatus = dbOk ? 'ok' : 'error';
  const redisStatus = redisOk ? 'ok' : 'error';

  // Determine overall status
  let overallStatus: 'ok' | 'degraded' | 'error';
  if (dbOk && redisOk) {
    overallStatus = 'ok';
  } else if (dbOk || redisOk) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'error';
  }

  const response: HealthStatus = {
    status: overallStatus,
    db: dbStatus,
    redis: redisStatus,
    timestamp,
  };

  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}
