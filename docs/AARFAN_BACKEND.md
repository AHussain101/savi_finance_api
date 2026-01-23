# Aarfan's Development Guide - Backend

## Role: Backend Developer
**Focus**: API endpoints, Redis caching, rate calculations, API authentication

---

## Your Files & Directories

```
src/
├── app/
│   └── api/
│       └── v1/
│           ├── rates/
│           │   ├── fiat/route.ts       # GET /api/v1/rates/fiat
│           │   ├── crypto/route.ts     # GET /api/v1/rates/crypto
│           │   ├── stock/route.ts      # GET /api/v1/rates/stock
│           │   └── metal/route.ts      # GET /api/v1/rates/metal
│           ├── keys/
│           │   └── route.ts            # API key CRUD
│           └── usage/
│               └── route.ts            # Usage statistics
├── lib/
│   ├── cache/
│   │   ├── redis.ts                    # Redis client setup
│   │   └── rate-cache.ts               # Rate caching logic
│   └── api/
│       ├── middleware.ts               # API key validation
│       ├── response.ts                 # Standard response helpers
│       └── rate-calculator.ts          # Cross-rate calculations
└── types/
    ├── api.ts                          # API types
    └── rate.ts                         # Rate types
```

---

## Tasks Checklist

### Phase 1: Core Setup
- [ ] Set up Redis client (Upstash)
- [ ] Create standard API response wrapper
- [ ] Define TypeScript types for rates and responses
- [ ] Create API key validation middleware

### Phase 2: Caching Layer
- [ ] Implement rate caching with 24h TTL
- [ ] Create cache key naming convention
- [ ] Implement cache-first read strategy
- [ ] Create cache refresh function (called by Sean's ingestion)
- [ ] Implement cache hydration from MongoDB on startup

### Phase 3: API Endpoints
- [ ] `/api/v1/rates/fiat` - Fiat exchange rates
- [ ] `/api/v1/rates/crypto` - Crypto rates
- [ ] `/api/v1/rates/stock` - NASDAQ stock prices
- [ ] `/api/v1/rates/metal` - Precious metal rates
- [ ] `/api/v1/keys` - API key management (CRUD)
- [ ] `/api/v1/usage` - Usage statistics

### Phase 4: Rate Calculations
- [ ] Implement base currency normalization (USD base)
- [ ] Implement cross-rate triangulation
- [ ] Handle all currency pair combinations

### Phase 5: Error Handling
- [ ] Implement "Never Fail" policy (return stale data on failure)
- [ ] Add proper error codes and messages
- [ ] Log errors without exposing to users

---

## API Response Format

### Standard Response Wrapper
```typescript
// lib/api/response.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    cached: boolean;
    timestamp: string;  // Data date (T-1)
    source: string;     // "FinFlux"
  };
}

export function successResponse<T>(data: T, dataDate: Date, cached = true) {
  return Response.json({
    success: true,
    data,
    meta: {
      cached,
      timestamp: dataDate.toISOString(),
      source: 'FinFlux'
    }
  });
}

export function errorResponse(code: string, message: string, status = 400) {
  return Response.json({
    success: false,
    error: { code, message },
    meta: { source: 'FinFlux' }
  }, { status });
}
```

---

## API Endpoints Implementation

### Fiat Rates
```typescript
// app/api/v1/rates/fiat/route.ts
import { validateApiKey } from '@/lib/api/middleware';
import { getRateFromCache, calculateCrossRate } from '@/lib/cache/rate-cache';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  // Validate API key
  const apiKey = req.headers.get('x-api-key');
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return errorResponse('INVALID_API_KEY', 'Invalid or missing API key', 401);
  }

  // Parse params
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from')?.toUpperCase();  // e.g., USD
  const to = searchParams.get('to')?.toUpperCase();      // e.g., EUR

  if (!from || !to) {
    return errorResponse('MISSING_PARAMS', 'from and to parameters required');
  }

  // Get rate (with triangulation if needed)
  const result = await calculateCrossRate('fiat', from, to);

  // Track usage
  await trackUsage(validation.keyId, 'fiat');

  return successResponse(
    { from, to, rate: result.rate },
    result.dataDate
  );
}
```

### Crypto Rates
```typescript
// app/api/v1/rates/crypto/route.ts
// Params: symbol (BTC), currency (USD)
// Returns: { symbol, currency, rate }
```

### Stock Prices
```typescript
// app/api/v1/rates/stock/route.ts
// Params: ticker (AAPL)
// Returns: { ticker, price, currency: "USD" }
```

### Metal Rates
```typescript
// app/api/v1/rates/metal/route.ts
// Params: symbol (XAU), currency (USD)
// Returns: { symbol, currency, rate }
```

---

## Caching Strategy

### Redis Key Convention
```
rate:{type}:{base}:{quote}
Examples:
- rate:fiat:USD:EUR
- rate:crypto:USD:BTC
- rate:stock:USD:AAPL
- rate:metal:USD:XAU
```

### Cache Structure
```typescript
interface CachedRate {
  rate: number;
  dataDate: string;    // ISO date
  updatedAt: string;   // ISO timestamp
}
```

### Cache-First Read
```typescript
// lib/cache/rate-cache.ts
import { redis } from './redis';
import { Rate } from '@/lib/db/models/rate';

export async function getRate(type: string, base: string, quote: string) {
  const cacheKey = `rate:${type}:${base}:${quote}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return { ...JSON.parse(cached), fromCache: true };
  }

  // Fallback to MongoDB (should rarely happen)
  const dbRate = await Rate.findOne({ type, base, quote });
  if (dbRate) {
    // Populate cache for next time
    await redis.setex(cacheKey, 86400, JSON.stringify({
      rate: dbRate.rate,
      dataDate: dbRate.dataDate.toISOString(),
      updatedAt: dbRate.updatedAt.toISOString()
    }));
    return { ...dbRate.toObject(), fromCache: false };
  }

  return null;
}
```

---

## Rate Triangulation

All data is stored with USD as base. For cross-rates:

```typescript
// lib/api/rate-calculator.ts
export async function calculateCrossRate(
  type: string,
  from: string,
  to: string
): Promise<{ rate: number; dataDate: Date }> {

  // If from is USD, direct lookup
  if (from === 'USD') {
    const rate = await getRate(type, 'USD', to);
    return { rate: rate.rate, dataDate: new Date(rate.dataDate) };
  }

  // If to is USD, invert the rate
  if (to === 'USD') {
    const rate = await getRate(type, 'USD', from);
    return { rate: 1 / rate.rate, dataDate: new Date(rate.dataDate) };
  }

  // Cross-rate: CAD -> EUR = (USD -> EUR) / (USD -> CAD)
  const [toUsdRate, fromUsdRate] = await Promise.all([
    getRate(type, 'USD', to),
    getRate(type, 'USD', from)
  ]);

  const crossRate = toUsdRate.rate / fromUsdRate.rate;
  const olderDate = new Date(Math.min(
    new Date(toUsdRate.dataDate).getTime(),
    new Date(fromUsdRate.dataDate).getTime()
  ));

  return { rate: crossRate, dataDate: olderDate };
}
```

---

## API Key Validation

```typescript
// lib/api/middleware.ts
import { redis } from '@/lib/cache/redis';
import { ApiKey } from '@/lib/db/models/api-key';

interface ValidationResult {
  valid: boolean;
  keyId?: string;
  userId?: string;
  subscriptionActive?: boolean;
}

export async function validateApiKey(key: string | null): Promise<ValidationResult> {
  if (!key || !key.startsWith('sk_live_')) {
    return { valid: false };
  }

  // Check cache first
  const cacheKey = `apikey:${key}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    if (data.revokedAt || !data.subscriptionActive) {
      return { valid: false };
    }
    return { valid: true, ...data };
  }

  // Check database
  const apiKey = await ApiKey.findOne({ key }).populate('userId');
  if (!apiKey || apiKey.revokedAt) {
    return { valid: false };
  }

  // Check subscription status (coordinate with Matthew)
  const subscriptionActive = await checkSubscription(apiKey.userId);

  // Cache the result
  await redis.setex(cacheKey, 300, JSON.stringify({
    keyId: apiKey._id.toString(),
    userId: apiKey.userId._id.toString(),
    subscriptionActive
  }));

  return { valid: subscriptionActive, keyId: apiKey._id.toString() };
}
```

---

## Environment Variables You Need

```env
# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# MongoDB (shared with Sean)
MONGODB_URI=mongodb+srv://...
```

---

## Coordination Notes

### With Sean (Data)
- He populates MongoDB with rate data
- Call `refreshCache(type)` after his ingestion completes
- Use his registry for validating symbols/tickers
- Coordinate on Rate model schema

### With Matthew (Infrastructure)
- He handles subscription status
- Import `checkSubscription` from his billing utils
- API keys are activated/deactivated based on Stripe webhooks

### With Victoria (Frontend)
- She consumes your `/api/v1/keys` endpoint
- She consumes your `/api/v1/usage` endpoint
- Coordinate on response formats

---

## Quick Start

```bash
# Test Redis connection
npm run cache:test

# Hydrate cache from DB
npm run cache:hydrate

# Test API endpoint locally
curl -H "x-api-key: sk_live_test123" \
  "http://localhost:3000/api/v1/rates/fiat?from=USD&to=EUR"
```

---

## Testing Your Work

1. API key validation works (valid/invalid/revoked)
2. Cache hits return quickly (<50ms)
3. Cache misses fall back to MongoDB
4. Cross-rate calculations are accurate
5. Invalid symbols return proper error codes
6. "Never Fail" - stale data returned on cache miss + DB failure
7. Usage tracking records all API calls
