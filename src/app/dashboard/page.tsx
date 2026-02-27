"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Key, CreditCard, History, Zap, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton, LoadingScreen } from "@/components/ui";

interface KeysData {
  count: number;
  limit: number;
}

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";

  const [keys, setKeys] = useState<KeysData | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Compute usage based on plan (no API call for now)
  const usage = useMemo(() => {
    const limit = user?.plan === "standard" ? -1 : 1000;
    return { count: 0, limit };
  }, [user?.plan]);

  useEffect(() => {
    const plan = user?.plan;

    // Fetch API keys count
    fetch("/api/keys")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const limit = plan === "standard" ? 2 : 1;
          setKeys({ count: data.length, limit });
        }
      })
      .catch(console.error)
      .finally(() => setLoadingKeys(false));
  }, [user?.plan]);

  const historyDays = user?.plan === "standard" ? 90 : 30;
  const isStandard = user?.plan === "standard";

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {upgraded && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <div className="p-2 rounded-full bg-emerald-500/20">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-emerald-500">
              Welcome to Standard!
            </p>
            <p className="text-sm text-muted">
              Your 7-day free trial has begun. Enjoy unlimited API calls and 90 days of history.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted mt-1">
          Welcome back! Here&apos;s an overview of your account.
        </p>
      </div>

      {/* Plan badge */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Current Plan</span>
                <Badge variant={isStandard ? "accent" : "default"}>
                  {isStandard ? "Standard" : "Sandbox"}
                </Badge>
              </div>
              <p className="text-sm text-muted mt-0.5">
                {isStandard
                  ? "Unlimited API calls, 90 days history"
                  : "1,000 calls/day, 30 days history"}
              </p>
            </div>
          </div>
          {!isStandard && (
            <Link href="/dashboard/billing">
              <Button size="sm">Upgrade</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <Zap className="w-4 h-4" />
              API Calls Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              {usage.limit === -1 ? (
                <div className="text-3xl font-bold">Unlimited</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {usage.count.toLocaleString()}
                    <span className="text-lg font-normal text-muted">
                      {" "}/ {usage.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min((usage.count / usage.limit) * 100, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingKeys ? (
              <Skeleton className="h-8 w-24" />
            ) : keys ? (
              <div>
                <div className="text-3xl font-bold">
                  {keys.count}
                  <span className="text-lg font-normal text-muted">
                    {" "}/ {keys.limit}
                  </span>
                </div>
                <Link
                  href="/dashboard/keys"
                  className="text-sm text-accent hover:underline mt-2 inline-block"
                >
                  Manage keys
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <History className="w-4 h-4" />
              History Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {historyDays}
              <span className="text-lg font-normal text-muted"> days</span>
            </div>
            <p className="text-sm text-muted mt-2">
              Access historical rate data up to {historyDays} days back
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Link href="/dashboard/keys">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Key className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Manage API Keys</h3>
                <p className="text-sm text-muted">Create, view, and revoke your API keys</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Billing & Subscription</h3>
                <p className="text-sm text-muted">
                  {isStandard ? "Manage your subscription" : "Upgrade to Standard"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
