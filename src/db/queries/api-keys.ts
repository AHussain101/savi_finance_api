import { eq, and, count } from 'drizzle-orm';
import { getDb } from '../client';
import { apiKeys, type ApiKey } from '../schema';

/**
 * Create a new API key
 * Note: The raw key should be shown to the user once; only the hash is stored
 */
export async function createApiKey(data: {
  userId: string;
  keyHash: string;
  label?: string;
}): Promise<ApiKey> {
  const db = getDb();
  const result = await db
    .insert(apiKeys)
    .values({
      userId: data.userId,
      keyHash: data.keyHash,
      label: data.label ?? null,
    })
    .returning();
  return result[0];
}

/**
 * Get all active API keys for a user
 */
export async function getActiveKeysByUser(userId: string): Promise<ApiKey[]> {
  const db = getDb();
  return db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)));
}

/**
 * Get an API key by its hash (for authentication)
 */
export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(keyId: string, userId: string): Promise<ApiKey | null> {
  const db = getDb();
  const result = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
    .returning();
  return result[0] ?? null;
}

/**
 * Get the count of active API keys for a user
 * Used to enforce key limits: Sandbox = 1, Standard = 2
 */
export async function getKeyCountByUser(userId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)));
  return result[0]?.count ?? 0;
}
