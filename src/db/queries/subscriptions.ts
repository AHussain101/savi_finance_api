import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import {
  subscriptions,
  type Subscription,
  type Plan,
  type SubscriptionStatus,
  type BillingInterval,
} from '../schema';

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUser(userId: string): Promise<Subscription | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomer(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Upsert subscription (create or update)
 * Used when processing Stripe webhooks
 */
export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: Plan;
  billingInterval?: BillingInterval;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
}): Promise<Subscription> {
  const db = getDb();

  // Check if subscription exists for this user
  const existing = await getSubscriptionByUser(data.userId);

  if (existing) {
    // Update existing subscription
    const result = await db
      .update(subscriptions)
      .set({
        stripeCustomerId: data.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        plan: data.plan,
        billingInterval: data.billingInterval ?? existing.billingInterval,
        status: data.status,
        trialEndsAt: data.trialEndsAt ?? existing.trialEndsAt,
        currentPeriodEnd: data.currentPeriodEnd ?? existing.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, data.userId))
      .returning();
    return result[0];
  }

  // Create new subscription
  const result = await db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      plan: data.plan,
      billingInterval: data.billingInterval,
      status: data.status,
      trialEndsAt: data.trialEndsAt,
      currentPeriodEnd: data.currentPeriodEnd,
    })
    .returning();
  return result[0];
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus
): Promise<Subscription | null> {
  const db = getDb();
  const result = await db
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
    .returning();
  return result[0] ?? null;
}
