// NASDAQ Stocks Registry - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

export const NASDAQ_STOCKS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "GOOGL", name: "Alphabet Inc. Class A" },
  { ticker: "GOOG", name: "Alphabet Inc. Class C" },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "META", name: "Meta Platforms Inc." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "AVGO", name: "Broadcom Inc." },
  { ticker: "COST", name: "Costco Wholesale Corporation" },
  { ticker: "NFLX", name: "Netflix Inc." },
  { ticker: "AMD", name: "Advanced Micro Devices Inc." },
  { ticker: "ADBE", name: "Adobe Inc." },
  { ticker: "PEP", name: "PepsiCo Inc." },
  { ticker: "CSCO", name: "Cisco Systems Inc." },
  { ticker: "INTC", name: "Intel Corporation" },
  { ticker: "QCOM", name: "QUALCOMM Incorporated" },
  { ticker: "TXN", name: "Texas Instruments Incorporated" },
  { ticker: "INTU", name: "Intuit Inc." },
  { ticker: "PYPL", name: "PayPal Holdings Inc." },
] as const;

export type StockTicker = (typeof NASDAQ_STOCKS)[number]["ticker"];

export function isValidStock(ticker: string): ticker is StockTicker {
  return NASDAQ_STOCKS.some((s) => s.ticker === ticker.toUpperCase());
}

export function getStockTickers(): StockTicker[] {
  return NASDAQ_STOCKS.map((s) => s.ticker);
}
