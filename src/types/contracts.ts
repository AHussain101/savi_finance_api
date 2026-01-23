/**
 * INTERFACE CONTRACTS
 * ===================
 *
 * DO NOT MODIFY THESE WITHOUT TEAM APPROVAL!
 *
 * These interfaces define the contracts between team members' code.
 * Changing them will break other people's work.
 *
 * If you need to change something:
 * 1. Discuss in team chat first
 * 2. Get approval from affected team members
 * 3. Update all affected code together
 * 4. Communicate the change to everyone
 */

// ============================================
// DATABASE MODELS (Sean owns, everyone uses)
// ============================================

/**
 * User model - stored in MongoDB
 * @owner Sean (model definition)
 * @writer Matthew (via Clerk/Stripe webhooks)
 * @reader Aarfan (for subscription checks)
 */
export interface UserContract {
  _id: string;
  clerkId: string;
  email: string;
  stripeCustomerId?: string;
  subscriptionStatus: "active" | "inactive" | "canceled";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Key model - stored in MongoDB
 * @owner Sean (model definition)
 * @writer Aarfan (create/revoke keys)
 * @reader Aarfan (for validation)
 */
export interface ApiKeyContract {
  _id: string;
  userId: string;
  key: string; // Hashed in DB
  keyPrefix: string; // For display: "sk_live_xxxx"
  name: string;
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

/**
 * Rate model - stored in MongoDB
 * @owner Sean (model definition, data ingestion)
 * @reader Aarfan (for API responses)
 */
export interface RateContract {
  _id: string;
  type: "fiat" | "crypto" | "stock" | "metal";
  base: string; // Always "USD"
  quote: string; // Target: EUR, BTC, AAPL, XAU
  rate: number;
  dataDate: Date;
  source: string;
  updatedAt: Date;
}

// ============================================
// API RESPONSES (Aarfan owns, Victoria uses)
// ============================================

/**
 * Standard API response wrapper
 * @owner Aarfan
 * @consumer Victoria (frontend)
 */
export interface ApiResponseContract<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    cached?: boolean;
    timestamp?: string; // ISO date string
    source: "FinFlux";
  };
}

/**
 * GET /api/v1/keys response
 * @owner Aarfan
 * @consumer Victoria
 */
export interface GetKeysResponse {
  keys: Array<{
    id: string;
    name: string;
    keyPrefix: string; // "sk_live_xxxx"
    createdAt: string; // ISO date
    lastUsedAt: string | null;
  }>;
}

/**
 * POST /api/v1/keys response
 * @owner Aarfan
 * @consumer Victoria
 */
export interface CreateKeyResponse {
  key: string; // Full key - only shown once!
  name: string;
  createdAt: string;
}

/**
 * GET /api/v1/usage response
 * @owner Aarfan
 * @consumer Victoria
 */
export interface GetUsageResponse {
  totalCalls: number;
  period: string; // "2024-01"
  breakdown?: {
    fiat: number;
    crypto: number;
    stock: number;
    metal: number;
  };
}

/**
 * Rate endpoint responses
 * @owner Aarfan
 * @consumer External API users
 */
export interface FiatRateResponse {
  from: string;
  to: string;
  rate: number;
}

export interface CryptoRateResponse {
  symbol: string;
  currency: string;
  rate: number;
}

export interface StockRateResponse {
  ticker: string;
  price: number;
  currency: "USD";
}

export interface MetalRateResponse {
  symbol: string;
  currency: string;
  rate: number;
}

// ============================================
// AUTH & BILLING (Matthew owns, everyone uses)
// ============================================

/**
 * Subscription check function signature
 * @owner Matthew
 * @consumer Aarfan (API middleware)
 */
export type CheckSubscriptionFn = (userId: string) => Promise<boolean>;

/**
 * Billing portal function signature
 * @owner Matthew
 * @consumer Victoria (billing page)
 */
export type CreateBillingPortalFn = (
  customerId: string
) => Promise<{ url: string }>;

// ============================================
// CACHE (Aarfan owns, Sean triggers refresh)
// ============================================

/**
 * Cache refresh function signature
 * @owner Aarfan
 * @caller Sean (after data ingestion)
 */
export type RefreshCacheFn = (
  type?: "fiat" | "crypto" | "stock" | "metal"
) => Promise<void>;

/**
 * Cached rate format
 * @owner Aarfan
 */
export interface CachedRateContract {
  rate: number;
  dataDate: string; // ISO date
  updatedAt: string; // ISO timestamp
}

// ============================================
// VALIDATION (Sean owns registries)
// ============================================

/**
 * Registry validation functions
 * @owner Sean
 * @consumer Aarfan (API validation)
 */
export type IsValidFiatFn = (code: string) => boolean;
export type IsValidCryptoFn = (symbol: string) => boolean;
export type IsValidStockFn = (ticker: string) => boolean;
export type IsValidMetalFn = (symbol: string) => boolean;
