// Metals Ingestion Job - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import { fetchMetalRates, SUPPORTED_METALS } from "@/lib/providers/metals-api";
import { Rate } from "@/lib/db/models/rate";
import { connectToDatabase } from "@/lib/db/connection";
import { refreshCache } from "@/lib/cache/rate-cache";

export async function ingestMetalRates(): Promise<void> {
  console.log("[Metals] Fetching rates from Metals-API...");

  const rates = await fetchMetalRates();

  console.log(`[Metals] Received ${rates.size} metal rates`);

  await connectToDatabase();

  let updated = 0;

  for (const symbol of SUPPORTED_METALS) {
    const rateData = rates.get(symbol);

    if (!rateData) {
      console.warn(`[Metals] No rate data for ${symbol}, skipping`);
      continue;
    }

    await Rate.findOneAndUpdate(
      { type: "metal", base: "USD", quote: symbol },
      {
        rate: rateData.rate,
        dataDate: rateData.date,
        source: "Metals-API",
      },
      { upsert: true }
    );

    updated++;
  }

  console.log(`[Metals] Updated: ${updated}`);

  // Refresh cache
  await refreshCache("metal");
  console.log("[Metals] Cache refreshed");
}

// Run if called directly
if (require.main === module) {
  ingestMetalRates()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
