// CoinGecko Client - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

const BASE_URL = "https://api.coingecko.com/api/v3";

// Map our symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
};

interface PriceResponse {
  [id: string]: {
    usd: number;
    last_updated_at: number;
  };
}

export async function fetchCryptoRates(
  symbols: string[]
): Promise<Map<string, { rate: number; date: Date }>> {
  const ids = symbols
    .map((s) => SYMBOL_TO_ID[s.toUpperCase()])
    .filter(Boolean)
    .join(",");

  if (!ids) {
    return new Map();
  }

  const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: PriceResponse = await response.json();
  const results = new Map();

  for (const [symbol, id] of Object.entries(SYMBOL_TO_ID)) {
    if (data[id]) {
      results.set(symbol, {
        rate: data[id].usd,
        date: new Date(data[id].last_updated_at * 1000),
      });
    }
  }

  return results;
}

export function getCoinGeckoId(symbol: string): string | undefined {
  return SYMBOL_TO_ID[symbol.toUpperCase()];
}

export function getSupportedCryptos(): string[] {
  return Object.keys(SYMBOL_TO_ID);
}
