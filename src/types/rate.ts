// Rate Types - Shared
// All team members can reference these types

export type RateType = "fiat" | "crypto" | "stock" | "metal";

export interface Rate {
  type: RateType;
  base: string;
  quote: string;
  rate: number;
  dataDate: Date;
  source: string;
  updatedAt: Date;
}

export interface CachedRate {
  rate: number;
  dataDate: string;
  updatedAt: string;
}

export interface CrossRateResult {
  rate: number;
  dataDate: Date;
  fromCache: boolean;
}
