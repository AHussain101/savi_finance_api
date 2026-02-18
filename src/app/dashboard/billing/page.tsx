// Billing Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Card } from "@/components/ui/card";
import { BillingClient } from "./billing-client";

async function getSubscriptionData(userId: string) {
  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId });

  return {
    status: user?.subscriptionStatus || "inactive",
    hasStripeCustomer: !!user?.stripeCustomerId,
  };
}

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const subscription = await getSubscriptionData(userId);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">FinFlux Pro</p>
            <p className="text-muted-foreground">$10/month - Unlimited API calls</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              subscription.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {subscription.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      </Card>

      <BillingClient
        isActive={subscription.status === "active"}
        hasStripeCustomer={subscription.hasStripeCustomer}
      />
    </div>
  );
}
