// Dashboard Home - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { ApiKey } from "@/lib/db/models/api-key";
import { StatsCard } from "@/components/dashboard/stats-card";

async function getDashboardData(userId: string) {
  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return { apiCalls: 0, activeKeys: 0, subscriptionStatus: "inactive" };
  }

  const activeKeys = await ApiKey.countDocuments({
    userId: user._id,
    revokedAt: null,
  });

  // TODO: Get actual usage from Usage model when implemented
  const apiCalls = 0;

  return {
    apiCalls,
    activeKeys,
    subscriptionStatus: user.subscriptionStatus,
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await getDashboardData(userId);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="API Calls This Month"
          value={data.apiCalls.toLocaleString()}
          description="Unlimited on Pro plan"
        />
        <StatsCard
          title="Active API Keys"
          value={data.activeKeys}
        />
        <StatsCard
          title="Subscription Status"
          value={data.subscriptionStatus === "active" ? "Active" : "Inactive"}
          variant={data.subscriptionStatus === "active" ? "success" : "warning"}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a
            href="/dashboard/api-keys"
            className="border border-border rounded-lg p-4 hover:bg-secondary transition-colors"
          >
            <h3 className="font-medium">Manage API Keys</h3>
            <p className="text-sm text-muted-foreground">Create or revoke keys</p>
          </a>
          <a
            href="/dashboard/docs"
            className="border border-border rounded-lg p-4 hover:bg-secondary transition-colors"
          >
            <h3 className="font-medium">View Documentation</h3>
            <p className="text-sm text-muted-foreground">Learn how to use the API</p>
          </a>
        </div>
      </div>
    </div>
  );
}
