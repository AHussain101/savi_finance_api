# Matthew's Development Guide - Infrastructure

## Role: Infrastructure Engineer
**Focus**: Clerk authentication, Stripe billing, deployment, monitoring, webhooks

---

## Your Files & Directories

```
src/
├── app/
│   └── api/
│       ├── webhooks/
│       │   ├── clerk/route.ts       # Clerk webhook handler
│       │   └── stripe/route.ts      # Stripe webhook handler
│       └── billing/
│           └── portal/route.ts      # Stripe customer portal redirect
├── lib/
│   ├── auth/
│   │   └── clerk.ts                 # Clerk server utilities
│   └── billing/
│       ├── stripe.ts                # Stripe client setup
│       └── subscription.ts          # Subscription helpers
├── middleware.ts                     # Clerk auth middleware
```

### Config Files (Root)
```
├── .env.example                     # Environment template
├── .env.local                       # Local env (gitignored)
├── vercel.json                      # Vercel deployment config
└── next.config.js                   # Next.js config
```

---

## Tasks Checklist

### Phase 1: Project Setup
- [x] Initialize Next.js project with TypeScript
- [x] Set up ESLint and Prettier
- [x] Create .env.example with all required variables
- [x] Set up .gitignore properly
- [x] Configure next.config.js

### Phase 2: Clerk Integration
- [x] Install and configure Clerk SDK
- [x] Set up ClerkProvider in root layout
- [x] Create auth middleware (protect /dashboard routes)
- [x] Set up Clerk webhook endpoint
- [x] Handle user.created, user.updated, user.deleted events
- [x] Sync user data to MongoDB (coordinate with Sean)

### Phase 3: Stripe Integration
- [x] Install and configure Stripe SDK
- [ ] Create Stripe product and price ($10/month) *(manual step in Stripe dashboard)*
- [x] Set up Stripe webhook endpoint
- [x] Handle checkout.session.completed event
- [x] Handle customer.subscription.updated/deleted events
- [x] Create billing portal redirect endpoint
- [x] Implement subscription status checking

### Phase 4: Deployment
- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up production MongoDB (Atlas)
- [ ] Set up production Redis (Upstash)
- [ ] Configure custom domain (api.finflux.io)
- [x] Set up Vercel Cron for data ingestion jobs

### Phase 5: Monitoring & Alerts
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure Slack/Discord alerts for failures
- [ ] Set up uptime monitoring
- [x] Create health check endpoint

---

## Clerk Setup Guide

### 1. Clerk Dashboard Configuration
```
1. Create application at clerk.com
2. Enable Email/Password authentication
3. Enable Google OAuth
4. Set redirect URLs:
   - Sign-in: /sign-in
   - Sign-up: /sign-up
   - After sign-in: /dashboard
   - After sign-up: /dashboard
5. Create webhook endpoint pointing to /api/webhooks/clerk
```

### 2. Middleware Implementation
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### 3. Webhook Handler
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(payload, headers) as WebhookEvent;

  switch (evt.type) {
    case 'user.created':
      // Create user in MongoDB (coordinate with Sean)
      break;
    case 'user.deleted':
      // Soft delete user, revoke API keys
      break;
  }

  return Response.json({ received: true });
}
```

---

## Stripe Setup Guide

### 1. Stripe Dashboard Configuration
```
1. Create account at stripe.com
2. Create Product: "FinFlux Pro"
3. Create Price: $10/month recurring
4. Save Price ID: price_xxxxxxxxx
5. Create webhook endpoint: /api/webhooks/stripe
   - Events: checkout.session.completed, customer.subscription.*
6. Get webhook signing secret
```

### 2. Checkout Session
```typescript
// lib/billing/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: string, email: string) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
    metadata: { userId },
  });
  return session;
}
```

### 3. Webhook Handler
```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/billing/stripe';

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      // Activate user subscription
      // Enable API keys
      break;
    case 'customer.subscription.deleted':
      // Deactivate subscription
      // Disable API keys
      break;
  }

  return Response.json({ received: true });
}
```

### 4. Customer Portal
```typescript
// app/api/billing/portal/route.ts
export async function POST(req: Request) {
  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
  });

  return Response.json({ url: session.url });
}
```

---

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_URL=http://localhost:3000

# Database (shared with Sean)
MONGODB_URI=mongodb+srv://...

# Redis (shared with Aarfan)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "1 0 * * *"
    }
  ]
}
```

```typescript
// app/api/cron/ingest/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger Sean's ingestion jobs
  await runIngestionJobs();

  return Response.json({ success: true });
}
```

---

## Coordination Notes

### With Victoria (Frontend)
- Provide Clerk environment variables
- She'll use ClerkProvider you set up
- Billing portal URL endpoint for her billing page

### With Sean (Data)
- User sync from Clerk webhook to his User model
- Cron job scheduling for his ingestion scripts
- Alert configuration for data failures

### With Aarfan (Backend)
- Share subscription status checking logic
- He needs to verify subscription before allowing API calls
- Coordinate on API key activation/deactivation on subscription changes

---

## Quick Start

```bash
# Install dependencies
npm install @clerk/nextjs stripe svix

# Test Clerk locally
# Use ngrok for webhook testing
ngrok http 3000

# Set webhook URL in Clerk dashboard to:
# https://xxxx.ngrok.io/api/webhooks/clerk

# Test Stripe locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Testing Your Work

1. Clerk sign-up creates user in MongoDB
2. Protected routes redirect to sign-in
3. Stripe checkout completes and activates subscription
4. Subscription cancellation deactivates API access
5. Billing portal link works
6. Webhooks are verified with correct signatures
7. Cron job runs on schedule (test manually first)
