# VaultLine

### The Financial Data Infrastructure Layer for the Embedded Finance Era

> **One API for every financial rate on Earth.**
> Fiat. Crypto. Stocks. Metals. One key. One schema. One bill.

---

## The Problem

Developers building multi-asset financial applications today are trapped in a fragmented hellscape:

- **3–5 separate API subscriptions** (Alpha Vantage, CoinGecko, Fixer.io, Metals-API, Polygon...)
- **3–5 different JSON schemas** to normalize
- **3–5 different rate limit strategies** to handle
- **$150–$500/month** in overlapping subscriptions
- **2–4 weeks** of integration engineering before writing a single line of product code

**VaultLine eliminates the entire integration tax.** One key. One schema. One bill. Ship in hours, not weeks.

---

## What VaultLine Is

VaultLine is not "another financial data API." It is the **abstraction layer** — think **Plaid for market data** or **Twilio for financial rates**. We don't compete with data providers; we sit on top of them and sell the normalization.

### Core Endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/rates` | Unified rate lookup — auto-detects asset class from symbols. BTC→EUR, AAPL→GBP, XAU→JPY — same endpoint, same schema. |
| `GET /v1/convert` | Cross-asset conversion — `?from=BTC&to=XAU&amount=0.5` → "0.5 BTC = 26.83 troy ounces of Gold". No competitor offers this. |
| `POST /v1/batch` | Batch lookup — 25 pairs in one request, counts as 1 API call. |
| `GET /v1/history` | Historical daily EOD data with configurable depth by tier. |
| `POST /v1/alerts` | Webhook alerts — push notifications when rates cross thresholds with HMAC-SHA256 signed payloads. |
| `GET /v1/assets` | Asset directory — search and discover supported symbols. |

### Coverage

| Asset Class | Count | Examples |
|---|---|---|
| Fiat Currencies | 170+ | USD, EUR, GBP, JPY, CAD... |
| Cryptocurrencies | 250+ | BTC, ETH, SOL, ADA, DOT... |
| Equities | 5,000+ | AAPL, GOOGL, MSFT, TSLA... |
| Precious Metals & Commodities | 10+ | XAU, XAG, XPT, WTI Crude... |

**~5,430 base rates → ~29 million pair combinations** via rate triangulation, all served in <100ms.

---

## The Business

### Who Pays (5 Validated Buyer Personas)

| Buyer | Plan | Monthly Spend | TAM |
|---|---|---|---|
| Fintech MVP Builder | Builder ($19/mo) | Replaces $80–$150/mo fragmented stack | ~180K devs |
| SaaS Platform (invoicing, payments) | Scale ($49/mo) | Embeddable widget saves a full sprint | ~45K SaaS products |
| Dev Agency | Enterprise ($149/mo) | One sub shared across all client projects | ~12K agencies |
| Indie Hacker | Sandbox (free) → Builder ($19/mo) | Generous free tier converts on growth | ~500K indie devs |
| Internal Tool Builder | Scale ($49/mo) | One vendor, one PO, ships in 2 days | ~200K companies |

### Market Sizing

| | Value |
|---|---|
| **TAM** | $850M (financial data API market) |
| **SAM** | $120M/year (devs paying $10–$500/mo) |
| **SOM Year 1** | $120K ARR (~400 customers @ $25/mo avg) |
| **SOM Year 3** | $600K ARR (~2,000 customers) |

### Unit Economics

- **Upstream data cost:** ~$180/month (fixed, all providers combined)
- **Break-even:** 4 Scale customers
- **Gross margin at 200 users:** 97%
- **Year 1 revenue:** ~$36K | **Year 1 infra cost:** ~$4K | **Year 1 net:** ~$32K

---

## Pricing

| Tier | Price | Daily Calls | Key Features |
|---|---|---|---|
| **Sandbox** | Free | 1,000 | EOD data, 4 asset classes, 30 days history |
| **Builder** | $19/mo | 10,000 | 15-min data, 1-year history, 5 alerts, conversion engine |
| **Scale** | $49/mo | 100,000 | 5-year history, 50 alerts, widgets, 10 API keys |
| **Enterprise** | $149/mo | Unlimited | SLA, unlimited alerts, SSO, team workspace, white-label |

Hard caps, no overage charges — ever. 20% discount on annual billing.

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Auth | Clerk |
| Billing | Stripe |
| Database | MongoDB Atlas |
| Cache | Upstash Redis (serverless) |
| Job Queue | BullMQ on Railway |
| Edge | Cloudflare Workers |
| Docs | Mintlify |
| Monitoring | BetterStack + Sentry |

### The Three-Layer Cache Shield (99%+ Hit Rate)

```
User Request
    │
    ▼
[Edge Cache — Cloudflare KV]  ──── HIT (85%) ──→  Return (0ms origin)
    │ MISS
    ▼
[Redis Cache — Upstash]  ──── HIT (13%) ──→  Return + hydrate edge
    │ MISS
    ▼
[MongoDB Atlas]  ──── Source of truth ──→  Return + hydrate Redis + edge
```

Data that's 15 minutes old is identical for every user asking the same question. This is the most cacheable API imaginable. 95%+ of requests never touch our origin.

### Data Ingestion Pipeline

| Asset Class | Primary Provider | Fallback | Frequency |
|---|---|---|---|
| Fiat (170+) | Open Exchange Rates ($12/mo) | ExchangeRate.host (free) | Every 15 min |
| Crypto (250+) | CoinGecko Pro ($129/mo) | CoinCap (free) | Every 5 min |
| Equities (5,000+) | Twelve Data ($29/mo) | Alpha Vantage (free) | Every 15 min |
| Metals (10+) | Metals.dev ($9/mo) | Gold-API (free) | Every 15 min |

**Total upstream cost: ~$179/month** — fixed, does not scale with users.

### "Never Fail" Contract

The API always returns 200 with the best available data. If all upstream providers fail, we serve stale data with a `meta.warnings` field. Users never see 500 for data availability reasons.

### Rate Triangulation

Store ~5,430 base rates (everything vs USD). Calculate any pair on-the-fly:

```
Stored:     USD→EUR = 0.94, USD→BTC = 0.00001
Requested:  EUR→BTC
Calculated: (USD→BTC) / (USD→EUR) = 0.00001064
```

Runs in <1ms. No additional API calls. ~29 million possible pairs from ~5,430 stored rates.

---

## Competitive Moat

| Moat | Description |
|---|---|
| **Schema Normalization** | Every response, regardless of asset class, has the same shape. The "Stripe moment" — we win on DX, not data novelty. |
| **Cross-Asset Conversion** | `GET /convert?from=BTC&to=XAU&amount=0.5` — no competitor offers this across asset classes. |
| **Webhook Alerts** | Push > Poll. We eliminate custom polling + cron + comparison logic. |
| **Developer Experience** | Interactive playground, SDKs in 5 languages, generous free tier. |
| **Switching Cost** | Once our SDK is in a codebase, replacing it means rewriting every data call. |

---

## Go-To-Market (4 Phases)

1. **Developer SEO & Content** (Months 1–3) — Own search intent for "free crypto API," "forex API," "stock price API" (87K+ combined monthly searches)
2. **Community & Dev Rel** (Months 2–5) — Open-source SDKs, tutorials, Product Hunt launch, Reddit/Twitter presence
3. **Embed in Workflows** (Months 4–8) — Vercel templates, Retool/Appsmith connectors, Zapier/Make integrations
4. **Partnerships & B2B** (Months 6–12) — Pitch invoicing tools and SaaS platforms as embedded rate provider

---

## Development Roadmap

| Week | Milestone |
|---|---|
| 1–2 | Project setup, auth, database, basic landing page |
| 3–4 | Data ingestion pipeline (all 4 asset classes) |
| 5–6 | Core API endpoints live with rate limiting and caching |
| 7–8 | Developer portal, API key management, usage dashboard |
| 9–10 | Stripe billing integration (4 tiers) |
| 11–12 | Webhook alert system |
| 13–14 | Documentation, SDKs, status page |
| 15–16 | Polish, SEO content, Product Hunt launch |

---

## Running Locally

```bash
# Clone the repository
git clone https://github.com/AHussain101/savi_finance_api.git
cd savi_finance_api

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deploying to Vercel

This project is configured for one-click Vercel deployment:

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Deploy — no environment variables needed for the pitch site

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with fonts and metadata
│   ├── page.tsx          # Main pitch page — assembles all sections
│   └── globals.css       # Tailwind config, animations, custom utilities
├── components/
│   ├── Navbar.tsx         # Sticky navigation with section links
│   ├── Hero.tsx           # Hero section with ticker, stats, CTAs
│   ├── Problem.tsx        # Before/After comparison (fragmented vs unified)
│   ├── ApiDemo.tsx        # Interactive API preview with code examples
│   ├── Buyers.tsx         # 5 buyer personas with TAM and pricing
│   ├── Market.tsx         # TAM/SAM/SOM analysis and revenue projections
│   ├── Competitive.tsx    # Competitor comparison table and moat analysis
│   ├── Pricing.tsx        # 4-tier pricing cards with unit economics
│   ├── Architecture.tsx   # System diagram, tech stack, caching strategy
│   ├── GoToMarket.tsx     # 4-phase GTM strategy and development roadmap
│   ├── Risks.tsx          # Risk matrix, KPIs, and success metrics
│   └── Footer.tsx         # Final CTA and footer links
```

---

## Tech Stack (This Pitch Site)

- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Framer Motion** for animations
- **Geist** font family (Sans + Mono)
- Deployed on **Vercel**

---

## The Thesis

> Developers are paying $29–$199/month *each* to 3–5 separate financial data providers. VaultLine replaces the duct-tape stack with one key, one schema, one bill. We don't compete with data providers — we sit on top of them and sell the normalization.
>
> **This is the Stripe of financial market data.**

---

*VaultLine: Stop juggling. Start shipping.*
