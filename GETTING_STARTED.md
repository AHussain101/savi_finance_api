# Getting Started Guide

Welcome to the FinFlux API project! This guide will help you set up your development environment and start contributing.

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd savi_finance_api
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

Then fill in your API keys (see "Required API Keys" below).

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the app.

---

## Team Assignments

| Team Member | Role | Your Guide | Primary Directory |
|-------------|------|------------|-------------------|
| **Victoria** | Frontend | [docs/VICTORIA_FRONTEND.md](docs/VICTORIA_FRONTEND.md) | `src/app/`, `src/components/` |
| **Sean** | Data | [docs/SEAN_DATA.md](docs/SEAN_DATA.md) | `src/lib/db/`, `src/lib/providers/`, `src/jobs/` |
| **Matthew** | Infrastructure | [docs/MATTHEW_INFRA.md](docs/MATTHEW_INFRA.md) | `src/lib/auth/`, `src/lib/billing/`, `src/middleware.ts` |
| **Aarfan** | Backend | [docs/AARFAN_BACKEND.md](docs/AARFAN_BACKEND.md) | `src/app/api/`, `src/lib/cache/`, `src/lib/api/` |

**Read your guide first!** It contains detailed instructions for your responsibilities.

---

## Required API Keys

Everyone needs to set up these services. Share the keys in a secure channel.

### Core Services (Matthew will set these up)

| Service | Environment Variable | Sign Up |
|---------|---------------------|---------|
| Clerk | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | https://clerk.com |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` | https://stripe.com |
| MongoDB | `MONGODB_URI` | https://mongodb.com/atlas |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | https://upstash.com |

### Data Providers (Sean will set these up)

| Service | Environment Variable | Sign Up |
|---------|---------------------|---------|
| AlphaVantage | `ALPHAVANTAGE_API_KEY` | https://www.alphavantage.co/support/#api-key |
| CoinGecko | `COINGECKO_API_KEY` | https://www.coingecko.com/en/api |
| OpenExchangeRates | `OPENEXCHANGE_APP_ID` | https://openexchangerates.org/signup |
| Metals-API | `METALS_API_KEY` | https://metals-api.com |

---

## Git Workflow

### Branch Naming

```
feature/victoria/landing-page
feature/sean/fiat-ingestion
feature/matthew/clerk-setup
feature/aarfan/fiat-endpoint
bugfix/victoria/dashboard-layout
```

### Commit Messages

```
feat(frontend): add landing page hero section
feat(data): implement fiat rate ingestion
feat(infra): set up Clerk authentication
feat(api): add fiat rates endpoint
fix(frontend): correct dashboard layout spacing
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes in your assigned directories
3. Test locally
4. Push and create a PR
5. Request review from another team member
6. Merge after approval

---

## Using Claude Code

Everyone on this team is using Claude Code. Here are some useful commands:

```bash
# Get Claude to help with your task
claude "help me implement the landing page hero section"

# Ask Claude to explain code
claude "explain how the rate caching works in src/lib/cache/rate-cache.ts"

# Ask Claude to fix an error
claude "I'm getting this error: [paste error] - help me fix it"

# Run commands
claude "run npm run dev"
```

### Tips for Working with Claude Code

1. **Be specific** - Tell Claude exactly what file you're working on
2. **Share context** - Mention your role and guide if needed
3. **Iterate** - If the first answer isn't right, ask follow-up questions
4. **Read your guide** - Reference your team guide for context

---

## Directory Structure Overview

```
src/
├── app/                    # Next.js App Router (Victoria)
│   ├── page.tsx            # Landing page
│   ├── (auth)/             # Auth pages
│   ├── dashboard/          # Dashboard pages
│   └── api/                # API routes (Aarfan + Matthew)
├── components/             # React components (Victoria)
├── lib/
│   ├── db/                 # MongoDB (Sean)
│   ├── cache/              # Redis (Aarfan)
│   ├── providers/          # 3rd party APIs (Sean)
│   ├── auth/               # Clerk (Matthew)
│   ├── billing/            # Stripe (Matthew)
│   ├── api/                # API utilities (Aarfan)
│   └── registry/           # Asset lists (Sean)
├── jobs/                   # Cron jobs (Sean)
└── types/                  # TypeScript types (Shared)
```

---

## Testing Locally

### Frontend (Victoria)
```bash
npm run dev
# Visit http://localhost:3000
```

### API Endpoints (Aarfan)
```bash
# Test fiat endpoint
curl "http://localhost:3000/api/v1/rates/fiat?from=USD&to=EUR"

# Test with API key (once implemented)
curl -H "x-api-key: sk_live_test123" "http://localhost:3000/api/v1/rates/fiat?from=USD&to=EUR"
```

### Data Ingestion (Sean)
```bash
# Run all jobs
npm run ingest

# Run specific job
npm run ingest:fiat
```

### Webhooks (Matthew)
```bash
# For Clerk webhooks (use ngrok)
ngrok http 3000
# Then set webhook URL in Clerk dashboard

# For Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Common Issues

### "Module not found" errors
```bash
npm install
```

### TypeScript errors
```bash
npm run lint
```

### Environment variable errors
Make sure `.env.local` exists and has all required variables.

### Clerk not working
1. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
2. Check `CLERK_SECRET_KEY` is set
3. Make sure you're on a Clerk-enabled route

### Database connection issues
1. Check `MONGODB_URI` is correct
2. Make sure your IP is whitelisted in MongoDB Atlas

---

## Need Help?

1. **Check your team guide** in `/docs`
2. **Ask Claude Code** for help
3. **Check the README** for API documentation
4. **Ask your teammates** in the team chat

Good luck and happy coding!
