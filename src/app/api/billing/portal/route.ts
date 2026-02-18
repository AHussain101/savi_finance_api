// Billing Portal Redirect - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { requireAuth } from "@/lib/auth/clerk";
import { createBillingPortalSession } from "@/lib/billing/stripe";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";

export async function POST() {
  try {
    const userId = await requireAuth();

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return Response.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return Response.json(
        {
          success: false,
          error: {
            code: "NO_SUBSCRIPTION",
            message: "No active subscription found. Please subscribe first.",
          },
        },
        { status: 400 }
      );
    }

    const session = await createBillingPortalSession(user.stripeCustomerId);

    return Response.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    console.error("Billing portal error:", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create portal session" } },
      { status: 500 }
    );
  }
}
