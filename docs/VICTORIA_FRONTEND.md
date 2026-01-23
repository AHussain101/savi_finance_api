# Victoria's Development Guide - Frontend

## Role: Frontend Developer
**Focus**: Next.js UI, Dashboard, Landing Page, Clerk UI Components

---

## Your Files & Directories

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing page (public)
│   ├── globals.css
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   └── dashboard/
│       ├── layout.tsx                # Dashboard layout with sidebar
│       ├── page.tsx                  # Dashboard home (usage stats)
│       ├── api-keys/page.tsx         # API key management
│       ├── billing/page.tsx          # Stripe billing portal
│       └── docs/page.tsx             # API documentation
├── components/
│   ├── ui/                           # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── landing/                      # Landing page components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── pricing.tsx
│   │   └── footer.tsx
│   └── dashboard/                    # Dashboard components
│       ├── sidebar.tsx
│       ├── stats-card.tsx
│       ├── api-key-table.tsx
│       └── usage-chart.tsx
```

---

## Tasks Checklist

### Phase 1: Setup
- [ ] Install UI dependencies (Tailwind CSS, shadcn/ui)
- [ ] Set up root layout with Clerk provider
- [ ] Create basic component structure
- [ ] Set up globals.css with design tokens

### Phase 2: Landing Page
- [ ] Hero section with value proposition
- [ ] Features section (4 data types: Fiat, Crypto, Stocks, Metals)
- [ ] Pricing section ($10/month flat)
- [ ] Footer with links
- [ ] CTA buttons linking to sign-up

### Phase 3: Auth Pages
- [ ] Sign-in page using `<SignIn />` from Clerk
- [ ] Sign-up page using `<SignUp />` from Clerk
- [ ] Redirect logic after auth

### Phase 4: Dashboard
- [ ] Dashboard layout with sidebar navigation
- [ ] Home page with usage statistics (calls this month)
- [ ] API Keys page (generate, view, revoke keys)
- [ ] Billing page (link to Stripe Customer Portal)
- [ ] Documentation page (API reference)

### Phase 5: Polish
- [ ] Loading states and skeletons
- [ ] Error boundaries
- [ ] Mobile responsive design
- [ ] Dark mode support (optional)

---

## API Endpoints You'll Consume

### From Aarfan (Backend)
```typescript
// Get user's API keys
GET /api/v1/keys
Response: { success: true, data: { keys: [...] } }

// Create new API key
POST /api/v1/keys
Response: { success: true, data: { key: "sk_live_..." } }

// Revoke API key
DELETE /api/v1/keys/:keyId
Response: { success: true }

// Get usage stats
GET /api/v1/usage
Response: { success: true, data: { totalCalls: 1234, period: "2024-01" } }
```

### From Matthew (Infrastructure)
```typescript
// Get billing portal URL
POST /api/billing/portal
Response: { url: "https://billing.stripe.com/..." }

// Check subscription status
GET /api/subscription/status
Response: { active: true, plan: "pro", renewsAt: "..." }
```

---

## Design Reference

Refer to the PRD Appendix for mockups:
- Landing page: Clean, developer-focused, single pricing tier
- Dashboard: Sidebar navigation, stats cards, data tables
- Use a professional color scheme (blues/grays)

### Recommended UI Libraries
```bash
# Install shadcn/ui (recommended)
npx shadcn-ui@latest init

# Components to add
npx shadcn-ui@latest add button card input table tabs
```

---

## Environment Variables You Need

```env
# These are provided by Matthew
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## Coordination Notes

### With Matthew (Infrastructure)
- Matthew provides Clerk configuration
- Billing portal redirect URL comes from his endpoint
- Coordinate on protected route middleware

### With Aarfan (Backend)
- API keys endpoint for the management page
- Usage stats endpoint for dashboard home
- Coordinate on response formats

### With Sean (Data)
- No direct dependencies, but your docs page should reflect available data types

---

## Quick Start

```bash
# After cloning, install dependencies
npm install

# Start dev server
npm run dev

# Your pages will be at:
# http://localhost:3000          - Landing
# http://localhost:3000/sign-in  - Sign in
# http://localhost:3000/dashboard - Dashboard
```

---

## Testing Your Work

1. Landing page renders without errors
2. Clerk sign-in/sign-up flows work
3. Dashboard pages are protected (redirect if not logged in)
4. API key operations work (mock data initially)
5. Responsive on mobile devices
