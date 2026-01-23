// Job Orchestrator - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

import { ingestFiatRates } from "./ingest-fiat";
import { ingestCryptoRates } from "./ingest-crypto";
import { ingestStockPrices } from "./ingest-stocks";
import { ingestMetalRates } from "./ingest-metals";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry(
  jobName: string,
  job: () => Promise<void>,
  retries = 3
): Promise<boolean> {
  const delays = [60000, 300000, 900000]; // 1min, 5min, 15min

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[${jobName}] Starting attempt ${i + 1}/${retries}`);
      await job();
      console.log(`[${jobName}] Completed successfully`);
      return true;
    } catch (error) {
      console.error(`[${jobName}] Attempt ${i + 1} failed:`, error);

      if (i < retries - 1) {
        console.log(`[${jobName}] Retrying in ${delays[i] / 1000} seconds...`);
        await sleep(delays[i]);
      }
    }
  }

  console.error(`[${jobName}] All ${retries} attempts failed!`);
  // TODO: Trigger alert (coordinate with Matthew)
  return false;
}

export async function runAllJobs(): Promise<void> {
  console.log("=== Starting data ingestion ===");
  console.log(`Time: ${new Date().toISOString()}`);

  const results = await Promise.all([
    runWithRetry("Fiat", ingestFiatRates),
    runWithRetry("Crypto", ingestCryptoRates),
    runWithRetry("Stocks", ingestStockPrices),
    runWithRetry("Metals", ingestMetalRates),
  ]);

  const allSuccess = results.every(Boolean);

  if (allSuccess) {
    console.log("=== All jobs completed successfully ===");
  } else {
    console.error("=== Some jobs failed! Check logs above ===");
    // TODO: Send alert notification
  }
}

// Run if called directly
if (require.main === module) {
  runAllJobs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
