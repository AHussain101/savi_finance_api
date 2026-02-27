# MVP Infrastructure Plan — VaultLine (Two-Tier MVP: Sandbox + Standard)

---

## Repo Pricing Summary (Current State)

`src/components/Pricing.tsx` defines **five tiers** in the `plans` array (lines 5–96):

| Tier | Price | Calls/Day | Data Delay | History |
|---|---|---|---|---|
| Sandbox | $0 | 1,000 | EOD 24hr | 30 days |
| Standard | $10/mo | Unlimited | EOD 24hr | 90 days |
| Builder | $19/mo | 10,000 | 15-min | 1 year |
| Scale | $49/mo | 100,000 | 15-min | 5 years |
| Enterprise | $149/mo | Unlimited | Full/real-time | Full |

**This codebase is currently a marketing pitch site only.** There is no backend, no database, no API routes, no auth, and no billing integration — all pricing is hardcoded UI copy.

---

## MVP Tiers (Scope)

**Tier 1 — Sandbox ($0/forever)**
- 1,000 API calls/day (hard cap)
- EOD data (24-hour delayed)
- 4 asset classes (Fiat, Crypto, Stocks, Metals)
- 30 days history
- 1 API key
- Community support only
- No credit card required

**Tier 2 — Standard ($10/month or $96/year)**
- Unlimited API calls
- EOD data (24-hour delayed)
- 4 asset classes
- 90 days history
- 2 API keys
- Email support
- 7-day free trial

**Tiers to disable/hide for MVP:** Builder, Scale, Enterprise. These must be removed from the `plans` array in `src/components/Pricing.tsx` or conditionally hidden via a feature flag. Do not build any enforcement logic for their feature sets.

---

## Scope & Responsibilities

Infrastructure owns the compute, network, secrets, and CI/CD layer. It does not write product logic — it defines the surface area on which data, backend, and UI run. For this MVP the stack is already partially decided by the existing Next.js 16/React 19/Tailwind 4 project; infrastructure extends it with the minimum hosting and service glue required to ship a working two-tier product.

---

## Concrete Tasks (Numbered Steps)

1. **Choose and configure a hosting provider for the Next.js app.**
   - Vercel is the lowest-friction choice for Next.js 16 with edge runtime support; connect the GitHub repo, set the production branch, configure automatic preview deployments per PR.
   - If Vercel is not available, configure a VPS (e.g., fly.io or Railway) with `npm run build && npm run start` as the start command.

2. **Set up a managed PostgreSQL database.**
   - Provision a Postgres instance (Supabase free tier, Railway Postgres, or Neon — all have generous free tiers compatible with the MVP budget).
   - Record the `DATABASE_URL` connection string as a secret; do not commit it to the repo.
   - The database will hold: `users`, `api_keys`, `subscriptions`, and `usage_logs` tables (schema owned by the Data role).

3. **Provision a Redis instance for rate-limit counters.**
   - Sandbox tier requires hard-capping at 1,000 calls/day per API key. Use Redis (Upstash free tier is zero-cost and has a Vercel integration) to maintain rolling 24-hour call counters keyed by API key.
   - Standard tier is "Unlimited" — counters still need to be written for future analytics, but no enforcement threshold.

4. **Configure Stripe account and products.**
   - Create one Stripe Product: "VaultLine Standard Plan".
   - Create two Stripe Prices under that product: monthly ($10) and annual ($96).
   - Record `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and both price IDs as environment secrets.
   - Register a Stripe webhook endpoint pointing at `POST /api/webhooks/stripe` (to be implemented by Backend role).

5. **Configure environment variables across all environments.**
   - Required env vars for MVP:
     ```
     DATABASE_URL
     REDIS_URL
     STRIPE_SECRET_KEY
     STRIPE_PUBLISHABLE_KEY
     STRIPE_WEBHOOK_SECRET
     STRIPE_PRICE_MONTHLY_STANDARD
     STRIPE_PRICE_ANNUAL_STANDARD
     NEXTAUTH_SECRET          # or equivalent JWT secret
     NEXTAUTH_URL             # canonical app URL
     FINANCIAL_DATA_API_KEY  # upstream EOD data provider key
     ```
   - Add all vars to Vercel project settings (production + preview). Never commit to `.env` in the repo; add `.env.local` to `.gitignore`.

6. **Set up CI/CD pipeline.**
   - Add a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every PR: `npm ci`, `npm run lint`, `npm run build`. Merge only when green.
   - Vercel handles deployment automatically on merge to main; no extra deploy step needed.

7. **Configure a custom domain (optional for MVP, recommended).**
   - Point DNS A/CNAME records to Vercel. Enable automatic HTTPS via Vercel's Let's Encrypt integration.

8. **Set up error monitoring.**
   - Add Sentry (free tier) to the Next.js app for both client and server-side error capture. Set `SENTRY_DSN` as an env var. This is the minimum visibility needed to debug production issues post-launch.

9. **Set up uptime monitoring.**
   - Configure a free Uptime Robot check on the production URL and on `GET /api/health` (to be implemented by Backend). Alert to email or Slack on downtime.

---

## Acceptance Criteria ("Done means…")

- `npm run build` succeeds with zero errors in CI on every PR.
- Production Next.js app is accessible at a stable public URL with valid HTTPS.
- PostgreSQL database is reachable from the Next.js server at runtime (verified by running a migration successfully).
- Redis is reachable from the Next.js server at runtime (verified by a ping in the health endpoint).
- Stripe webhook endpoint is registered and returns 200 to Stripe's test delivery.
- All required env vars are present in the production environment and the app starts without throwing missing-env errors.
- A test API call from the Sandbox tier is rate-limited at 1,001 calls and returns 429; call #1,000 returns 200.
- GitHub Actions CI is green on the main branch.

---

## Dependencies on Other Roles

| Depends on | What is needed |
|---|---|
| Data | Table schema and migration scripts before database can be provisioned and tested |
| Backend | `/api/health` route to wire into uptime monitoring; `/api/webhooks/stripe` URL to register with Stripe |
| UI | Final production domain must be set as `NEXTAUTH_URL` and whitelisted in Stripe's allowed redirect URLs |

---

## Integration Steps

1. Infrastructure provisions the database → shares `DATABASE_URL` with Data role to run migrations.
2. Infrastructure provisions Redis → shares `REDIS_URL` with Backend role to implement rate-limit middleware.
3. Infrastructure creates Stripe products → shares price IDs with Backend role for checkout session creation.
4. Infrastructure merges `.github/workflows/ci.yml` → CI gates all future Backend and UI PRs.
5. Infrastructure sets `NEXTAUTH_URL` to the production domain after UI confirms the canonical URL.

---

## Files / Modules Likely Touched

| File | Action |
|---|---|
| `.github/workflows/ci.yml` | Create — GitHub Actions CI workflow |
| `.env.example` | Create — document required env vars (no real values) |
| `.gitignore` | Edit — ensure `.env.local` and `.env` are ignored |
| `next.config.ts` | Edit — add any required env var exposure to the client (`env` or `publicRuntimeConfig`), configure Sentry DSN |
| `package.json` | Edit — add `@sentry/nextjs`, possibly `@vercel/postgres` or `pg` driver, `ioredis` or `@upstash/redis` |
| `src/instrumentation.ts` | Create — Sentry server-side instrumentation (Next.js 16 convention) |
| `sentry.client.config.ts` | Create — Sentry client-side config |
