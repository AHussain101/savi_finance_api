import { NextResponse } from 'next/server';
import { getRedis } from './redis';
import type { Plan } from '@/db/schema';

const SANDBOX_DAILY_LIMIT = 1000;

/**
 * Get the current UTC date as YYYY-MM-DD string
 */
function getUtcDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get unix timestamp of next midnight UTC
 */
function getNextMidnightUtc(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.floor(tomorrow.getTime() / 1000);
}

/**
 * Get seconds until next midnight UTC
 */
function getSecondsUntilMidnight(): number {
  const now = Math.floor(Date.now() / 1000);
  return getNextMidnightUtc() - now;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp of reset
  retryAfter?: number; // Seconds until reset (only if not allowed)
}

/**
 * Check and increment rate limit for an API key
 *
 * @param apiKeyId - The API key ID
 * @param plan - The user's plan ('sandbox' or 'standard')
 * @returns RateLimitResult with current state
 */
export async function checkRateLimit(
  apiKeyId: string,
  plan: Plan
): Promise<RateLimitResult> {
  const redis = getRedis();
  const dateKey = getUtcDateKey();
  const redisKey = `rl:${apiKeyId}:${dateKey}`;

  // Increment the counter
  const count = await redis.incr(redisKey);

  // Set expiry on first increment (24 hours from now to be safe)
  if (count === 1) {
    await redis.expire(redisKey, 86400);
  }

  const resetTimestamp = getNextMidnightUtc();

  // Standard plan: unlimited (never block)
  if (plan === 'standard') {
    return {
      allowed: true,
      limit: -1, // Unlimited
      remaining: -1,
      reset: resetTimestamp,
    };
  }

  // Sandbox plan: enforce 1000/day limit
  const remaining = Math.max(0, SANDBOX_DAILY_LIMIT - count);
  const allowed = count <= SANDBOX_DAILY_LIMIT;

  return {
    allowed,
    limit: SANDBOX_DAILY_LIMIT,
    remaining,
    reset: resetTimestamp,
    retryAfter: allowed ? undefined : getSecondsUntilMidnight(),
  };
}

/**
 * Create rate limit headers for the response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.limit !== -1) {
    headers['X-RateLimit-Limit'] = result.limit.toString();
    headers['X-RateLimit-Remaining'] = result.remaining.toString();
  }

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Rate limit middleware that returns a 429 response if limit exceeded
 *
 * @param apiKeyId - The API key ID
 * @param plan - The user's plan
 * @returns NextResponse with 429 if rate limited, null otherwise
 */
export async function rateLimitMiddleware(
  apiKeyId: string,
  plan: Plan
): Promise<NextResponse | null> {
  const result = await checkRateLimit(apiKeyId, plan);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `You have exceeded the daily limit of ${result.limit} API calls for the Sandbox plan. Upgrade to Standard for unlimited calls.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  return null;
}

/**
 * Get current usage count for an API key (for display purposes)
 */
export async function getCurrentUsage(apiKeyId: string): Promise<number> {
  const redis = getRedis();
  const dateKey = getUtcDateKey();
  const redisKey = `rl:${apiKeyId}:${dateKey}`;

  const count = await redis.get<number>(redisKey);
  return count ?? 0;
}
