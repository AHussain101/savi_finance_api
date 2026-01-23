// Redis Client - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Please define UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache key naming convention:
// rate:{type}:{base}:{quote} - e.g., rate:fiat:USD:EUR
// apikey:{key} - API key validation cache
