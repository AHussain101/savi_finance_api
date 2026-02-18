// Stripe Webhook Handler - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { headers } from "next/headers";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import {
  activateSubscription,
  deactivateSubscription,
  cancelSubscription,
} from "@/lib/billing/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
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

  await connectToDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;

      if (userId && customerId) {
        await activateSubscription(userId, customerId);
        console.log("Subscription activated for user:", userId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const user = await User.findOne({ stripeCustomerId: customerId });

      if (user) {
        if (subscription.status === "active") {
          await activateSubscription(user.clerkId, customerId);
        } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
          await deactivateSubscription(user.clerkId);
        }
        console.log("Subscription updated for customer:", customerId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const user = await User.findOne({ stripeCustomerId: customerId });

      if (user) {
        await cancelSubscription(user.clerkId);
        console.log("Subscription canceled for customer:", customerId);
      }
      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
}
