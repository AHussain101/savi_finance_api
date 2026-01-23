# Product Requirement Document (PRD) - FinFlux API

## 1. Executive Summary

FinFlux API is a "set-and-forget" financial data service designed for developers who need reliable, albeit delayed, financial data without the complexity of rate limits or the high cost of real-time feeds. We provide 1-day old (EOD) exchange rates for Fiat, Crypto, NASDAQ stocks, and Precious Metals via a simplified, heavily cached API. The service is subscription-based ($10/month flat) with a focus on 100% data availability to the end-user.

## 2. Product Scope

### 2.1 In Scope

- **Public API:** RESTful endpoints for retrieving exchange rates for Fiat, Crypto, Stocks, and Precious Metals.
- **Data Latency:** All data is strictly T-1 (1 day old / End of Day).
- **Monetization:** Flat monthly subscription via Stripe.
- **Authentication:** User management via Clerk.
- **Developer Portal:** API key generation and usage analytics.
- **Resiliency:** "Always-on" data response (fallback to stale data on 3rd party failure).

### 2.2 Out of Scope

- Real-time or intra-day data.
- **Server-side Conversion Calculations:** The API provides rates only; users must perform the multiplication (Amount \* Rate) on their side.
- Historical data queries (beyond the "latest available" snapshot).
- Complex trading indicators or charting data.
- Tiered pricing (only one plan exists).

## 3. Functional Requirements

### 3.1 Authentication & User Management

| ID        | Requirement        | Description                                                                                       | Priority |
| :-------- | :----------------- | :------------------------------------------------------------------------------------------------ | :------- |
| **FR-01** | Sign Up / Login    | Users must be able to sign up and login using Clerk. Support for Email/Password and Google OAuth. | P0       |
| **FR-02** | Profile Management | Users can manage their email and password via Clerk's pre-built components.                       | P1       |

### 3.2 Subscription & Billing

| ID        | Requirement        | Description                                                                          | Priority |
| :-------- | :----------------- | :----------------------------------------------------------------------------------- | :------- |
| **FR-03** | Stripe Integration | Integrate Stripe Checkout for a recurring subscription product ($10/month).          | P0       |
| **FR-04** | Access Gating      | API keys are only active if the Stripe subscription status is active.                | P0       |
| **FR-05** | Customer Portal    | Users can cancel subscriptions or update payment methods via Stripe Customer Portal. | P1       |

### 3.3 Core API Capabilities

| ID        | Requirement           | Description                                                                                                                             | Priority |
| :-------- | :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **FR-06** | Fiat Exchange Rates   | Endpoint to get the exchange rate between Currency A and Currency B (e.g., $1 USD = 0.94 EUR$). No conversion calculation is performed. | P0       |
| **FR-07** | Crypto Exchange Rates | Endpoint to get the exchange rate between Crypto and Fiat (e.g., $1 BTC = 34,000 USD$).                                                 | P0       |
| **FR-08** | Stock Price           | Endpoint to get the closing price of NASDAQ tickers in USD (e.g., $AAPL = 170.50$).                                                     | P0       |
| **FR-09** | Precious Metal Rates  | Endpoint to get the exchange rate between Precious Metals (Gold, Silver, Platinum) and Fiat.                                            | P0       |
| **FR-10** | Error Suppression     | If the 3rd party provider fails, the API must return the last known good data stored in our DB/Cache, not an error.                     | P0       |

### 3.4 Developer Portal

| ID        | Requirement     | Description                                                           | Priority |
| :-------- | :-------------- | :-------------------------------------------------------------------- | :------- |
| **FR-11** | Key Management  | Users can generate, view, and revoke API keys (Secret Keys).          | P0       |
| **FR-12** | Usage Analytics | Dashboard showing total API calls made in the current billing period. | P1       |

## 4. Technical Requirements & Architecture

### 4.1 Caching Strategy (The "99% Hit Rate" Mandate)

To achieve unlimited API calls on a $10 plan, the architecture must be aggressive with caching to minimize database and 3rd-party costs.

1.  **Edge Caching (CDN Level):**
    - Utilize Cloudflare Workers or Vercel Edge Middleware.
    - API responses for specific query pairs (e.g., BTC-USD) are cached at the edge with a TTL of 24 hours (since data is 1-day old).
    - This serves requests closest to the user without hitting our backend.
2.  **Application Caching (Redis/Memcached):**
    - If Edge cache misses, the backend checks a Redis instance.
    - Redis stores the JSON payload for every supported ticker/pair.
3.  **Database Read Caching:**
    - **Write-Through Strategy:** We only write to the primary DB (MongoDB) once per day via a cron job that fetches 3rd party data.
    - **Read Strategy:** The API layer should rarely hit MongoDB directly. On startup, the application should hydrate the Redis cache from MongoDB.

### 4.2 Data Ingestion & Error Handling logic

**The "Never Fail" Policy:**

- **Cron Job:** Runs daily at 00:01 UTC to fetch data from 3rd party providers (e.g., AlphaVantage, CoinGecko, OpenExchange Rates, Metals-API).
- **Retry Mechanism:** Implement exponential backoff for failed fetch attempts (e.g., 3 retries with 1 min, 5 min, 15 min delays) before declaring a job failure.
- **Success:** Update MongoDB -> Update Redis -> Purge Edge Cache.
- **3rd Party Failure:** If the provider returns 500 or timeout after all retries, the Cron Job logs the error internally but does not overwrite the database with empty data.
- **Alerting:** Trigger high-priority alerts (via Slack/Email/PagerDuty) to the dev team if the ingestion fails for >2 consecutive days or if major data sources are unreachable.
- **API Response:** The API continues serving the data from the previous successful fetch. The user sees a 200 OK status. A meta field in the JSON response will indicate the `data_date`.

### 4.3 Tech Stack Recommendation

- **Frontend/Portal:** Next.js (React).
- **Auth:** Clerk.
- **Billing:** Stripe.
- **Backend/API:** Node.js with TypeScript (Standard Server / Long-running process).
- **Database:** MongoDB.
- **Cache:** Redis.

### 4.4 Master Data Management (Supported Assets)

- **Internal Asset Registry:** Maintain a strictly controlled internal list (stored in DB or config files) of all supported Fiat currencies, Crypto symbols, NASDAQ tickers, and Precious Metals (e.g., XAU, XAG, XPT).
- **Decoupling Validation:** Incoming API requests are validated against this internal registry first. We do not query the 3rd party provider to check if a ticker exists during a user request.
- **Stability:** This ensures that if a 3rd party provider temporarily omits a ticker from their daily dump, our API doesn't break; it simply returns the last known value (per the "Never Fail" policy). Updates to this list (adding new tickers) are handled via a separate, manual or low-frequency process.

### 4.5 Rate Triangulation (Cross-Calculation Strategy)

- **Base Currency Normalization:** To minimize calls to 3rd party providers, we will only fetch data relative to a single base currency (e.g., USD).
  - **Fetch:** USD -> EUR, USD -> CAD, USD -> BTC, USD -> XAU (Gold).
  - **Do Not Fetch:** CAD -> BTC, EUR -> CAD, EUR -> XAU.
- **On-the-fly Calculation:** When a user requests a cross-rate (e.g., CAD to Gold), the system (or Edge function) calculates it using the cached base rates:
  - **Formula:** `Rate (CAD -> XAU) = Rate (USD -> XAU) / Rate (USD -> CAD)`
- **Benefit:** drastically reduces the volume of data points we need to pay for and ingest, while still supporting a full matrix of currency pairs for the user.

## 5. API Design Specifications

- **Base URL:** `https://api.finflux.io/v1`
- **Standard Response Wrapper:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cached": true,
    "timestamp": "2023-10-25T00:00:00Z", // The actual date of the data
    "source": "FinFlux"
  }
}
```

### Endpoints

1.  **`GET /rates/fiat`**

    - **Params:** `from` (USD), `to` (EUR)
    - **Returns:** Exchange rate (e.g., 0.94).
    - **Note:** Does not accept amount.

2.  **`GET /rates/crypto`**

    - **Params:** `symbol` (BTC), `currency` (USD)
    - **Returns:** Exchange rate (e.g., 34250.00).

3.  **`GET /rates/stock`**

    - **Params:** `ticker` (NASDAQ:AAPL)
    - **Returns:** Closing price in USD (e.g., 173.45).

4.  **`GET /rates/metal`**
    - **Params:** `symbol` (XAU), `currency` (USD)
    - **Returns:** Exchange rate (e.g., 1985.50).
    - **Note:** Symbols follow standard ISO currency codes for metals (XAU=Gold, XAG=Silver).

## 6. User Interface (UI) Requirements

See appendix for design guidance, you can also see a demo in `demo` directory.

## 7. Metrics & Analytics

Since we allow unlimited calls, we need internal monitoring to ensure abuse doesn't degrade performance for others.

1.  **User Metrics:**
    - Total Requests per API Key.
    - Response Latency per User.
2.  **System Metrics:**
    - Cache Hit Ratio (Target: >99%).
    - 3rd Party Sync Success/Fail Rate.

## 8. Appendix

### Landing page

![](https://i.imgur.com/UTmBqJB.png)

### Dashboard Home

![](https://i.imgur.com/x40xvVX.png)

### API Keys Page

![](https://i.imgur.com/eblCMZe.png)

### Billing Page

![](https://i.imgur.com/jGZIfHz.png)

### Documentation Page

![](https://i.imgur.com/ZtLldIK.png)
