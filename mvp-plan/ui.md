# MVP UI Plan — VaultLine (Two-Tier MVP: Sandbox + Standard)

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

**Current UI state:**
- All pricing is static hardcoded copy in `src/components/Pricing.tsx`.
- The `plans` array (lines 5–96) contains all five tiers and renders them all in the grid (line 116).
- There is no routing beyond the single landing page (`src/app/page.tsx`).
- There is no auth UI, no dashboard, no API key management, and no billing flow.

---

## MVP Tiers (Scope)

**Tier 1 — Sandbox ($0/forever)**
**Tier 2 — Standard ($10/month or $96/year)**

**Tiers to hide/remove from UI for MVP:**
- `Builder`, `Scale`, and `Enterprise` entries must be **removed from the `plans` array** in `src/components/Pricing.tsx` (lines 39–95).
- The `lg:grid-cols-5` class on line 116 must be updated to `lg:grid-cols-2` (or `sm:grid-cols-2` staying as-is) to avoid an awkward sparse grid with two cards.
- The unit economics callout (lines 167–204) references "4 Scale customers" as the break-even — update that copy to reflect the Standard tier instead, or remove the callout entirely for MVP.

---

## Scope & Responsibilities

UI owns all user-facing pages, components, forms, and client-side state. It consumes the HTTP API defined by the Backend role and has no direct database or business logic access. For this MVP, UI must add four new functional areas on top of the existing landing page: auth flow, an API key management dashboard, a plan upgrade/billing flow, and usage feedback.

---

## Concrete Tasks (Numbered Steps)

### 1. Trim the Pricing Component (Landing Page)

1. Open `src/components/Pricing.tsx`.
2. Delete the `Builder` object (lines 39–56), the `Scale` object (lines 57–75), and the `Enterprise` object (lines 76–95) from the `plans` array. Leave only `Sandbox` (lines 6–21) and `Standard` (lines 22–38).
3. On line 116, change `lg:grid-cols-5` to `lg:grid-cols-2 max-w-2xl mx-auto` so the two cards are centered and well-proportioned.
4. Update the unit economics callout block (lines 167–204):
   - Change `"Break-even"` value from `"4 Scale customers"` to `"10 Standard customers"` (10 × $10 = $100 > $180 upstream is not quite right — either remove this stat or update to a factually accurate statement; consider replacing with a simpler "start free, pay when you grow" message).
5. Wire the `Standard` tier CTA button to navigate to `/auth/register?plan=standard` (or open the register modal). The `Sandbox` CTA should navigate to `/auth/register`.

### 2. App Router Structure — New Pages

Create the following Next.js App Router pages under `src/app/`:

```
src/app/
├── auth/
│   ├── register/
│   │   └── page.tsx       # Registration form
│   └── login/
│       └── page.tsx       # Login form
├── dashboard/
│   ├── page.tsx           # Main dashboard (plan status + quick stats)
│   ├── keys/
│   │   └── page.tsx       # API key management
│   └── billing/
│       └── page.tsx       # Plan details + upgrade/manage subscription
└── (existing)
    └── page.tsx           # Landing page (unchanged except Pricing component)
```

### 3. Registration Page (`/auth/register`)

- Form fields: Email, Password, Confirm Password.
- If `?plan=standard` query param is present, show a note: "You're signing up for a 7-day free trial of Standard. No credit card required upfront."
- On submit: `POST /api/auth/register` → on success, redirect to `/dashboard`.
- If `plan=standard`, after registration also call `POST /api/billing/checkout?interval=month` and redirect the user to the Stripe Checkout URL (Stripe handles trial). Alternatively, redirect to `/dashboard` first and show an "Activate your trial" banner.
- Validation: email format, password min 8 chars, passwords match. Show inline field-level errors.
- Link to `/auth/login` for existing users.

### 4. Login Page (`/auth/login`)

- Form fields: Email, Password.
- On submit: `POST /api/auth/login` → on success, redirect to `/dashboard`.
- Show a generic "Invalid email or password" error on 401 (do not distinguish which field is wrong).
- Link to `/auth/register`.

### 5. Dashboard — Main Page (`/dashboard`)

Protected: redirect to `/auth/login` if no valid session cookie.

Display:
- **Plan badge:** "Sandbox" or "Standard" with the appropriate styling.
- **API calls today** (Sandbox only): fetch from a `GET /api/usage/today` endpoint (Backend provides this) and show `X / 1,000 calls used today` with a progress bar. For Standard, show "Unlimited" with no progress bar.
- **History window:** "30-day history" (Sandbox) or "90-day history" (Standard).
- **API keys count:** "1 of 1 keys used" (Sandbox) or "X of 2 keys used" (Standard).
- **Quick links:** "Manage API Keys" → `/dashboard/keys`, "Billing" → `/dashboard/billing`.
- If `?upgraded=true` query param is present (redirected from Stripe): show a success banner "You're now on Standard. Your trial period has begun."

### 6. API Key Management Page (`/dashboard/keys`)

Protected: redirect to `/auth/login` if no session.

- **List existing keys:** `GET /api/keys` → display each key as a card showing label, creation date, and last 4 characters of the key.
- **Create new key:**
  - Show a "Generate Key" button only if under the plan limit (Sandbox: < 1 active key; Standard: < 2 active keys).
  - If at limit, show a disabled button with tooltip: "Upgrade to Standard for 2 API keys" (Sandbox) or "Maximum keys reached" (Standard).
  - On click: `POST /api/keys` → display the returned raw key in a one-time modal with a copy button and a warning: "Save this key now — it won't be shown again."
- **Revoke key:** Each key card has a "Revoke" button → confirmation dialog → `DELETE /api/keys/:id` → remove from list.

### 7. Billing Page (`/dashboard/billing`)

Protected: redirect to `/auth/login` if no session.

Fetch `GET /api/billing/subscription` to determine current state.

**If Sandbox plan:**
- Show plan details (Sandbox features list, $0).
- Show "Upgrade to Standard" CTA with a pricing summary ($10/mo or $96/yr with toggle).
- On "Upgrade" click: `POST /api/billing/checkout` with chosen interval → redirect to `checkoutUrl`.

**If Standard plan (active or trialing):**
- Show plan details (Standard features list, price, billing interval).
- If `status = 'trialing'`: show "Your free trial ends on <date>. You won't be charged until then."
- If `status = 'past_due'`: show a warning banner "Payment failed — please update your payment method."
- "Manage Subscription" button → `POST /api/billing/portal` → redirect to `portalUrl` (Stripe Customer Portal for cancel/update card).

**If Standard plan (canceled):**
- Show "Your Standard subscription has ended. You're back on Sandbox." with an "Reactivate" CTA.

### 8. Shared Layout and Navigation

- Create `src/app/dashboard/layout.tsx` with a simple sidebar or top nav showing: Dashboard, API Keys, Billing, and a Logout button.
- Logout button → `POST /api/auth/logout` → redirect to `/`.
- Add "Dashboard" / "Login" links to the existing `src/components/Navbar.tsx`:
  - If session exists: show "Dashboard" link.
  - If no session: show "Log in" and "Get Started" (→ register) links.
  - This requires reading the session state — use a client-side fetch to `GET /api/auth/me` (a simple session-status endpoint Backend should add) or use a React context initialized from a server component.

### 9. Error and Loading States

- Every data-fetching component must show a loading skeleton (use Tailwind's `animate-pulse` pattern consistent with `globals.css`) while requests are in flight.
- Every form submit button must disable and show a spinner during the request.
- API errors must surface a human-readable message (not a raw error object) in the UI.

### 10. Accessibility and Mobile

- All forms must have associated `<label>` elements.
- Focus states must be visible (Tailwind `focus-visible:ring-2`).
- Dashboard pages must be usable on mobile (stack cards vertically, sidebar collapses to a top nav on small screens).

---

## Acceptance Criteria ("Done means…")

- Landing page Pricing section shows exactly two cards: Sandbox and Standard. Builder, Scale, and Enterprise cards are gone.
- "Start Building" (Sandbox) and "Start Free Trial" (Standard) buttons on the landing page navigate to `/auth/register` (with `?plan=standard` for Standard).
- A new user can register, receive their first API key, and see it on the keys page.
- A Sandbox user sees a real-time call count progress bar capped at 1,000.
- A Sandbox user sees the "Generate Key" button disabled after creating 1 key.
- A Standard user can generate up to 2 keys.
- Clicking "Upgrade to Standard" on the billing page redirects to a valid Stripe Checkout URL.
- After a successful Stripe checkout, the dashboard shows "Standard" plan badge and the `?upgraded=true` success banner.
- The Manage Subscription button opens the Stripe Customer Portal.
- All dashboard pages redirect to `/auth/login` when accessed without a session.
- No Builder, Scale, or Enterprise copy appears anywhere in the app.

---

## Dependencies on Other Roles

| Depends on | What is needed |
|---|---|
| Backend | All API routes must be implemented and return the documented response shapes before UI integration can be tested end-to-end |
| Backend | Session cookie must be set correctly (HttpOnly, Secure, SameSite) — UI has no control over this but depends on it for protected routes |
| Infrastructure | Production URL must be finalized before Stripe redirect URLs (`success_url`, `cancel_url`) are hardcoded in the checkout flow |
| Data | Seed data must be present in the dev database for the dashboard usage stats to display non-empty states during development |

---

## Integration Steps

1. UI trims `Pricing.tsx` (step 1) immediately — this is a standalone change with no backend dependency.
2. UI builds auth pages (`/auth/register`, `/auth/login`) and stubs out the API calls — can be built in parallel with Backend while backend routes are in progress.
3. UI builds dashboard layout and static page shells — no live data needed.
4. Once Backend delivers `/api/keys` and `/api/billing/subscription`, UI wires real data to the keys and billing pages.
5. Once Backend delivers `/api/billing/checkout` and `/api/billing/portal`, UI connects upgrade and manage buttons.
6. Final integration test: complete flow — register → see Sandbox dashboard → upgrade → Stripe trial → see Standard dashboard → manage subscription in portal.

---

## Files / Modules Likely Touched

| File | Action |
|---|---|
| `src/components/Pricing.tsx` | Edit — remove Builder (lines 39–56), Scale (lines 57–75), Enterprise (lines 76–95) from `plans` array; fix grid columns (line 116); update CTA href |
| `src/components/Navbar.tsx` | Edit — add auth-state-aware "Dashboard" / "Log in" / "Get Started" links |
| `src/app/page.tsx` | No changes expected (Pricing component handles itself) |
| `src/app/auth/register/page.tsx` | Create — registration form |
| `src/app/auth/login/page.tsx` | Create — login form |
| `src/app/dashboard/layout.tsx` | Create — dashboard shell with sidebar nav |
| `src/app/dashboard/page.tsx` | Create — plan status, usage stats |
| `src/app/dashboard/keys/page.tsx` | Create — API key list, create, revoke |
| `src/app/dashboard/billing/page.tsx` | Create — subscription status, upgrade CTA, portal link |
| `src/app/globals.css` | Possibly edit — add any new utility classes needed by dashboard components |
| `src/components/ui/` | Create directory — shared UI primitives (Button, Input, Card, Badge, Modal, Spinner) used across dashboard pages |
