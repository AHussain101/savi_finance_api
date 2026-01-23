// Rate Triangulation Calculator - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { getRate } from "@/lib/cache/rate-cache";
import { RateType } from "@/lib/db/models/rate";

interface CrossRateResult {
  rate: number;
  dataDate: Date;
}

export async function calculateCrossRate(
  type: RateType,
  from: string,
  to: string
): Promise<CrossRateResult | null> {
  // If from is USD, direct lookup
  if (from === "USD") {
    const rate = await getRate(type, "USD", to);
    if (!rate) return null;
    return { rate: rate.rate, dataDate: new Date(rate.dataDate) };
  }

  // If to is USD, invert the rate
  if (to === "USD") {
    const rate = await getRate(type, "USD", from);
    if (!rate) return null;
    return { rate: 1 / rate.rate, dataDate: new Date(rate.dataDate) };
  }

  // Cross-rate: CAD -> EUR = (USD -> EUR) / (USD -> CAD)
  const [toUsdRate, fromUsdRate] = await Promise.all([
    getRate(type, "USD", to),
    getRate(type, "USD", from),
  ]);

  if (!toUsdRate || !fromUsdRate) return null;

  const crossRate = toUsdRate.rate / fromUsdRate.rate;
  const olderDate = new Date(
    Math.min(
      new Date(toUsdRate.dataDate).getTime(),
      new Date(fromUsdRate.dataDate).getTime()
    )
  );

  return { rate: crossRate, dataDate: olderDate };
}
