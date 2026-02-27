import { Redis } from '@upstash/redis';

/**
 * Redis client for rate limiting and caching
 *
 * Uses Upstash Redis which is optimized for serverless/edge environments.
 * The client is created lazily to avoid errors during build time
 * when environment variables may not be available.
 */

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    const token = process.env.REDIS_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Redis configuration missing. Please set REDIS_URL and REDIS_TOKEN environment variables.'
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

/**
 * Check if Redis is available and responsive
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedis();
    const result = await client.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
