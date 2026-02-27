import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import { upsertSubscription, getSubscriptionByStripeCustomer } from '@/db/queries/subscriptions';
import { updateUserPlan } from '@/db/queries/users';
import type { Plan, SubscriptionStatus, BillingInterval } from '@/db/schema';

export const dynamic = 'force-dynamic';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'canceled';
    default:
      return 'active';
  }
}

/**
 * Map Stripe interval to our billing interval
 */
function mapStripeInterval(interval: string): BillingInterval {
  return interval === 'year' ? 'year' : 'month';
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Fetch the subscription details from Stripe
  // Note: We'd normally use getStripe().subscriptions.retrieve() here,
  // but for the checkout.session.completed event, we have enough info
  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan: 'standard',
    status: 'trialing', // Checkout includes 7-day trial
    billingInterval: 'month', // Will be updated by subscription.updated event
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  // Update user's plan
  await updateUserPlan(userId, 'standard');

  console.log(`User ${userId} upgraded to standard via checkout`);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const existingSub = await getSubscriptionByStripeCustomer(customerId);
  if (!existingSub) {
    console.error('No subscription found for Stripe customer:', customerId);
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const plan: Plan = subscription.status === 'canceled' ? 'sandbox' : 'standard';
  const interval = subscription.items.data[0]?.plan?.interval;

  await upsertSubscription({
    userId: existingSub.userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan,
    status,
    billingInterval: interval ? mapStripeInterval(interval) : existingSub.billingInterval ?? undefined,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  });

  // Update user's plan
  await updateUserPlan(existingSub.userId, plan);

  console.log(`Subscription updated for user ${existingSub.userId}: ${status}`);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const existingSub = await getSubscriptionByStripeCustomer(customerId);
  if (!existingSub) {
    console.error('No subscription found for Stripe customer:', customerId);
    return;
  }

  // Downgrade to sandbox
  await upsertSubscription({
    userId: existingSub.userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan: 'sandbox',
    status: 'canceled',
  });

  // Update user's plan to sandbox
  await updateUserPlan(existingSub.userId, 'sandbox');

  console.log(`User ${existingSub.userId} downgraded to sandbox (subscription deleted)`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  // Find user by Stripe customer ID
  const existingSub = await getSubscriptionByStripeCustomer(customerId);
  if (!existingSub) {
    console.error('No subscription found for Stripe customer:', customerId);
    return;
  }

  // Update status to past_due
  await upsertSubscription({
    userId: existingSub.userId,
    stripeCustomerId: customerId,
    plan: existingSub.plan,
    status: 'past_due',
  });

  console.log(`Payment failed for user ${existingSub.userId}`);
}

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify and construct event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Ignore other events for MVP
        console.log(`Ignoring unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
