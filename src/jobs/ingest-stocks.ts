// Stocks Ingestion Job - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import { fetchMultipleStocks } from "@/lib/providers/alpha-vantage";
import { getStockTickers } from "@/lib/registry/stocks";
import { Rate } from "@/lib/db/models/rate";
import { connectToDatabase } from "@/lib/db/connection";
import { refreshCache } from "@/lib/cache/rate-cache";

export async function ingestStockPrices(): Promise<void> {
  console.log("[Stocks] Fetching prices from AlphaVantage...");
  console.log("[Stocks] Note: This may take a while due to rate limits");

  const tickers = getStockTickers();
  const prices = await fetchMultipleStocks(tickers);

  console.log(`[Stocks] Received ${prices.size} stock prices`);

  await connectToDatabase();

  let updated = 0;

  for (const [ticker, priceData] of prices) {
    await Rate.findOneAndUpdate(
      { type: "stock", base: "USD", quote: ticker },
      {
        rate: priceData.price,
        dataDate: priceData.date,
        source: "AlphaVantage",
      },
      { upsert: true }
    );

    updated++;
  }

  console.log(`[Stocks] Updated: ${updated}`);

  // Refresh cache
  await refreshCache("stock");
  console.log("[Stocks] Cache refreshed");
}

// Run if called directly
if (require.main === module) {
  ingestStockPrices()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
