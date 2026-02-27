/**
 * Seed script for VaultLine MVP
 *
 * Creates test data for local development:
 * - Two test users (Sandbox and Standard)
 * - Sample API keys for each user
 * - Sample rate data for 90 days across all asset classes
 *
 * Run with: npm run db:seed
 */

import { hash } from 'bcryptjs';
import { getDb, closeDb } from './client';
import { users, apiKeys, subscriptions, rates } from './schema';
import { createHash } from 'crypto';

// Sample symbols for each asset class
const SYMBOLS = {
  fiat: [
    { symbol: 'USD/EUR', baseCurrency: 'USD' },
    { symbol: 'USD/GBP', baseCurrency: 'USD' },
    { symbol: 'USD/JPY', baseCurrency: 'USD' },
    { symbol: 'EUR/GBP', baseCurrency: 'EUR' },
  ],
  crypto: [
    { symbol: 'BTC/USD', baseCurrency: 'USD' },
    { symbol: 'ETH/USD', baseCurrency: 'USD' },
    { symbol: 'SOL/USD', baseCurrency: 'USD' },
  ],
  stocks: [
    { symbol: 'AAPL', baseCurrency: 'USD' },
    { symbol: 'GOOGL', baseCurrency: 'USD' },
    { symbol: 'MSFT', baseCurrency: 'USD' },
    { symbol: 'AMZN', baseCurrency: 'USD' },
  ],
  metals: [
    { symbol: 'XAU/USD', baseCurrency: 'USD' }, // Gold
    { symbol: 'XAG/USD', baseCurrency: 'USD' }, // Silver
    { symbol: 'XPT/USD', baseCurrency: 'USD' }, // Platinum
  ],
};

// Base rates for each symbol (used to generate realistic variations)
const BASE_RATES: Record<string, number> = {
  'USD/EUR': 0.92,
  'USD/GBP': 0.79,
  'USD/JPY': 149.5,
  'EUR/GBP': 0.86,
  'BTC/USD': 67500,
  'ETH/USD': 3450,
  'SOL/USD': 145,
  'AAPL': 178.5,
  'GOOGL': 141.2,
  'MSFT': 415.8,
  'AMZN': 178.9,
  'XAU/USD': 2340,
  'XAG/USD': 27.5,
  'XPT/USD': 985,
};

/**
 * Generate a random variation of a base rate (within +/- 5%)
 */
function generateRate(baseRate: number): string {
  const variation = (Math.random() - 0.5) * 0.1; // +/- 5%
  return (baseRate * (1 + variation)).toFixed(8);
}

/**
 * Generate date string in YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate SHA-256 hash of an API key for storage
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function seed() {
  console.log('🌱 Starting seed...\n');
  const db = getDb();

  // Clear existing data
  console.log('Clearing existing data...');
  await db.delete(rates);
  await db.delete(apiKeys);
  await db.delete(subscriptions);
  await db.delete(users);

  // Create test users
  console.log('Creating test users...');
  const sandboxPasswordHash = await hash('sandbox123', 10);
  const standardPasswordHash = await hash('standard123', 10);

  const [sandboxUser] = await db
    .insert(users)
    .values({
      email: 'sandbox@test.vaultline.io',
      passwordHash: sandboxPasswordHash,
      plan: 'sandbox',
    })
    .returning();

  const [standardUser] = await db
    .insert(users)
    .values({
      email: 'standard@test.vaultline.io',
      passwordHash: standardPasswordHash,
      plan: 'standard',
    })
    .returning();

  console.log(`  ✓ Created sandbox user: ${sandboxUser.email}`);
  console.log(`  ✓ Created standard user: ${standardUser.email}`);

  // Create subscriptions
  console.log('\nCreating subscriptions...');
  await db.insert(subscriptions).values([
    {
      userId: sandboxUser.id,
      plan: 'sandbox',
      status: 'active',
    },
    {
      userId: standardUser.id,
      plan: 'standard',
      billingInterval: 'month',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  ]);
  console.log('  ✓ Created subscriptions');

  // Create API keys
  console.log('\nCreating API keys...');
  const sandboxKey = 'vl_sandbox_test_key_12345';
  const standardKey1 = 'vl_standard_test_key_1_abcde';
  const standardKey2 = 'vl_standard_test_key_2_fghij';

  await db.insert(apiKeys).values([
    {
      userId: sandboxUser.id,
      keyHash: hashApiKey(sandboxKey),
      label: 'Development Key',
    },
    {
      userId: standardUser.id,
      keyHash: hashApiKey(standardKey1),
      label: 'Production Key',
    },
    {
      userId: standardUser.id,
      keyHash: hashApiKey(standardKey2),
      label: 'Staging Key',
    },
  ]);

  console.log('  ✓ Created API keys');
  console.log(`    Sandbox key: ${sandboxKey}`);
  console.log(`    Standard key 1: ${standardKey1}`);
  console.log(`    Standard key 2: ${standardKey2}`);

  // Generate rate data for the last 90 days
  console.log('\nGenerating rate data for last 90 days...');
  const today = new Date();
  const rateData: Array<{
    assetClass: 'fiat' | 'crypto' | 'stocks' | 'metals';
    symbol: string;
    rate: string;
    baseCurrency: string;
    recordedDate: string;
  }> = [];

  for (const [assetClass, symbols] of Object.entries(SYMBOLS)) {
    for (const { symbol, baseCurrency } of symbols) {
      const baseRate = BASE_RATES[symbol] || 1;

      for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        // Skip weekends for stocks (markets closed)
        if (assetClass === 'stocks' && (date.getDay() === 0 || date.getDay() === 6)) {
          continue;
        }

        rateData.push({
          assetClass: assetClass as 'fiat' | 'crypto' | 'stocks' | 'metals',
          symbol,
          rate: generateRate(baseRate),
          baseCurrency,
          recordedDate: formatDate(date),
        });
      }
    }
  }

  // Batch insert rates
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < rateData.length; i += batchSize) {
    const batch = rateData.slice(i, i + batchSize);
    await db.insert(rates).values(batch);
    inserted += batch.length;
  }

  console.log(`  ✓ Inserted ${inserted} rate records`);

  // Summary
  console.log('\n✅ Seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  Sandbox user:');
  console.log('    Email: sandbox@test.vaultline.io');
  console.log('    Password: sandbox123');
  console.log(`    API Key: ${sandboxKey}`);
  console.log('  Standard user:');
  console.log('    Email: standard@test.vaultline.io');
  console.log('    Password: standard123');
  console.log(`    API Key 1: ${standardKey1}`);
  console.log(`    API Key 2: ${standardKey2}`);

  await closeDb();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
