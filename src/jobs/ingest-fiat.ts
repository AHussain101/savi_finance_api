// Fiat Ingestion Job - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import { fetchFiatRates, SUPPORTED_FIAT } from "@/lib/providers/openexchange";
import { Rate } from "@/lib/db/models/rate";
import { connectToDatabase } from "@/lib/db/connection";
import { refreshCache } from "@/lib/cache/rate-cache";

export async function ingestFiatRates(): Promise<void> {
  console.log("[Fiat] Fetching rates from OpenExchangeRates...");

  const rates = await fetchFiatRates();

  console.log(`[Fiat] Received ${rates.size} currency rates`);

  await connectToDatabase();

  let updated = 0;
  let skipped = 0;

  for (const currency of SUPPORTED_FIAT) {
    if (currency === "USD") continue; // Skip base currency

    const rateData = rates.get(currency);

    if (!rateData) {
      console.warn(`[Fiat] No rate data for ${currency}, skipping`);
      skipped++;
      continue;
    }

    await Rate.findOneAndUpdate(
      { type: "fiat", base: "USD", quote: currency },
      {
        rate: rateData.rate,
        dataDate: rateData.date,
        source: "OpenExchangeRates",
      },
      { upsert: true }
    );

    updated++;
  }

  console.log(`[Fiat] Updated: ${updated}, Skipped: ${skipped}`);

  // Refresh cache
  await refreshCache("fiat");
  console.log("[Fiat] Cache refreshed");
}

// Run if called directly
if (require.main === module) {
  ingestFiatRates()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
