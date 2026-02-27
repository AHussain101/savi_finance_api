import Stripe from 'stripe';

/**
 * Stripe client for billing operations
 *
 * The client is created lazily to avoid errors during build time
 * when environment variables may not be available.
 */

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        'Stripe configuration missing. Please set STRIPE_SECRET_KEY environment variable.'
      );
    }

    stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }

  return stripe;
}

/**
 * Stripe price IDs for the Standard tier
 */
export const stripePrices = {
  get monthly() {
    return process.env.STRIPE_PRICE_MONTHLY_STANDARD || '';
  },
  get annual() {
    return process.env.STRIPE_PRICE_ANNUAL_STANDARD || '';
  },
} as const;

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      'Stripe webhook secret missing. Please set STRIPE_WEBHOOK_SECRET environment variable.'
    );
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}
