// API Types - Shared
// All team members can reference these types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiMeta {
  cached?: boolean;
  timestamp?: string;
  source: string;
}

// Rate endpoint responses
export interface FiatRateData {
  from: string;
  to: string;
  rate: number;
}

export interface CryptoRateData {
  symbol: string;
  currency: string;
  rate: number;
}

export interface StockPriceData {
  ticker: string;
  price: number;
  currency: string;
}

export interface MetalRateData {
  symbol: string;
  currency: string;
  rate: number;
}

// API Key responses
export interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface NewApiKeyData extends ApiKeyData {
  key: string; // Full key, only shown on creation
}

// Usage responses
export interface UsageData {
  totalCalls: number;
  period: string;
  breakdown?: {
    fiat: number;
    crypto: number;
    stock: number;
    metal: number;
  };
}
