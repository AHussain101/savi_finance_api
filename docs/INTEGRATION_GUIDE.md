# Integration Guide - Merging Everyone's Work

This guide ensures all team members can merge their work without breaking the project.

---

## The Golden Rules

1. **Always pull before you push**
2. **Work only in your assigned directories**
3. **Never edit shared files without coordination**
4. **Test locally before pushing**

---

## Directory Ownership (DO NOT CROSS!)

| Directory | Owner | Others Can |
|-----------|-------|------------|
| `src/app/page.tsx` | Victoria | Read only |
| `src/app/(auth)/` | Victoria | Read only |
| `src/app/dashboard/` | Victoria | Read only |
| `src/components/` | Victoria | Read only |
| `src/app/api/v1/rates/` | Aarfan | Read only |
| `src/app/api/v1/keys/` | Aarfan | Read only |
| `src/lib/cache/` | Aarfan | Read only |
| `src/lib/api/` | Aarfan | Read only |
| `src/lib/db/` | Sean | Read only |
| `src/lib/providers/` | Sean | Read only |
| `src/lib/registry/` | Sean | Read only |
| `src/jobs/` | Sean | Read only |
| `src/app/api/webhooks/` | Matthew | Read only |
| `src/lib/auth/` | Matthew | Read only |
| `src/lib/billing/` | Matthew | Read only |
| `src/middleware.ts` | Matthew | Read only |

### Shared Files (Coordinate Before Editing!)

These files may need edits from multiple people. **Always communicate before changing:**

| File | Primary Owner | May Also Need |
|------|---------------|---------------|
| `src/app/layout.tsx` | Victoria | Matthew (Clerk Provider) |
| `src/types/*.ts` | All | Coordinate changes |
| `package.json` | Matthew | All (for new deps) |
| `.env.example` | Matthew | All (for new vars) |

---

## Build Order (Who Goes First)

### Phase 1: Foundation (Do These First)

```
1. Matthew: Set up Clerk + Stripe accounts, add env vars
2. Sean: Set up MongoDB connection + models
3. Aarfan: Set up Redis connection
```

### Phase 2: Core Features (Can Be Parallel)

```
Victoria: Landing page, auth pages (needs Matthew's Clerk setup)
Sean: Data providers + ingestion jobs
Aarfan: API endpoints + caching
Matthew: Webhooks + billing portal
```

### Phase 3: Integration (Everyone Together)

```
1. Victoria connects dashboard to Aarfan's API endpoints
2. Aarfan uses Sean's models and Matthew's auth checks
3. Sean's jobs notify Aarfan's cache refresh
4. Matthew's webhooks update Sean's user model
```

---

## Git Workflow for Safe Merging

### Step 1: Create Your Branch

```bash
# Always start from latest main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/[your-name]/[feature-name]
# Examples:
# git checkout -b feature/victoria/landing-page
# git checkout -b feature/sean/fiat-ingestion
# git checkout -b feature/matthew/clerk-setup
# git checkout -b feature/aarfan/rates-endpoint
```

### Step 2: Work on Your Feature

```bash
# Make changes in YOUR directories only
# Commit frequently
git add .
git commit -m "feat([area]): description"
```

### Step 3: Before Pushing - Sync with Main

```bash
# Get latest changes from main
git fetch origin main
git rebase origin/main

# If conflicts, resolve them (see Conflict Resolution below)
# Then continue
git rebase --continue
```

### Step 4: Push and Create PR

```bash
git push -u origin feature/[your-name]/[feature-name]
# Create PR on GitHub
```

### Step 5: After PR Approval - Merge

```bash
# Use "Squash and Merge" on GitHub
# This keeps history clean
```

---

## Conflict Resolution Guide

### If You Get a Merge Conflict

```bash
# See which files have conflicts
git status

# Open the conflicted file - you'll see:
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> branch-name

# Keep the correct version, remove the markers
# Then:
git add [file]
git rebase --continue
```

### Common Conflicts and Who Wins

| File | If Victoria & Sean conflict | Winner |
|------|---------------------------|--------|
| `src/app/*` | Victoria wins | Victoria |
| `src/lib/db/*` | Sean wins | Sean |
| `src/types/*` | Discuss in chat | Combine both |
| `package.json` | Keep both deps | Combine |

---

## Integration Checkpoints

### Checkpoint 1: Auth Works (Matthew + Victoria)

**Test:** Can users sign up and see dashboard?

```bash
# Matthew: Clerk is configured
# Victoria: Auth pages use Clerk components
npm run dev
# Go to /sign-up, create account, should redirect to /dashboard
```

### Checkpoint 2: Database Works (Sean + Matthew)

**Test:** Do webhooks create users in DB?

```bash
# Sean: User model exists
# Matthew: Clerk webhook creates user
# Use ngrok to test webhook
ngrok http 3000
# Sign up a user, check MongoDB for new user record
```

### Checkpoint 3: API Works (Aarfan + Sean)

**Test:** Do API endpoints return data?

```bash
# Sean: Rates are in database
# Aarfan: Endpoints query the data
curl "http://localhost:3000/api/v1/rates/fiat?from=USD&to=EUR"
# Should return rate data
```

### Checkpoint 4: Full Integration (Everyone)

**Test:** Complete user flow works

```
1. Sign up (Victoria + Matthew)
2. Subscribe via Stripe (Matthew)
3. Generate API key (Victoria + Aarfan)
4. Make API call (Aarfan + Sean)
5. See usage stats (Victoria + Aarfan)
```

---

## Interface Contracts (Don't Break These!)

### Sean's Models → Used By Everyone

```typescript
// src/lib/db/models/user.ts
interface IUser {
  clerkId: string;      // Matthew writes this
  email: string;        // Matthew writes this
  stripeCustomerId?: string;  // Matthew writes this
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
}

// src/lib/db/models/rate.ts
interface IRate {
  type: 'fiat' | 'crypto' | 'stock' | 'metal';
  base: string;   // Always 'USD'
  quote: string;  // The target (EUR, BTC, AAPL, XAU)
  rate: number;
  dataDate: Date;
}
```

**Rule:** If Sean changes these interfaces, tell everyone!

### Aarfan's API Response → Used By Victoria

```typescript
// All API responses follow this format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta: { cached: boolean; timestamp: string; source: string };
}

// Victoria expects these endpoints:
GET /api/v1/keys        → { keys: ApiKeyData[] }
POST /api/v1/keys       → { key: string, name: string }
DELETE /api/v1/keys?id= → { success: true }
GET /api/v1/usage       → { totalCalls: number, period: string }
```

**Rule:** If Aarfan changes response format, tell Victoria!

### Matthew's Auth → Used By Everyone

```typescript
// How to check if user is authenticated
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// How to check subscription status
import { checkSubscription } from '@/lib/billing/subscription';
const isActive = await checkSubscription(userId);
```

**Rule:** If Matthew changes auth flow, tell everyone!

---

## Pre-Merge Checklist

Before merging your PR, verify:

- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] Your changes only touch YOUR directories
- [ ] You've tested locally
- [ ] You've rebased on latest main
- [ ] No console.log statements left in code
- [ ] Environment variables documented in .env.example

---

## Emergency: Something Broke After Merge

### Option 1: Revert the PR

```bash
git revert [commit-hash]
git push
```

### Option 2: Fix Forward

```bash
git checkout main
git pull
git checkout -b hotfix/[description]
# Fix the issue
git push -u origin hotfix/[description]
# Create urgent PR
```

### Option 3: Reset to Known Good State

```bash
# Find last working commit
git log --oneline

# Reset (CAREFUL - this loses commits)
git reset --hard [good-commit-hash]
git push --force  # Only if others haven't pulled!
```

---

## Communication Checklist

Before you push, ask yourself:

1. **Did I change any shared files?** → Tell the team
2. **Did I change any interfaces/types?** → Tell affected team members
3. **Did I add new environment variables?** → Update .env.example and tell Matthew
4. **Did I add new dependencies?** → Tell the team so they run npm install
5. **Is my feature blocking someone else?** → Prioritize and communicate

---

## Daily Sync Routine

Every day before starting work:

```bash
# 1. Get latest code
git checkout main
git pull origin main

# 2. Update your branch
git checkout feature/[your-branch]
git rebase origin/main

# 3. Install any new deps
npm install

# 4. Run build to check everything works
npm run build
```

---

## Team Communication Template

When you finish a feature, post in team chat:

```
✅ MERGED: [feature name]

Branch: feature/[your-name]/[feature]
Files changed: [list main files]
New env vars: [if any]
New deps: [if any]
Breaking changes: [if any]
Who needs to know: [@mention teammates]

To update:
git pull origin main
npm install
```
