// API Key Validation Middleware - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { redis } from "@/lib/cache/redis";
import { ApiKey } from "@/lib/db/models/api-key";
import { User } from "@/lib/db/models/user";
import { connectToDatabase } from "@/lib/db/connection";

interface ValidationResult {
  valid: boolean;
  keyId?: string;
  userId?: string;
  subscriptionActive?: boolean;
}

interface CachedKeyData {
  keyId: string;
  userId: string;
  subscriptionActive: boolean;
  revokedAt: string | null;
}

export async function validateApiKey(
  key: string | null
): Promise<ValidationResult> {
  if (!key || !key.startsWith("sk_live_")) {
    return { valid: false };
  }

  const cacheKey = `apikey:${key}`;

  // Check cache first
  const cached = await redis.get<CachedKeyData>(cacheKey);
  if (cached) {
    if (cached.revokedAt || !cached.subscriptionActive) {
      return { valid: false };
    }
    return {
      valid: true,
      keyId: cached.keyId,
      userId: cached.userId,
      subscriptionActive: cached.subscriptionActive,
    };
  }

  // Check database
  await connectToDatabase();
  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey || apiKey.revokedAt) {
    return { valid: false };
  }

  // Check subscription status
  const user = await User.findById(apiKey.userId);
  const subscriptionActive = user?.subscriptionStatus === "active";

  // Cache the result for 5 minutes
  const cacheData: CachedKeyData = {
    keyId: apiKey._id.toString(),
    userId: apiKey.userId.toString(),
    subscriptionActive,
    revokedAt: apiKey.revokedAt?.toISOString() || null,
  };
  await redis.setex(cacheKey, 300, cacheData);

  return {
    valid: subscriptionActive,
    keyId: apiKey._id.toString(),
    userId: apiKey.userId.toString(),
    subscriptionActive,
  };
}

export async function trackUsage(keyId: string, endpoint: string): Promise<void> {
  // TODO: Implement usage tracking
  // This could be done async to not block the response
  console.log(`Usage: ${keyId} -> ${endpoint}`);
}
