// Stripe Webhook Handler - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  // TODO: Handle different event types
  switch (event.type) {
    case "checkout.session.completed":
      // TODO: Activate user subscription
      // TODO: Enable API keys
      console.log("Checkout completed");
      break;
    case "customer.subscription.updated":
      // TODO: Update subscription status
      console.log("Subscription updated");
      break;
    case "customer.subscription.deleted":
      // TODO: Deactivate subscription
      // TODO: Disable API keys
      console.log("Subscription deleted");
      break;
  }

  return new Response("Webhook received", { status: 200 });
}
