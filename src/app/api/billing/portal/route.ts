import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';
import { publicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

interface PortalResponse {
  portalUrl: string;
}

/**
 * POST /api/billing/portal
 *
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function POST(): Promise<NextResponse<PortalResponse | { error: string }>> {
  try {
    const payload = await requireAuth();

    // Get user's subscription
    const subscription = await getSubscriptionByUser(payload.sub);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing information found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = publicEnv.APP_URL;

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
