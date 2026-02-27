# MVP Data Plan — VaultLine (Two-Tier MVP: Sandbox + Standard)

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

**This codebase is currently a marketing pitch site only.** There is no schema, no database, no ORM, no data ingestion logic — all rate/feature details are hardcoded UI strings.

---

## MVP Tiers (Scope)

**Tier 1 — Sandbox ($0/forever)**
- 1,000 API calls/day hard cap
- EOD data (24-hour delayed)
- 4 asset classes (Fiat, Crypto, Stocks, Metals)
- 30 days history exposed via API
- 1 API key per user

**Tier 2 — Standard ($10/month or $96/year)**
- Unlimited API calls
- EOD data (24-hour delayed)
- 4 asset classes
- 90 days history exposed via API
- 2 API keys per user

**Tiers to disable/hide for MVP:** Builder, Scale, Enterprise. The schema must NOT include columns or enum values for their exclusive features (webhooks, conversion engine, widgets, team workspace, SSO, SLA).

---

## Scope & Responsibilities

Data owns the database schema, migrations, seed data, and the ingestion pipeline that populates financial rate data. It does not write HTTP handlers or UI — it defines the shape of stored information and ensures that data is present, fresh, and correct for what the backend will serve.

---

## Concrete Tasks (Numbered Steps)

1. **Select a migration tool and initialize it.**
   - Add `drizzle-orm` + `drizzle-kit` (or `prisma`) to `package.json`. Drizzle is preferred for Next.js 16 edge compatibility and has minimal setup.
   - Create `drizzle.config.ts` (or `prisma/schema.prisma`) at the repo root pointing to `DATABASE_URL`.
   - Initialize migrations directory: `src/db/migrations/`.

2. **Design and write the core schema (five tables for MVP).**

   **`users`**
   ```sql
   id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
   email         text UNIQUE NOT NULL
   password_hash text NOT NULL          -- bcrypt hash
   plan          text NOT NULL DEFAULT 'sandbox'  -- 'sandbox' | 'standard'
   created_at    timestamptz NOT NULL DEFAULT now()
   updated_at    timestamptz NOT NULL DEFAULT now()
   ```

   **`api_keys`**
   ```sql
   id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
   user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
   key_hash    text UNIQUE NOT NULL      -- SHA-256 of the raw key; raw key shown once at creation
   label       text
   is_active   boolean NOT NULL DEFAULT true
   created_at  timestamptz NOT NULL DEFAULT now()
   -- Enforce: Sandbox users max 1 active key, Standard users max 2 active keys
   -- Enforced at application layer (Backend role), not DB constraint
   ```

   **`subscriptions`**
   ```sql
   id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
   user_id               uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
   stripe_customer_id    text UNIQUE
   stripe_subscription_id text UNIQUE
   plan                  text NOT NULL DEFAULT 'sandbox'   -- 'sandbox' | 'standard'
   billing_interval      text                              -- 'month' | 'year' | NULL for sandbox
   status                text NOT NULL DEFAULT 'active'    -- 'active' | 'trialing' | 'past_due' | 'canceled'
   trial_ends_at         timestamptz
   current_period_end    timestamptz
   created_at            timestamptz NOT NULL DEFAULT now()
   updated_at            timestamptz NOT NULL DEFAULT now()
   ```

   **`usage_logs`** (for analytics and rate-limit verification; Redis is source-of-truth for real-time enforcement)
   ```sql
   id          bigserial PRIMARY KEY
   api_key_id  uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE
   user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
   endpoint    text NOT NULL
   called_at   timestamptz NOT NULL DEFAULT now()
   -- Index: (api_key_id, called_at DESC) for daily rollup queries
   ```

   **`rates`** (financial data — EOD only for MVP)
   ```sql
   id           bigserial PRIMARY KEY
   asset_class  text NOT NULL     -- 'fiat' | 'crypto' | 'stocks' | 'metals'
   symbol       text NOT NULL     -- e.g. 'USD/EUR', 'BTC/USD', 'AAPL', 'XAU/USD'
   rate         numeric(20, 8) NOT NULL
   base_currency text NOT NULL    -- e.g. 'USD'
   recorded_date date NOT NULL    -- the EOD date this rate represents
   created_at   timestamptz NOT NULL DEFAULT now()
   UNIQUE (symbol, recorded_date)
   -- Index: (symbol, recorded_date DESC) for history queries
   ```

3. **Write and run initial migration.**
   - Generate migration: `npx drizzle-kit generate` (or `prisma migrate dev --name init`).
   - Review generated SQL for correctness.
   - Apply to the provisioned database (Infrastructure role provides `DATABASE_URL`).

4. **Implement the data ingestion pipeline (EOD rates).**
   - Source: an upstream EOD data provider (e.g., Open Exchange Rates free tier for fiat; CoinGecko free API for crypto; Alpha Vantage or Financial Modeling Prep for stocks/metals). The project README references ~$180/month upstream cost — a paid tier of one of these providers.
   - Write a script at `src/scripts/ingest-eod.ts` that:
     1. Fetches the latest EOD rates for all symbols across 4 asset classes.
     2. Upserts into the `rates` table using `INSERT ... ON CONFLICT (symbol, recorded_date) DO NOTHING`.
     3. Logs success/failure counts.
   - Schedule: run once daily after market close via a cron job. On Vercel, use a Vercel Cron Job (add to `vercel.json`). Alternatively, a GitHub Actions scheduled workflow.

5. **Implement data retention / pruning for MVP.**
   - Sandbox users may query up to 30 days of history; Standard users up to 90 days.
   - The `rates` table should retain at minimum 90 days of data (Standard limit). Rows older than 90 days can be pruned to keep the table small during MVP. Write a pruning script `src/scripts/prune-rates.ts` scheduled weekly.
   - Do NOT retain or expose 1-year, 5-year, or full history data — those are Builder/Scale/Enterprise features.

6. **Write seed data for local development.**
   - Create `src/db/seed.ts` that inserts:
     - Two test users (one Sandbox, one Standard).
     - Sample rate rows for the last 90 days across a handful of symbols (one per asset class).
   - Run with `npx tsx src/db/seed.ts`.

7. **Write typed database client / query helpers.**
   - Create `src/db/client.ts` — exports a singleton Drizzle (or Prisma) client.
   - Create `src/db/queries/` directory with files:
     - `users.ts` — `getUserById`, `getUserByEmail`, `createUser`, `updateUserPlan`
     - `api-keys.ts` — `createApiKey`, `getActiveKeysByUser`, `deactivateApiKey`, `getKeyCountByUser`
     - `subscriptions.ts` — `getSubscriptionByUser`, `upsertSubscription`
     - `rates.ts` — `getRates(symbol, fromDate, toDate)`, `getSymbolsByAssetClass(assetClass)`
     - `usage.ts` — `logUsage(apiKeyId, userId, endpoint)`

---

## Acceptance Criteria ("Done means…")

- All five tables exist in the production database and migrations apply cleanly from zero.
- `src/db/seed.ts` runs without error and produces queryable rows.
- A query for a symbol's rates with `fromDate = 90 days ago` returns data.
- A query for a symbol's rates with `fromDate = 31 days ago` returns data for a Sandbox user (enforced at backend, but data exists).
- No `rates` rows older than 90 days exist in the MVP database (pruning verified).
- The EOD ingestion script runs successfully against the upstream provider and upserts at least one new row per asset class per day.
- `rates` table contains data for at least one symbol per asset class (fiat, crypto, stocks, metals).
- All query helpers are TypeScript-typed with no `any` types at the call boundary.

---

## Dependencies on Other Roles

| Depends on | What is needed |
|---|---|
| Infrastructure | `DATABASE_URL` to run migrations; Vercel Cron or GitHub Actions schedule to run ingestion script; `FINANCIAL_DATA_API_KEY` env var for upstream provider |
| Backend | Must consume query helpers from `src/db/queries/` — coordinate on function signatures before Backend starts building routes |

---

## Integration Steps

1. Data runs migrations against the Infrastructure-provisioned database.
2. Data exports typed query helpers from `src/db/queries/` → Backend imports them directly; no raw SQL in route handlers.
3. Data documents the `rates` table schema so Backend knows the exact column names and types when building query endpoints.
4. Data provides seed script so Backend and UI can run a local dev environment without needing live upstream data.
5. Ingestion script is scheduled on Infrastructure's cron (Vercel or GitHub Actions); Data supplies the cron expression and script entrypoint.

---

## Files / Modules Likely Touched

| File | Action |
|---|---|
| `package.json` | Edit — add `drizzle-orm`, `drizzle-kit`, `pg` (or `@prisma/client`, `prisma`), `tsx` |
| `drizzle.config.ts` | Create — Drizzle migration config pointing to `DATABASE_URL` |
| `src/db/client.ts` | Create — singleton Drizzle/Prisma client |
| `src/db/schema.ts` | Create — table definitions (users, api_keys, subscriptions, usage_logs, rates) |
| `src/db/migrations/` | Create — auto-generated SQL migration files |
| `src/db/seed.ts` | Create — development seed data |
| `src/db/queries/users.ts` | Create — user query helpers |
| `src/db/queries/api-keys.ts` | Create — API key query helpers |
| `src/db/queries/subscriptions.ts` | Create — subscription query helpers |
| `src/db/queries/rates.ts` | Create — rate/history query helpers |
| `src/db/queries/usage.ts` | Create — usage log insert helper |
| `src/scripts/ingest-eod.ts` | Create — daily EOD ingestion script |
| `src/scripts/prune-rates.ts` | Create — weekly data pruning script |
| `vercel.json` | Create or edit — add cron job configuration for ingestion |
