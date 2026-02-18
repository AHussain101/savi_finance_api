"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BillingClientProps {
  isActive: boolean;
  hasStripeCustomer: boolean;
}

export function BillingClient({ isActive, hasStripeCustomer }: BillingClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.error?.message || "Failed to open billing portal");
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      alert("Failed to open billing portal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    // TODO: Implement checkout session creation
    alert("Checkout flow coming soon!");
  };

  if (!isActive && !hasStripeCustomer) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Subscribe to FinFlux Pro to get unlimited API access.
        </p>
        <Button onClick={handleSubscribe}>
          Subscribe Now - $10/month
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={handleManageBilling}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Manage Billing"}
    </Button>
  );
}
