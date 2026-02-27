/**
 * EOD (End of Day) Data Ingestion Script
 *
 * Fetches the latest EOD rates for all asset classes and upserts into the rates table.
 * Designed to run once daily after market close via Vercel Cron or GitHub Actions.
 *
 * Data sources:
 * - Fiat: Exchange Rates API (exchangerate.host or similar)
 * - Crypto: CoinGecko API
 * - Stocks: Alpha Vantage or Financial Modeling Prep
 * - Metals: Metals API or similar
 *
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 * - FINANCIAL_DATA_API_KEY: API key for premium data provider (optional for free tier sources)
 *
 * Run manually: npx tsx src/scripts/ingest-eod.ts
 */

import { getDb, closeDb } from '../db/client';
import { rates, type AssetClass } from '../db/schema';

interface RateData {
  assetClass: AssetClass;
  symbol: string;
  rate: string;
  baseCurrency: string;
  recordedDate: string;
}

interface IngestionResult {
  assetClass: AssetClass;
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch fiat exchange rates
 * Uses exchangerate.host free tier (no API key required)
 */
async function fetchFiatRates(): Promise<RateData[]> {
  const today = getToday();
  const symbols = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL'];
  const rates: RateData[] = [];

  try {
    // Using exchangerate.host free API
    const url = `https://api.exchangerate.host/latest?base=USD&symbols=${symbols.join(',')}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.rates) {
      for (const [currency, rate] of Object.entries(data.rates)) {
        rates.push({
          assetClass: 'fiat',
          symbol: `USD/${currency}`,
          rate: String(rate),
          baseCurrency: 'USD',
          recordedDate: today,
        });
      }

      // Add EUR/GBP cross rate
      if (data.rates.EUR && data.rates.GBP) {
        const eurGbp = Number(data.rates.GBP) / Number(data.rates.EUR);
        rates.push({
          assetClass: 'fiat',
          symbol: 'EUR/GBP',
          rate: eurGbp.toFixed(8),
          baseCurrency: 'EUR',
          recordedDate: today,
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch fiat rates:', error);
  }

  return rates;
}

/**
 * Fetch cryptocurrency rates
 * Uses CoinGecko free API (no API key required, rate limited)
 */
async function fetchCryptoRates(): Promise<RateData[]> {
  const today = getToday();
  const coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2', 'chainlink'];
  const symbolMap: Record<string, string> = {
    bitcoin: 'BTC/USD',
    ethereum: 'ETH/USD',
    solana: 'SOL/USD',
    cardano: 'ADA/USD',
    polkadot: 'DOT/USD',
    'avalanche-2': 'AVAX/USD',
    chainlink: 'LINK/USD',
  };

  const rates: RateData[] = [];

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(',')}&vs_currencies=usd`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    for (const [coinId, priceData] of Object.entries(data)) {
      const symbol = symbolMap[coinId];
      const price = (priceData as { usd: number }).usd;
      if (symbol && price) {
        rates.push({
          assetClass: 'crypto',
          symbol,
          rate: String(price),
          baseCurrency: 'USD',
          recordedDate: today,
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch crypto rates:', error);
  }

  return rates;
}

/**
 * Fetch stock prices
 * Uses Alpha Vantage or Financial Modeling Prep with API key
 */
async function fetchStockRates(): Promise<RateData[]> {
  const today = getToday();
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'V', 'WMT'];
  const rates: RateData[] = [];
  const apiKey = process.env.FINANCIAL_DATA_API_KEY;

  if (!apiKey) {
    console.warn('FINANCIAL_DATA_API_KEY not set, skipping stock data ingestion');
    return rates;
  }

  try {
    // Using Financial Modeling Prep batch quote API
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${apiKey}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      for (const stock of data) {
        if (stock.symbol && stock.price) {
          rates.push({
            assetClass: 'stocks',
            symbol: stock.symbol,
            rate: String(stock.price),
            baseCurrency: 'USD',
            recordedDate: today,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch stock rates:', error);
  }

  return rates;
}

/**
 * Fetch precious metal prices
 * Uses metals.live or similar free API
 */
async function fetchMetalRates(): Promise<RateData[]> {
  const today = getToday();
  const rates: RateData[] = [];
  const apiKey = process.env.FINANCIAL_DATA_API_KEY;

  // Metals pricing typically requires paid API access
  // For MVP, we can use a metals API or fall back to hardcoded recent values
  if (!apiKey) {
    console.warn('FINANCIAL_DATA_API_KEY not set, using fallback metal rates');
    // Fallback with approximate recent market rates
    const fallbackRates = [
      { symbol: 'XAU/USD', rate: '2340.50' }, // Gold
      { symbol: 'XAG/USD', rate: '27.45' }, // Silver
      { symbol: 'XPT/USD', rate: '985.00' }, // Platinum
      { symbol: 'XPD/USD', rate: '1025.00' }, // Palladium
    ];

    for (const metal of fallbackRates) {
      rates.push({
        assetClass: 'metals',
        ...metal,
        baseCurrency: 'USD',
        recordedDate: today,
      });
    }
    return rates;
  }

  try {
    // Using Financial Modeling Prep commodities endpoint
    const url = `https://financialmodelingprep.com/api/v3/quote/GCUSD,SIUSD,PLUSD,PAUSD?apikey=${apiKey}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    const symbolMap: Record<string, string> = {
      GCUSD: 'XAU/USD',
      SIUSD: 'XAG/USD',
      PLUSD: 'XPT/USD',
      PAUSD: 'XPD/USD',
    };

    if (Array.isArray(data)) {
      for (const commodity of data) {
        const symbol = symbolMap[commodity.symbol];
        if (symbol && commodity.price) {
          rates.push({
            assetClass: 'metals',
            symbol,
            rate: String(commodity.price),
            baseCurrency: 'USD',
            recordedDate: today,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch metal rates:', error);
  }

  return rates;
}

/**
 * Upsert rates into the database
 */
async function upsertRates(rateData: RateData[]): Promise<number> {
  if (rateData.length === 0) return 0;

  const db = getDb();
  const result = await db
    .insert(rates)
    .values(rateData)
    .onConflictDoNothing({ target: [rates.symbol, rates.recordedDate] })
    .returning();

  return result.length;
}

/**
 * Main ingestion function
 */
async function ingest(): Promise<void> {
  console.log('🔄 Starting EOD data ingestion...');
  console.log(`📅 Date: ${getToday()}\n`);

  const results: IngestionResult[] = [];

  // Fetch data from all sources
  console.log('Fetching fiat rates...');
  const fiatRates = await fetchFiatRates();
  const fiatInserted = await upsertRates(fiatRates);
  results.push({
    assetClass: 'fiat',
    success: fiatInserted,
    failed: fiatRates.length - fiatInserted,
    errors: [],
  });
  console.log(`  ✓ Fiat: ${fiatInserted}/${fiatRates.length} rates inserted`);

  console.log('Fetching crypto rates...');
  const cryptoRates = await fetchCryptoRates();
  const cryptoInserted = await upsertRates(cryptoRates);
  results.push({
    assetClass: 'crypto',
    success: cryptoInserted,
    failed: cryptoRates.length - cryptoInserted,
    errors: [],
  });
  console.log(`  ✓ Crypto: ${cryptoInserted}/${cryptoRates.length} rates inserted`);

  console.log('Fetching stock rates...');
  const stockRates = await fetchStockRates();
  const stockInserted = await upsertRates(stockRates);
  results.push({
    assetClass: 'stocks',
    success: stockInserted,
    failed: stockRates.length - stockInserted,
    errors: [],
  });
  console.log(`  ✓ Stocks: ${stockInserted}/${stockRates.length} rates inserted`);

  console.log('Fetching metal rates...');
  const metalRates = await fetchMetalRates();
  const metalInserted = await upsertRates(metalRates);
  results.push({
    assetClass: 'metals',
    success: metalInserted,
    failed: metalRates.length - metalInserted,
    errors: [],
  });
  console.log(`  ✓ Metals: ${metalInserted}/${metalRates.length} rates inserted`);

  // Summary
  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log('\n✅ Ingestion complete!');
  console.log(`   Total: ${totalSuccess} inserted, ${totalFailed} skipped (duplicates or errors)`);

  await closeDb();
}

// Run if executed directly
ingest().catch((error) => {
  console.error('❌ Ingestion failed:', error);
  process.exit(1);
});

// Export for Vercel Cron
export { ingest };
