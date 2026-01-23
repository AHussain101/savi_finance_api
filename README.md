# FinFlux API

A "set-and-forget" financial data service providing reliable, delayed (T-1) exchange rates for Fiat, Crypto, NASDAQ stocks, and Precious Metals via a simplified, heavily cached API.

## Features

- **Fiat Exchange Rates** - USD, EUR, GBP, CAD, JPY, and more
- **Crypto Rates** - BTC, ETH, SOL, and popular cryptocurrencies
- **NASDAQ Stock Prices** - AAPL, GOOGL, MSFT, and other tickers
- **Precious Metals** - Gold (XAU), Silver (XAG), Platinum (XPT)
- **99% Cache Hit Rate** - Edge + Redis caching for unlimited API calls
- **Never Fail Policy** - Always returns data, even if sources are down
- **Simple Pricing** - $10/month flat, no rate limits

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Authentication | Clerk |
| Billing | Stripe |
| Backend | Node.js + TypeScript |
| Database | MongoDB |
| Cache | Redis (Upstash) |
| Deployment | Vercel |

## Team & Development Guides

| Team Member | Role | Guide |
|-------------|------|-------|
| Victoria | Frontend | [docs/VICTORIA_FRONTEND.md](docs/VICTORIA_FRONTEND.md) |
| Sean | Data | [docs/SEAN_DATA.md](docs/SEAN_DATA.md) |
| Matthew | Infrastructure | [docs/MATTHEW_INFRA.md](docs/MATTHEW_INFRA.md) |
| Aarfan | Backend | [docs/AARFAN_BACKEND.md](docs/AARFAN_BACKEND.md) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Upstash Redis account
- Clerk account
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/finflux-api.git
cd finflux-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your API keys in .env.local (see Required API Keys below)

# Run development server
npm run dev
```

### Required API Keys

Create accounts and obtain API keys from these services. **All services have FREE tiers for development!**

#### Core Services (All Free for Dev)
| Service | Purpose | Sign Up URL | Free Tier |
|---------|---------|-------------|-----------|
| **Clerk** | Authentication | https://clerk.com | 10k MAU |
| **Stripe** | Billing | https://stripe.com | Test mode free |
| **MongoDB Atlas** | Database | https://mongodb.com/atlas | 512MB free forever |
| **Upstash** | Redis Cache | https://upstash.com | 10k requests/day |

#### Data Providers (All Free for Dev)
| Service | Purpose | Sign Up URL | Free Tier |
|---------|---------|-------------|-----------|
| **AlphaVantage** | NASDAQ stocks | https://www.alphavantage.co/support/#api-key | 25 requests/day |
| **CoinGecko** | Crypto rates | https://www.coingecko.com/en/api | Unlimited (no key needed!) |
| **OpenExchangeRates** | Fiat currencies | https://openexchangerates.org/signup | 1000 requests/month |
| **Metals-API** | Precious metals | https://metals-api.com | 50 requests/month |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# App
NEXT_PUBLIC_URL=http://localhost:3000

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finflux

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Data Providers
ALPHAVANTAGE_API_KEY=...
COINGECKO_API_KEY=...
OPENEXCHANGE_APP_ID=...
METALS_API_KEY=...

# Cron (for Vercel)
CRON_SECRET=...
```

## API Endpoints

Base URL: `https://api.finflux.io/v1`

### Fiat Exchange Rates
```http
GET /rates/fiat?from=USD&to=EUR
x-api-key: sk_live_xxxxx

Response:
{
  "success": true,
  "data": { "from": "USD", "to": "EUR", "rate": 0.94 },
  "meta": { "cached": true, "timestamp": "2024-01-15T00:00:00Z" }
}
```

### Crypto Rates
```http
GET /rates/crypto?symbol=BTC&currency=USD
```

### Stock Prices
```http
GET /rates/stock?ticker=AAPL
```

### Precious Metals
```http
GET /rates/metal?symbol=XAU&currency=USD
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── (auth)/             # Auth pages (Clerk)
│   ├── dashboard/          # Protected dashboard
│   └── api/                # API routes
│       ├── v1/rates/       # Rate endpoints
│       └── webhooks/       # Clerk & Stripe webhooks
├── components/             # React components
├── lib/
│   ├── db/                 # MongoDB models & connection
│   ├── cache/              # Redis caching
│   ├── providers/          # 3rd party API clients
│   ├── auth/               # Clerk utilities
│   ├── billing/            # Stripe utilities
│   └── api/                # API middleware & helpers
├── jobs/                   # Data ingestion cron jobs
└── types/                  # TypeScript definitions
```

## Development Workflow

### Running Locally

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

### Working with Webhooks Locally

```bash
# For Clerk webhooks
ngrok http 3000
# Set webhook URL in Clerk dashboard

# For Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Data Ingestion

```bash
# Run all ingestion jobs manually
npm run ingest

# Run specific job
npm run ingest:fiat
npm run ingest:crypto
npm run ingest:stocks
npm run ingest:metals

# Hydrate cache from database
npm run cache:hydrate
```

## Architecture

### Caching Strategy (99% Hit Rate Target)

1. **Edge Cache (Vercel/Cloudflare)** - 24h TTL for rate responses
2. **Redis Cache (Upstash)** - Application-level caching
3. **MongoDB** - Source of truth, updated daily via cron

### Data Flow

```
User Request
    |
Edge Cache (HIT?) --> Return cached response
    | (MISS)
Redis Cache (HIT?) --> Return cached, update edge
    | (MISS)
MongoDB --> Return data, update Redis & edge
```

### Never Fail Policy

If a 3rd party provider fails:
1. Retry with exponential backoff (1min, 5min, 15min)
2. If all retries fail, keep existing data in DB
3. API always returns 200 with last known good data
4. `meta.timestamp` indicates actual data date

## Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Cron Jobs

Configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/ingest",
    "schedule": "1 0 * * *"
  }]
}
```

## Contributing

1. Read your role-specific guide in `/docs`
2. Create feature branch from `main`
3. Make changes in your assigned directories
4. Submit PR for review

## License

Private - All rights reserved
