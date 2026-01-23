// Crypto Ingestion Job - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import { fetchCryptoRates, getSupportedCryptos } from "@/lib/providers/coingecko";
import { Rate } from "@/lib/db/models/rate";
import { connectToDatabase } from "@/lib/db/connection";
import { refreshCache } from "@/lib/cache/rate-cache";

export async function ingestCryptoRates(): Promise<void> {
  console.log("[Crypto] Fetching rates from CoinGecko...");

  const symbols = getSupportedCryptos();
  const rates = await fetchCryptoRates(symbols);

  console.log(`[Crypto] Received ${rates.size} crypto rates`);

  await connectToDatabase();

  let updated = 0;

  for (const [symbol, rateData] of rates) {
    await Rate.findOneAndUpdate(
      { type: "crypto", base: "USD", quote: symbol },
      {
        rate: rateData.rate,
        dataDate: rateData.date,
        source: "CoinGecko",
      },
      { upsert: true }
    );

    updated++;
  }

  console.log(`[Crypto] Updated: ${updated}`);

  // Refresh cache
  await refreshCache("crypto");
  console.log("[Crypto] Cache refreshed");
}

// Run if called directly
if (require.main === module) {
  ingestCryptoRates()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
