// OpenExchangeRates Client - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

const APP_ID = process.env.OPENEXCHANGE_APP_ID;
const BASE_URL = "https://openexchangerates.org/api";

interface LatestResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export async function fetchFiatRates(): Promise<
  Map<string, { rate: number; date: Date }>
> {
  if (!APP_ID) {
    throw new Error("OPENEXCHANGE_APP_ID not configured");
  }

  const url = `${BASE_URL}/latest.json?app_id=${APP_ID}&base=USD`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenExchangeRates API error: ${response.status}`);
  }

  const data: LatestResponse = await response.json();
  const results = new Map();
  const date = new Date(data.timestamp * 1000);

  for (const [currency, rate] of Object.entries(data.rates)) {
    results.set(currency, { rate, date });
  }

  return results;
}

// Supported currencies we care about
export const SUPPORTED_FIAT = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "CNY",
  "INR",
  "MXN",
  "BRL",
  "KRW",
  "SGD",
  "HKD",
  "NOK",
  "SEK",
  "DKK",
  "NZD",
  "ZAR",
  "RUB",
];
