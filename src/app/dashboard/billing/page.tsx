"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, CreditCard, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  LoadingScreen,
} from "@/components/ui";

interface Subscription {
  plan: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  isTrialing: boolean;
}

const sandboxFeatures = [
  "1,000 API calls/day",
  "EOD data (24hr delayed)",
  "4 asset classes",
  "30 days history",
  "1 API key",
  "Community support",
];

const standardFeatures = [
  "Unlimited API calls",
  "EOD data (24hr delayed)",
  "4 asset classes",
  "90 days history",
  "2 API keys",
  "Email support",
];

export default function BillingPage() {
  useAuth(); // Ensure user is authenticated
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/billing/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkoutUrl;
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start checkout");
      }
    } catch {
      alert("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.portalUrl;
      } else {
        const error = await res.json();
        alert(error.error || "Failed to open billing portal");
      }
    } catch {
      alert("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading billing information..." />;
  }

  const isStandard = subscription?.plan === "standard";
  const isSandbox = !isStandard;
  const isTrialing = subscription?.isTrialing;
  const isPastDue = subscription?.status === "past_due";
  const isCanceled = subscription?.status === "canceled" && isStandard;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Status banners */}
      {isPastDue && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="font-medium text-red-500">Payment failed</p>
            <p className="text-sm text-muted">
              Please update your payment method to continue using Standard features.
            </p>
          </div>
          <Button size="sm" onClick={handleManageSubscription} loading={portalLoading}>
            Update Payment
          </Button>
        </div>
      )}

      {isTrialing && subscription?.trialEndsAt && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent" />
          <div>
            <p className="font-medium text-accent">Free trial active</p>
            <p className="text-sm text-muted">
              Your trial ends on{" "}
              {new Date(subscription.trialEndsAt).toLocaleDateString()}. You
              won&apos;t be charged until then.
            </p>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-500">
              Subscription ended
            </p>
            <p className="text-sm text-muted">
              Your Standard subscription has ended. You&apos;re now on the Sandbox
              plan.
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant={isStandard && !isCanceled ? "accent" : "default"}>
                  {isStandard && !isCanceled ? "Standard" : "Sandbox"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isStandard && !isCanceled
                  ? subscription?.billingInterval === "year"
                    ? "$96/year"
                    : "$10/month"
                  : "Free forever"}
              </CardDescription>
            </div>
            {isStandard && !isCanceled && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                loading={portalLoading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-3">
            {(isStandard && !isCanceled ? standardFeatures : sandboxFeatures).map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-muted">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Upgrade section (only for Sandbox users) */}
      {(isSandbox || isCanceled) && (
        <Card className="border-accent/50 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Upgrade to Standard
            </CardTitle>
            <CardDescription>
              Unlock unlimited API calls and 90 days of history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4 p-1 rounded-lg bg-muted/10 max-w-xs mx-auto">
              <button
                onClick={() => setBillingInterval("month")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "month"
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "year"
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1 text-xs text-emerald-400">Save 20%</span>
              </button>
            </div>

            {/* Price display */}
            <div className="text-center">
              <div className="text-4xl font-bold">
                {billingInterval === "year" ? "$96" : "$10"}
                <span className="text-lg font-normal text-muted">
                  /{billingInterval === "year" ? "year" : "month"}
                </span>
              </div>
              <p className="text-sm text-muted mt-2">
                Start with a 7-day free trial. Cancel anytime.
              </p>
            </div>

            {/* Features list */}
            <ul className="grid sm:grid-cols-2 gap-3">
              {standardFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              size="lg"
              onClick={handleUpgrade}
              loading={checkoutLoading}
            >
              Start Free Trial
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing details for Standard users */}
      {isStandard && !isCanceled && subscription?.currentPeriodEnd && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted">Billing period</span>
              <span className="font-medium">
                {subscription.billingInterval === "year" ? "Yearly" : "Monthly"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Next billing date</span>
              <span className="font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Amount</span>
              <span className="font-medium">
                {subscription.billingInterval === "year" ? "$96.00" : "$10.00"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
