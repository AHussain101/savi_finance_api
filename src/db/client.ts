import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Database client singleton
 *
 * Uses node-postgres (pg) with Drizzle ORM for type-safe database access.
 * The client is created lazily to avoid errors during build time.
 */

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'Database configuration missing. Please set DATABASE_URL environment variable.'
      );
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings optimized for serverless
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

/**
 * Drizzle database client
 * Import schema when available: import * as schema from './schema';
 */
export function getDb() {
  return drizzle(getPool());
}

/**
 * Check if database is available and responsive
 */
export async function pingDb(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully close database connections
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
