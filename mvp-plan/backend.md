# MVP Backend Plan — VaultLine (Two-Tier MVP: Sandbox + Standard)

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

**This codebase is currently a marketing pitch site only.** There are no API routes, no authentication, no billing logic, and no enforcement of any limits. Everything below is net-new.

---

## MVP Tiers (Scope)

**Tier 1 — Sandbox ($0/forever)**
- 1,000 API calls/day hard cap → return HTTP 429 when exceeded
- EOD data only (24-hour delayed)
- History window: 30 days maximum
- 1 API key maximum per user

**Tier 2 — Standard ($10/month or $96/year)**
- No rate-limit enforcement (unlimited calls)
- EOD data only (24-hour delayed)
- History window: 90 days maximum
- 2 API keys maximum per user

**Features NOT to build for MVP (Builder/Scale/Enterprise):**
- Webhook alerts
- Conversion engine
- 15-min or real-time data feeds
- History beyond 90 days
- Embeddable widgets
- Team workspace / SSO
- SLA enforcement
- White-label features

---

## Scope & Responsibilities

Backend owns all Next.js API route handlers (`src/app/api/`), authentication middleware, rate-limit enforcement, Stripe billing integration, and the financial data serving layer. It does not own the database schema (Data role) or the UI (UI role) — it consumes Data's query helpers and exposes typed HTTP endpoints that UI calls.

---

## Concrete Tasks (Numbered Steps)

### Auth

1. **Implement user registration.**
   - Route: `POST /api/auth/register`
   - Body: `{ email, password }`
   - Hash password with `bcrypt` (cost factor 12).
   - Call `createUser` from `src/db/queries/users.ts`.
   - Automatically create a `subscriptions` row with `plan = 'sandbox'`.
   - Automatically generate one API key (see step 5) and return it in the response (shown once).
   - Return: `{ userId, apiKey }` on success; `409` if email already exists.

2. **Implement user login and session issuance.**
   - Route: `POST /api/auth/login`
   - Body: `{ email, password }`
   - Compare password with stored hash.
   - Issue a signed JWT (using `jose` library) stored in an `HttpOnly` cookie: `Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`.
   - JWT payload: `{ sub: userId, plan: 'sandbox'|'standard', iat, exp }`.
   - Return: `{ userId, plan }`.

3. **Implement logout.**
   - Route: `POST /api/auth/logout`
   - Clear the `session` cookie by setting `Max-Age=0`.

4. **Write `requireAuth` middleware.**
   - A helper function `requireAuth(request: Request): Promise<JWTPayload>` that reads the `session` cookie, verifies the JWT, and returns the payload — or throws a 401 response.
   - Used in every protected route handler.

### API Key Management

5. **Implement API key generation.**
   - Route: `POST /api/keys`
   - Protected: requires `requireAuth`.
   - Generate a cryptographically random key: `crypto.randomBytes(32).toString('hex')` prefixed with `vl_` → `vl_<64-char-hex>`.
   - Store a SHA-256 hash of the key in `api_keys.key_hash` (raw key is never stored).
   - Enforce plan limits before inserting: Sandbox → max 1 active key; Standard → max 2 active keys. Return `403` with a clear message if limit is reached.
   - Return the raw key once in the response: `{ id, key, label, createdAt }`.

6. **Implement API key listing.**
   - Route: `GET /api/keys`
   - Protected: requires `requireAuth`.
   - Return active API keys for the authenticated user (without the raw key value, only metadata): `[{ id, label, createdAt, lastFourChars }]`.

7. **Implement API key revocation.**
   - Route: `DELETE /api/keys/:id`
   - Protected: requires `requireAuth`.
   - Set `is_active = false` for the key. Verify the key belongs to the authenticated user before updating.

### Rate Limiting

8. **Implement Redis-backed rate-limit middleware for Sandbox tier.**
   - Write `src/lib/rateLimit.ts`:
     - Key format: `rl:<apiKeyId>:<YYYY-MM-DD>` (resets at midnight UTC).
     - Use Redis `INCR` + `EXPIRE` (set to 86,400 seconds on first increment).
     - If counter > 1,000: return a `429 Too Many Requests` response with headers:
       ```
       X-RateLimit-Limit: 1000
       X-RateLimit-Remaining: 0
       X-RateLimit-Reset: <unix timestamp of next midnight UTC>
       Retry-After: <seconds until midnight UTC>
       ```
     - Standard tier users: increment the counter (for analytics) but never block.
   - This function is called at the top of every `/api/v1/rates/*` handler.

### Financial Data API

9. **Implement API key authentication for data endpoints.**
   - Data endpoints are authenticated via `Authorization: Bearer vl_<key>` header (not session cookie).
   - Write `src/lib/authenticateApiKey.ts`:
     - Extract key from header.
     - SHA-256 hash it, query `api_keys` table for a matching active hash.
     - Resolve the user's plan from `subscriptions`.
     - Return `{ userId, apiKeyId, plan }` or throw 401.

10. **Implement `GET /api/v1/rates`.**
    - Query params: `symbols` (comma-separated, e.g. `BTC/USD,USD/EUR`), `asset_class` (optional filter), `date` (optional, ISO date, defaults to latest).
    - Auth: API key via Bearer token.
    - Rate limit: call `rateLimit(apiKeyId, plan)` from step 8.
    - Call `getRates(symbol, fromDate, toDate)` from `src/db/queries/rates.ts`.
    - Response: `{ symbol, rate, base_currency, asset_class, date, delayed_by: '24h' }`.

11. **Implement `GET /api/v1/rates/history`.**
    - Query params: `symbol` (required), `from` (ISO date), `to` (ISO date, defaults to today).
    - Enforce history window based on plan:
      - Sandbox: clamp `from` to max 30 days ago. If user requests older, return `403` with `{ error: 'History limit for Sandbox is 30 days. Upgrade to Standard for 90 days.' }`.
      - Standard: clamp `from` to max 90 days ago.
      - Builder/Scale/Enterprise windows are NOT implemented — if somehow called with those plans, treat as Standard.
    - Auth + rate limit same as above.
    - Response: `{ symbol, history: [{ date, rate }] }`.

12. **Implement `GET /api/v1/assets`.**
    - Returns the list of available symbols grouped by asset class.
    - No plan-based filtering for MVP (all 4 asset classes are available on both tiers).
    - Cached: add `Cache-Control: public, max-age=3600` header.
    - Auth: API key required.

13. **Implement `GET /api/health`.**
    - Public (no auth).
    - Pings the database and Redis.
    - Returns `{ status: 'ok', db: 'ok', redis: 'ok', timestamp }` or `503` on failure.

### Stripe Billing

14. **Implement Stripe checkout session creation.**
    - Route: `POST /api/billing/checkout`
    - Protected: requires `requireAuth` (session cookie).
    - Body: `{ interval: 'month' | 'year' }`
    - Create a Stripe Checkout Session with:
      - `mode: 'subscription'`
      - `price`: `STRIPE_PRICE_MONTHLY_STANDARD` or `STRIPE_PRICE_ANNUAL_STANDARD` based on `interval`
      - `trial_period_days: 7`
      - `success_url`: `/dashboard?upgraded=true`
      - `cancel_url`: `/pricing`
      - `customer_email`: authenticated user's email (or existing Stripe customer ID if present)
    - Return: `{ checkoutUrl }` — UI redirects the user there.

15. **Implement Stripe webhook handler.**
    - Route: `POST /api/webhooks/stripe`
    - **Public** — called by Stripe, not by the user.
    - Verify the Stripe signature using `STRIPE_WEBHOOK_SECRET`.
    - Handle these events only (ignore all others for MVP):
      - `checkout.session.completed` → call `upsertSubscription` with `plan='standard'`, `status='trialing'` or `'active'`, store `stripe_customer_id` and `stripe_subscription_id`.
      - `customer.subscription.updated` → update subscription status and `current_period_end`.
      - `customer.subscription.deleted` → set `plan='sandbox'`, `status='canceled'` — downgrade the user.
      - `invoice.payment_failed` → set `status='past_due'`.
    - After updating the `subscriptions` row, also call `updateUserPlan` to keep `users.plan` in sync (used in JWT; JWT is re-issued on next login).

16. **Implement current subscription status endpoint.**
    - Route: `GET /api/billing/subscription`
    - Protected: requires `requireAuth`.
    - Returns: `{ plan, status, billingInterval, currentPeriodEnd, trialEndsAt }`.

17. **Implement customer portal redirect.**
    - Route: `POST /api/billing/portal`
    - Protected: requires `requireAuth`.
    - Creates a Stripe Customer Portal session for the user to manage/cancel their subscription.
    - Returns: `{ portalUrl }`.

---

## Acceptance Criteria ("Done means…")

- `POST /api/auth/register` creates a user, subscription (sandbox), and first API key; returns 409 on duplicate email.
- `POST /api/auth/login` returns a valid JWT cookie; `POST /api/auth/logout` clears it.
- A Sandbox user's 1,001st API call in a 24-hour window returns `429` with correct headers; the 1,000th returns `200`.
- A Standard user can make 2,000 calls in a day without being rate-limited.
- `POST /api/keys` returns `403` when a Sandbox user tries to create a second key.
- `GET /api/v1/rates/history?symbol=BTC/USD&from=<31-days-ago>` returns `403` for a Sandbox user.
- `GET /api/v1/rates/history?symbol=BTC/USD&from=<31-days-ago>` returns data for a Standard user.
- Stripe Checkout session is created and the `checkoutUrl` redirects correctly to Stripe.
- `checkout.session.completed` webhook event upgrades the user's plan to `standard` in the database.
- `customer.subscription.deleted` webhook downgrades the user's plan back to `sandbox`.
- `GET /api/health` returns `200` with `status: 'ok'` when all services are up.
- All routes return `401` when auth is missing or invalid; no unprotected data leaks.

---

## Dependencies on Other Roles

| Depends on | What is needed |
|---|---|
| Infrastructure | `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs — all must be set before routes can run |
| Data | Query helpers in `src/db/queries/` must be implemented and typed before route handlers can import them |
| UI | Billing flow requires knowing the `success_url` and `cancel_url` paths used in the dashboard |

---

## Integration Steps

1. Backend imports all query helpers from `src/db/queries/` (provided by Data role) — no raw SQL in route files.
2. Backend exports a typed `ApiResponse<T>` type and error shape that UI consumes consistently.
3. Backend registers the Stripe webhook URL with Infrastructure so Stripe can deliver events.
4. Backend provides the UI with the API contract (method, path, request shape, response shape) for each endpoint before UI starts integration.
5. Backend's `POST /api/billing/checkout` response (`{ checkoutUrl }`) is consumed by UI's upgrade CTA button via `window.location.href = checkoutUrl`.

---

## Files / Modules Likely Touched

| File | Action |
|---|---|
| `src/app/api/auth/register/route.ts` | Create — registration handler |
| `src/app/api/auth/login/route.ts` | Create — login + JWT issuance |
| `src/app/api/auth/logout/route.ts` | Create — cookie clearance |
| `src/app/api/keys/route.ts` | Create — GET (list) + POST (create) |
| `src/app/api/keys/[id]/route.ts` | Create — DELETE (revoke) |
| `src/app/api/v1/rates/route.ts` | Create — spot rates endpoint |
| `src/app/api/v1/rates/history/route.ts` | Create — history endpoint with plan-based window enforcement |
| `src/app/api/v1/assets/route.ts` | Create — available symbols list |
| `src/app/api/billing/checkout/route.ts` | Create — Stripe checkout session |
| `src/app/api/billing/subscription/route.ts` | Create — current plan status |
| `src/app/api/billing/portal/route.ts` | Create — Stripe customer portal |
| `src/app/api/webhooks/stripe/route.ts` | Create — Stripe event handler |
| `src/app/api/health/route.ts` | Create — health check |
| `src/lib/auth.ts` | Create — `requireAuth`, JWT sign/verify helpers |
| `src/lib/authenticateApiKey.ts` | Create — API key lookup + plan resolution |
| `src/lib/rateLimit.ts` | Create — Redis-backed rate-limit middleware |
| `package.json` | Edit — add `jose`, `bcrypt` (or `bcryptjs`), `stripe`, `@upstash/redis` (or `ioredis`) |
