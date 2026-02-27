import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getApiKeyByHash } from '@/db/queries/api-keys';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';
import type { Plan } from '@/db/schema';

export interface ApiKeyAuth {
  userId: string;
  apiKeyId: string;
  plan: Plan;
}

/**
 * Hash an API key for comparison
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authenticate a request using API key from Bearer token
 *
 * @param request - The incoming request
 * @returns ApiKeyAuth object with userId, apiKeyId, and plan
 * @throws NextResponse with 401 if authentication fails
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyAuth> {
  const authHeader = request.headers.get('authorization');
  const rawKey = extractBearerToken(authHeader);

  if (!rawKey) {
    throw NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please provide a valid API key in the Authorization header: Bearer vl_<your_key>',
      },
      { status: 401 }
    );
  }

  // Validate key format
  if (!rawKey.startsWith('vl_') || rawKey.length !== 67) {
    throw NextResponse.json(
      {
        error: 'Invalid API key format',
        message: 'API keys should be in the format: vl_<64 hex characters>',
      },
      { status: 401 }
    );
  }

  // Hash the key and look it up
  const keyHash = hashApiKey(rawKey);
  const apiKey = await getApiKeyByHash(keyHash);

  if (!apiKey) {
    throw NextResponse.json(
      {
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been revoked',
      },
      { status: 401 }
    );
  }

  if (!apiKey.isActive) {
    throw NextResponse.json(
      {
        error: 'API key revoked',
        message: 'This API key has been revoked. Please generate a new key.',
      },
      { status: 401 }
    );
  }

  // Get the user's plan from their subscription
  const subscription = await getSubscriptionByUser(apiKey.userId);
  const plan: Plan = subscription?.plan ?? 'sandbox';

  return {
    userId: apiKey.userId,
    apiKeyId: apiKey.id,
    plan,
  };
}

/**
 * Try to authenticate without throwing
 * Returns null if authentication fails
 */
export async function tryAuthenticateApiKey(request: Request): Promise<ApiKeyAuth | null> {
  try {
    return await authenticateApiKey(request);
  } catch {
    return null;
  }
}
