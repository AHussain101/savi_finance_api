import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserById } from '@/db/queries/users';
import { getSubscriptionByUser } from '@/db/queries/subscriptions';

export const dynamic = 'force-dynamic';

interface MeResponse {
  userId: string;
  email: string;
  plan: string;
  subscription: {
    status: string;
    billingInterval: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
  } | null;
}

/**
 * GET /api/auth/me
 *
 * Get the current authenticated user's info
 */
export async function GET(): Promise<NextResponse<MeResponse | { error: string }>> {
  try {
    const payload = await requireAuth();

    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscription = await getSubscriptionByUser(user.id);

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      subscription: subscription
        ? {
            status: subscription.status,
            billingInterval: subscription.billingInterval,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    // If it's already a NextResponse (from requireAuth), return it
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
