// Subscription Utilities - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { User } from "@/lib/db/models/user";
import { connectToDatabase } from "@/lib/db/connection";

export async function checkSubscription(userId: string): Promise<boolean> {
  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId });

  if (!user) {
    return false;
  }

  return user.subscriptionStatus === "active";
}

export async function activateSubscription(
  clerkId: string,
  stripeCustomerId: string
): Promise<void> {
  await connectToDatabase();

  await User.findOneAndUpdate(
    { clerkId },
    {
      stripeCustomerId,
      subscriptionStatus: "active",
    }
  );
}

export async function deactivateSubscription(clerkId: string): Promise<void> {
  await connectToDatabase();

  await User.findOneAndUpdate(
    { clerkId },
    {
      subscriptionStatus: "inactive",
    }
  );
}

export async function cancelSubscription(clerkId: string): Promise<void> {
  await connectToDatabase();

  await User.findOneAndUpdate(
    { clerkId },
    {
      subscriptionStatus: "canceled",
    }
  );
}
