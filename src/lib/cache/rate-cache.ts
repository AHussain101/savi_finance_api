// Rate Caching Logic - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { redis } from "./redis";
import { Rate, RateType } from "@/lib/db/models/rate";
import { connectToDatabase } from "@/lib/db/connection";

interface CachedRate {
  rate: number;
  dataDate: string;
  updatedAt: string;
}

const CACHE_TTL = 86400; // 24 hours

export async function getRate(
  type: RateType,
  base: string,
  quote: string
): Promise<CachedRate | null> {
  const cacheKey = `rate:${type}:${base}:${quote}`;

  // Try cache first
  const cached = await redis.get<CachedRate>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fallback to MongoDB (should rarely happen)
  await connectToDatabase();
  const dbRate = await Rate.findOne({ type, base, quote });

  if (dbRate) {
    const cacheData: CachedRate = {
      rate: dbRate.rate,
      dataDate: dbRate.dataDate.toISOString(),
      updatedAt: dbRate.updatedAt.toISOString(),
    };

    // Populate cache for next time
    await redis.setex(cacheKey, CACHE_TTL, cacheData);
    return cacheData;
  }

  return null;
}

export async function setRate(
  type: RateType,
  base: string,
  quote: string,
  rate: number,
  dataDate: Date
): Promise<void> {
  const cacheKey = `rate:${type}:${base}:${quote}`;
  const cacheData: CachedRate = {
    rate,
    dataDate: dataDate.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await redis.setex(cacheKey, CACHE_TTL, cacheData);
}

export async function refreshCache(type?: RateType): Promise<void> {
  await connectToDatabase();

  const query = type ? { type } : {};
  const rates = await Rate.find(query);

  for (const rate of rates) {
    await setRate(rate.type, rate.base, rate.quote, rate.rate, rate.dataDate);
  }
}
