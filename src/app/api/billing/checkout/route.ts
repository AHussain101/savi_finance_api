import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getStripe, stripePrices } from '@/lib/stripe';
import { getUserById } from '@/db/queries/users';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';
import { publicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  interval: 'month' | 'year';
}

interface CheckoutResponse {
  checkoutUrl: string;
}

/**
 * POST /api/billing/checkout
 *
 * Create a Stripe Checkout Session for upgrading to Standard plan
 */
export async function POST(request: Request): Promise<NextResponse<CheckoutResponse | { error: string }>> {
  try {
    const payload = await requireAuth();

    // Parse request body
    const body = await request.json() as CheckoutRequest;
    const { interval } = body;

    if (!interval || !['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year".' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has Standard plan
    const subscription = await getSubscriptionByUser(payload.sub);
    if (subscription?.plan === 'standard' && subscription?.status === 'active') {
      return NextResponse.json(
        { error: 'You are already subscribed to the Standard plan' },
        { status: 400 }
      );
    }

    // Get the appropriate price ID
    const priceId = interval === 'year' ? stripePrices.annual : stripePrices.monthly;

    if (!priceId) {
      console.error('Stripe price ID not configured for interval:', interval);
      return NextResponse.json(
        { error: 'Billing not configured' },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const appUrl = publicEnv.APP_URL;

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Use existing Stripe customer if available
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: user.email }),
      // 7-day free trial
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
        },
      },
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: user.id,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
