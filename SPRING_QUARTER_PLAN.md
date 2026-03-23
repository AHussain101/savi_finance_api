# FinFlux API - Spring Quarter Plan

## Overview

This document outlines the remaining work needed to reach 100% completion of the FinFlux API project based on the Product Requirements Document (PRD). The codebase is approximately **75-80% complete** with core functionality working.

---

## Current Implementation Status

### Fully Implemented
| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (Email/Password) | ✅ Complete | JWT-based with bcrypt |
| Authentication (Google OAuth) | ✅ Complete | Full OAuth 2.0 flow |
| Stripe Integration | ✅ Complete | Checkout, webhooks, customer portal |
| API Endpoints | ✅ Complete | `/rates`, `/rates/history`, `/assets` |
| API Key Management | ✅ Complete | Generate, list, revoke |
| Usage Analytics | ✅ Complete | Redis real-time + PostgreSQL historical |
| Database Schema | ✅ Complete | 5 tables, Drizzle ORM |
| Daily Data Ingestion | ✅ Complete | 4 asset classes via cron |
| Developer Portal UI | ✅ Complete | Dashboard, keys, billing pages |
| Asset Registry | ✅ Complete | ~32 symbols across 4 classes |
| Rate Limiting | ✅ Complete | Redis-backed, plan-based limits |

### Partially Implemented
| Feature | Status | Gap |
|---------|--------|-----|
| Caching Strategy | 🟡 Partial | Only rate limiting cached; no response caching or edge caching |
| Error Suppression | 🟡 Partial | Basic resilience but no stale-data fallback |

### Not Implemented
| Feature | Status | PRD Section |
|---------|--------|-------------|
| Rate Triangulation | ❌ Missing | 4.5 |
| Edge Caching (CDN) | ❌ Missing | 4.1 |
| Response Caching (Redis) | ❌ Missing | 4.1 |
| "Never Fail" Policy | ❌ Missing | 4.2 |
| Retry Mechanism (Exponential Backoff) | ❌ Missing | 4.2 |
| Alerting System | ❌ Missing | 4.2 |
| Real Metals API Integration | ❌ Missing | Using hardcoded values |

---

## Sprint Breakdown

### Sprint 1: Caching Infrastructure

**Goal:** Implement the "99% Cache Hit Rate" mandate from PRD Section 4.1

#### Tasks

- [ ] **Redis Response Caching**
  - Cache API responses for rate queries in Redis
  - Key format: `rates:{symbol}:{date}`
  - TTL: 24 hours (data is T-1)
  - Implement cache-aside pattern: check Redis → fallback to DB → populate Redis

- [ ] **Edge Caching Setup**
  - Configure Vercel Edge Middleware for API routes
  - Set `Cache-Control` headers with 24-hour TTL for rate endpoints
  - Implement cache key generation based on query parameters
  - Add `Surrogate-Key` headers for targeted cache invalidation

- [ ] **Cache Invalidation Strategy**
  - After successful data ingestion, purge relevant edge cache keys
  - Implement Redis cache warming on application startup
  - Add cache stats endpoint for monitoring hit rates

#### Acceptance Criteria
- [ ] Rate endpoints serve from Redis cache on repeated requests
- [ ] Edge cache serves requests without hitting backend
- [ ] Cache hit ratio monitoring in place
- [ ] Cache invalidation working after daily ingestion

---

### Sprint 2: Rate Triangulation

**Goal:** Implement cross-rate calculation per PRD Section 4.5

#### Tasks

- [ ] **Base Currency Normalization**
  - Ensure all rates are stored relative to USD as base
  - Update ingestion to enforce USD-base convention
  - Document supported cross-rate pairs

- [ ] **Triangulation Service**
  - Create `src/lib/triangulation.ts` with calculation logic
  - Formula: `Rate(A → B) = Rate(USD → B) / Rate(USD → A)`
  - Handle precision (8 decimal places for consistency)

- [ ] **API Integration**
  - Update `/api/v1/rates` to detect cross-rate requests
  - Calculate triangulated rates on-the-fly
  - Cache computed cross-rates in Redis

- [ ] **Validation**
  - Validate both currencies exist in registry
  - Return appropriate error for unsupported pairs
  - Add unit tests for triangulation math

#### Acceptance Criteria
- [ ] API returns correct rate for `CAD/EUR` (computed from USD rates)
- [ ] Triangulated rates cached with same TTL as source rates
- [ ] Response includes `triangulated: true` flag in meta
- [ ] All 4 asset classes support cross-rates to fiat currencies

---

### Sprint 3: "Never Fail" Policy

**Goal:** Implement comprehensive error suppression per PRD Section 4.2

#### Tasks

- [ ] **Stale Data Fallback**
  - Modify rate queries to fall back to oldest available data if current missing
  - Add `stale: true` flag to response meta when serving old data
  - Log when stale data is served (for monitoring)

- [ ] **Retry Mechanism with Exponential Backoff**
  - Implement retry wrapper for 3rd party API calls
  - Delays: 1 min → 5 min → 15 min (3 retries)
  - Log each retry attempt with error details

- [ ] **Provider Failure Handling**
  - On complete provider failure, preserve existing data (no overwrites)
  - Track consecutive failure count per provider
  - Implement provider health status tracking

- [ ] **Graceful Degradation**
  - If Redis unavailable, serve directly from DB (already partial)
  - If DB unavailable, serve from Redis (requires Redis to have full data)
  - Return 200 OK with degraded flag, never 500

#### Acceptance Criteria
- [ ] API returns 200 OK even when 3rd party provider is down
- [ ] Stale data served with appropriate meta flags
- [ ] Retry mechanism logs visible in monitoring
- [ ] Zero 500 errors from data availability issues

---

### Sprint 4: Alerting & Monitoring

**Goal:** Implement alerting system per PRD Section 4.2

#### Tasks

- [ ] **Alert Service Setup**
  - Choose alerting provider (Slack webhook / PagerDuty / Email)
  - Create `src/lib/alerts.ts` with unified alert interface
  - Configure alert channels via environment variables

- [ ] **Ingestion Failure Alerts**
  - Alert on any single provider failure
  - High-priority alert if >2 consecutive days of failure
  - Alert if major data sources unreachable (fiat, crypto)

- [ ] **System Health Alerts**
  - Alert if cache hit ratio drops below 90%
  - Alert if database connection pool exhausted
  - Alert if Redis becomes unavailable

- [ ] **Monitoring Dashboard**
  - Add `/api/admin/metrics` endpoint (protected)
  - Track: cache hit ratio, provider success rates, daily API call volume
  - Consider integration with external monitoring (Datadog, New Relic)

#### Acceptance Criteria
- [ ] Team receives Slack/PagerDuty alert within 5 minutes of ingestion failure
- [ ] Alert includes: provider name, error message, consecutive failure count
- [ ] Metrics endpoint returns system health data
- [ ] Runbook documented for alert response

---

### Sprint 5: Real Metals API & Asset Expansion

**Goal:** Replace hardcoded metals data with real provider

#### Tasks

- [ ] **Metals API Integration**
  - Evaluate providers: Metals-API, GoldAPI, MetalPriceAPI
  - Implement metals data fetcher with API key
  - Add to daily ingestion cron job

- [ ] **Asset Registry Expansion**
  - Add more fiat currencies (20+ total)
  - Add more crypto assets (top 20 by market cap)
  - Add more NASDAQ stocks (50+ tickers)
  - Add palladium (XPD) and rhodium (XRH) to metals

- [ ] **Asset Registry Admin**
  - Create admin endpoint to add/remove supported assets
  - Validation: asset must be available from at least one provider
  - Document process for adding new assets

#### Acceptance Criteria
- [ ] Live metals prices from real API
- [ ] 50+ supported symbols total
- [ ] Admin can add new tickers without code deployment
- [ ] New assets appear in `/api/v1/assets` response

---

### Sprint 6: Production Hardening

**Goal:** Prepare for production launch

#### Tasks

- [ ] **Security Audit**
  - Review all API endpoints for authorization checks
  - Ensure no sensitive data in logs
  - Validate webhook signature verification
  - Add rate limiting to auth endpoints (brute force protection)

- [ ] **Performance Testing**
  - Load test API endpoints (target: 1000 RPS)
  - Verify cache behavior under load
  - Test failover scenarios (Redis down, DB down)

- [ ] **Documentation**
  - Complete API documentation page
  - Add OpenAPI/Swagger spec
  - Write developer quickstart guide
  - Document webhook integration for customers

- [ ] **Infrastructure**
  - Set up staging environment
  - Configure production environment variables
  - Set up database backups (automated)
  - Configure CDN for global distribution

- [ ] **Legal & Compliance**
  - Add Terms of Service page
  - Add Privacy Policy page
  - Ensure GDPR compliance for EU users
  - Document data retention policies

#### Acceptance Criteria
- [ ] Security audit passed with no critical issues
- [ ] API handles 1000+ RPS without degradation
- [ ] Full API documentation available at `/docs`
- [ ] Staging environment mirrors production
- [ ] Legal pages live and linked from footer

---

## Technical Debt & Improvements

These items are not required for launch but would improve maintainability:

| Item | Priority | Notes |
|------|----------|-------|
| Switch to Clerk (per PRD) | Low | Current JWT auth works fine |
| Switch to MongoDB (per PRD) | Low | PostgreSQL is working well |
| Add comprehensive test suite | Medium | Unit + integration tests |
| Implement API versioning strategy | Low | `/v1/` already in place |
| Add request logging/tracing | Medium | For debugging production issues |
| Implement backup data providers | Medium | Fallback if primary provider fails |

---

## Timeline Summary

| Sprint | Duration | Focus |
|--------|----------|-------|
| Sprint 1 | 2 weeks | Caching Infrastructure |
| Sprint 2 | 1 week | Rate Triangulation |
| Sprint 3 | 2 weeks | "Never Fail" Policy |
| Sprint 4 | 1 week | Alerting & Monitoring |
| Sprint 5 | 2 weeks | Real Metals API & Asset Expansion |
| Sprint 6 | 2 weeks | Production Hardening |

**Total:** ~10 weeks to 100% completion

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Metals API pricing too expensive | Medium | Medium | Evaluate multiple providers, consider caching more aggressively |
| Edge caching complexity | Medium | Low | Start with Vercel's built-in caching before Cloudflare Workers |
| Provider rate limits during expansion | Medium | Medium | Implement request batching, consider paid tiers |
| Scope creep on asset expansion | High | Medium | Strict priority on top 50 assets only |

---

## Definition of Done (100% Complete)

The project is 100% complete when:

1. ✅ All PRD functional requirements (FR-01 through FR-12) are implemented
2. ✅ Caching achieves >95% hit rate in production
3. ✅ API returns 200 OK for all valid requests (never fails due to stale data)
4. ✅ Alerting notifies team within 5 minutes of any critical failure
5. ✅ Rate triangulation supports full currency matrix
6. ✅ Real data from all 4 asset class providers (no hardcoded values)
7. ✅ Production environment deployed and stable
8. ✅ Documentation complete for developers

---

*Last Updated: March 2026*
