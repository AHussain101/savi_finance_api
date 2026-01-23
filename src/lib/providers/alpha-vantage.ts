// AlphaVantage Client - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

const API_KEY = process.env.ALPHAVANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

interface GlobalQuoteResponse {
  "Global Quote": {
    "01. symbol": string;
    "05. price": string;
    "07. latest trading day": string;
  };
}

export async function fetchStockPrice(ticker: string): Promise<{
  ticker: string;
  price: number;
  date: Date;
} | null> {
  if (!API_KEY) {
    throw new Error("ALPHAVANTAGE_API_KEY not configured");
  }

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`AlphaVantage API error: ${response.status}`);
  }

  const data: GlobalQuoteResponse = await response.json();

  if (!data["Global Quote"]?.["05. price"]) {
    return null;
  }

  return {
    ticker: data["Global Quote"]["01. symbol"],
    price: parseFloat(data["Global Quote"]["05. price"]),
    date: new Date(data["Global Quote"]["07. latest trading day"]),
  };
}

export async function fetchMultipleStocks(
  tickers: string[]
): Promise<Map<string, { price: number; date: Date }>> {
  const results = new Map();

  // AlphaVantage has rate limits, so we need to fetch one at a time
  // with delays between requests
  for (const ticker of tickers) {
    try {
      const result = await fetchStockPrice(ticker);
      if (result) {
        results.set(ticker, { price: result.price, date: result.date });
      }
      // Rate limit: 5 calls per minute on free tier
      await new Promise((resolve) => setTimeout(resolve, 12000));
    } catch (error) {
      console.error(`Failed to fetch ${ticker}:`, error);
    }
  }

  return results;
}
