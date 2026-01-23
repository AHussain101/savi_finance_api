// Metals-API Client - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

const API_KEY = process.env.METALS_API_KEY;
const BASE_URL = "https://metals-api.com/api";

interface MetalsResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

// Metal symbols follow ISO 4217
export const SUPPORTED_METALS = ["XAU", "XAG", "XPT"]; // Gold, Silver, Platinum

export async function fetchMetalRates(): Promise<
  Map<string, { rate: number; date: Date }>
> {
  if (!API_KEY) {
    throw new Error("METALS_API_KEY not configured");
  }

  const symbols = SUPPORTED_METALS.join(",");
  const url = `${BASE_URL}/latest?access_key=${API_KEY}&base=USD&symbols=${symbols}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Metals-API error: ${response.status}`);
  }

  const data: MetalsResponse = await response.json();

  if (!data.success) {
    throw new Error("Metals-API returned unsuccessful response");
  }

  const results = new Map();
  const date = new Date(data.timestamp * 1000);

  // Note: Metals-API returns inverted rates (1/price)
  // So we need to invert them to get USD -> Metal
  for (const [metal, invertedRate] of Object.entries(data.rates)) {
    if (SUPPORTED_METALS.includes(metal)) {
      // Convert from "how much metal per 1 USD" to "how much USD per 1 unit of metal"
      const rate = 1 / invertedRate;
      results.set(metal, { rate, date });
    }
  }

  return results;
}
