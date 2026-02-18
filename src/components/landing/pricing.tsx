import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const includedFeatures = [
  "Unlimited API calls",
  "All 4 data types included",
  "Daily EOD updates",
  "99.9% uptime SLA",
  "Email support",
  "API key management",
];

export function Pricing() {
  return (
    <section className="py-20 px-4" id="pricing">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          One plan. Everything included. No surprises.
        </p>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">FinFlux Pro</CardTitle>
            <CardDescription>Everything you need for production</CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/sign-up" className="w-full">
              <Button className="w-full" size="lg">
                Start Free Trial
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
