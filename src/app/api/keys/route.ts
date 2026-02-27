import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { requireAuth } from '@/lib/auth';
import { createApiKey, getActiveKeysByUser, getKeyCountByUser } from '@/db/queries/api-keys';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';

export const dynamic = 'force-dynamic';

// Plan limits for API keys
const KEY_LIMITS = {
  sandbox: 1,
  standard: 2,
} as const;

/**
 * Generate a new API key
 * Format: vl_<64 hex chars>
 */
function generateApiKey(): string {
  return `vl_${randomBytes(32).toString('hex')}`;
}

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Get last 4 characters of the raw key for display
 */
function getLastFour(keyHash: string): string {
  // We can't recover the last 4 from hash, so we store a hint
  // For existing keys, we'll show the hash prefix instead
  return keyHash.slice(-8);
}

interface ApiKeyResponse {
  id: string;
  label: string | null;
  createdAt: string;
  lastFourChars: string;
}

interface CreateKeyResponse {
  id: string;
  key: string; // Raw key shown once
  label: string | null;
  createdAt: string;
}

/**
 * GET /api/keys
 *
 * List all active API keys for the authenticated user
 */
export async function GET(): Promise<NextResponse<ApiKeyResponse[] | { error: string }>> {
  try {
    const payload = await requireAuth();

    const keys = await getActiveKeysByUser(payload.sub);

    const response: ApiKeyResponse[] = keys.map((key) => ({
      id: key.id,
      label: key.label,
      createdAt: key.createdAt.toISOString(),
      lastFourChars: getLastFour(key.keyHash),
    }));

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('List keys error:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 *
 * Create a new API key for the authenticated user
 * Enforces plan limits: Sandbox = 1 key, Standard = 2 keys
 */
export async function POST(request: Request): Promise<NextResponse<CreateKeyResponse | { error: string }>> {
  try {
    const payload = await requireAuth();

    // Get user's subscription to check plan
    const subscription = await getSubscriptionByUser(payload.sub);
    const plan = subscription?.plan ?? 'sandbox';

    // Check current key count against limit
    const currentKeyCount = await getKeyCountByUser(payload.sub);
    const keyLimit = KEY_LIMITS[plan as keyof typeof KEY_LIMITS] ?? KEY_LIMITS.sandbox;

    if (currentKeyCount >= keyLimit) {
      const upgradeMessage =
        plan === 'sandbox'
          ? ' Upgrade to Standard for 2 API keys.'
          : '';
      return NextResponse.json(
        {
          error: `API key limit reached. Your ${plan} plan allows ${keyLimit} active key${keyLimit > 1 ? 's' : ''}.${upgradeMessage}`,
        },
        { status: 403 }
      );
    }

    // Parse optional label from request body
    let label: string | undefined;
    try {
      const body = await request.json();
      label = body.label;
    } catch {
      // No body or invalid JSON is fine
    }

    // Generate and store new API key
    const rawApiKey = generateApiKey();
    const keyHash = hashApiKey(rawApiKey);

    const apiKey = await createApiKey({
      userId: payload.sub,
      keyHash,
      label,
    });

    return NextResponse.json({
      id: apiKey.id,
      key: rawApiKey, // Only time the raw key is shown
      label: apiKey.label,
      createdAt: apiKey.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Create key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
