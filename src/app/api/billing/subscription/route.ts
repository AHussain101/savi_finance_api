import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';

export const dynamic = 'force-dynamic';

interface SubscriptionResponse {
  plan: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  isTrialing: boolean;
}

/**
 * GET /api/billing/subscription
 *
 * Get the current user's subscription status
 */
export async function GET(): Promise<NextResponse<SubscriptionResponse | { error: string }>> {
  try {
    const payload = await requireAuth();

    const subscription = await getSubscriptionByUser(payload.sub);

    if (!subscription) {
      // User has no subscription record - treat as sandbox
      return NextResponse.json({
        plan: 'sandbox',
        status: 'active',
        billingInterval: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        isTrialing: false,
      });
    }

    const now = new Date();
    const isTrialing =
      subscription.status === 'trialing' ||
      (subscription.trialEndsAt !== null && subscription.trialEndsAt > now);

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      isTrialing,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
