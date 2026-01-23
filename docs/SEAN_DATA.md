# Sean's Development Guide - Data

## Role: Data Engineer
**Focus**: Data ingestion, 3rd party API integrations, MongoDB schemas, Asset registry

---

## Your Files & Directories

```
src/
├── lib/
│   ├── db/
│   │   ├── connection.ts           # MongoDB connection singleton
│   │   ├── models/
│   │   │   ├── user.ts             # User model (synced from Clerk)
│   │   │   ├── api-key.ts          # API keys model
│   │   │   ├── rate.ts             # Exchange rates model
│   │   │   └── usage.ts            # API usage tracking
│   │   └── seed/
│   │       └── index.ts            # Initial data seeding
│   ├── providers/                   # 3rd party API clients
│   │   ├── alpha-vantage.ts        # NASDAQ stocks
│   │   ├── coingecko.ts            # Crypto rates
│   │   ├── openexchange.ts         # Fiat currency rates
│   │   └── metals-api.ts           # Precious metals
│   └── registry/                    # Supported assets lists
│       ├── fiat.ts                  # Supported fiat currencies
│       ├── crypto.ts                # Supported cryptocurrencies
│       ├── stocks.ts                # Supported NASDAQ tickers
│       └── metals.ts                # Supported precious metals
├── jobs/                            # Cron jobs for data ingestion
│   ├── ingest-fiat.ts
│   ├── ingest-crypto.ts
│   ├── ingest-stocks.ts
│   ├── ingest-metals.ts
│   └── index.ts                     # Job orchestrator
└── scripts/
    ├── seed-registry.ts             # Populate asset registries
    └── hydrate-cache.ts             # Load DB data into Redis
```

---

## Tasks Checklist

### Phase 1: Database Setup
- [ ] Set up MongoDB connection with retry logic
- [ ] Create User model (id, clerkId, email, stripeCustomerId)
- [ ] Create ApiKey model (id, userId, key, name, createdAt, revokedAt)
- [ ] Create Rate model (type, base, quote, rate, dataDate, updatedAt)
- [ ] Create Usage model (apiKeyId, endpoint, timestamp)

### Phase 2: Asset Registry
- [ ] Define supported fiat currencies (USD, EUR, GBP, CAD, JPY, etc.)
- [ ] Define supported cryptocurrencies (BTC, ETH, SOL, etc.)
- [ ] Define supported NASDAQ tickers (AAPL, GOOGL, MSFT, etc.)
- [ ] Define supported precious metals (XAU, XAG, XPT)
- [ ] Create validation functions for each registry

### Phase 3: Provider Integrations
- [ ] AlphaVantage client for stock prices
- [ ] CoinGecko client for crypto rates
- [ ] OpenExchangeRates client for fiat rates
- [ ] Metals-API client for precious metals
- [ ] Implement retry logic with exponential backoff

### Phase 4: Cron Jobs
- [ ] Create job orchestrator with scheduling
- [ ] Implement fiat ingestion job (daily 00:01 UTC)
- [ ] Implement crypto ingestion job
- [ ] Implement stocks ingestion job
- [ ] Implement metals ingestion job
- [ ] Add error handling (don't overwrite on failure)

### Phase 5: Scripts
- [ ] Seed registry script for initial data
- [ ] Cache hydration script (DB -> Redis on startup)

---

## MongoDB Schema Designs

### Rate Model
```typescript
interface Rate {
  _id: ObjectId;
  type: 'fiat' | 'crypto' | 'stock' | 'metal';
  base: string;      // Base currency (always USD for normalization)
  quote: string;     // Target currency/asset (EUR, BTC, AAPL, XAU)
  rate: number;      // Exchange rate
  dataDate: Date;    // The actual date of the data (T-1)
  updatedAt: Date;   // When we fetched it
  source: string;    // Provider name
}

// Index: { type: 1, base: 1, quote: 1 } - unique
```

### ApiKey Model
```typescript
interface ApiKey {
  _id: ObjectId;
  userId: ObjectId;
  key: string;           // sk_live_xxxxxxxxxxxx (hashed in DB)
  keyPrefix: string;     // sk_live_xxxx (for display)
  name: string;          // User-defined name
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

// Index: { key: 1 } - unique
// Index: { userId: 1 }
```

---

## 3rd Party API Details

### AlphaVantage (Stocks)
```typescript
// Endpoint
GET https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY

// Response
{
  "Global Quote": {
    "05. price": "173.4500",
    "07. latest trading day": "2024-01-15"
  }
}
```

### CoinGecko (Crypto)
```typescript
// Endpoint (free, no API key required for basic)
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd

// Response
{
  "bitcoin": { "usd": 42500.00 },
  "ethereum": { "usd": 2500.00 }
}
```

### OpenExchangeRates (Fiat)
```typescript
// Endpoint
GET https://openexchangerates.org/api/latest.json?app_id=YOUR_KEY&base=USD

// Response
{
  "base": "USD",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.35
  }
}
```

### Metals-API (Precious Metals)
```typescript
// Endpoint
GET https://metals-api.com/api/latest?access_key=YOUR_KEY&base=USD&symbols=XAU,XAG,XPT

// Response
{
  "base": "USD",
  "rates": {
    "XAU": 0.0005,  // Note: inverted (1/price)
    "XAG": 0.04
  }
}
```

---

## Environment Variables You Need

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finflux

# 3rd Party Providers
ALPHAVANTAGE_API_KEY=your_key
COINGECKO_API_KEY=your_key        # Optional for free tier
OPENEXCHANGE_APP_ID=your_app_id
METALS_API_KEY=your_key
```

---

## The "Never Fail" Policy

**Critical**: Your data ingestion must follow these rules:

1. **On Success**: Update MongoDB -> Notify Aarfan's cache to refresh
2. **On Failure**:
   - Log the error
   - DO NOT overwrite existing data with empty/null values
   - Trigger alert (coordinate with Matthew for alerting)
3. **Retry Logic**: 3 attempts with exponential backoff (1min, 5min, 15min)

```typescript
// Example retry implementation
async function fetchWithRetry(fn: () => Promise<any>, retries = 3) {
  const delays = [60000, 300000, 900000]; // 1min, 5min, 15min

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delays[i]);
    }
  }
}
```

---

## Coordination Notes

### With Aarfan (Backend)
- Your Rate model is consumed by his API endpoints
- After successful ingestion, call his cache refresh function
- Coordinate on the rate data format

### With Matthew (Infrastructure)
- User model syncs from his Clerk webhook
- Coordinate on error alerting mechanism
- He'll set up the cron job scheduling infrastructure

### With Victoria (Frontend)
- No direct dependencies, but she'll display data freshness in the UI

---

## Quick Start

```bash
# Test MongoDB connection
npm run db:test

# Run seed script
npm run seed:registry

# Test a single provider
npm run test:provider -- --provider=coingecko

# Run ingestion manually
npm run ingest -- --type=all
```

---

## Testing Your Work

1. MongoDB connection succeeds
2. All provider clients can fetch data
3. Data is correctly transformed and stored
4. Retry logic works (mock failures)
5. Registry validation catches invalid symbols
6. Cache hydration populates Redis correctly (with Aarfan)
