"use client";

import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Sandbox",
    price: "$0",
    period: "forever",
    description: "Generous free tier to build and ship real products.",
    cta: "Start Building",
    href: "/auth/register",
    highlight: false,
    features: [
      "1,000 API calls/day",
      "EOD data (24hr delayed)",
      "4 asset classes",
      "30 days history",
      "1 API key",
      "Community support",
    ],
  },
  {
    name: "Standard",
    price: "$10",
    period: "/month",
    annual: "$96/yr (save 20%)",
    description: "Unlimited access for hobbyists and side projects.",
    cta: "Start Free Trial",
    href: "/auth/register?plan=standard",
    highlight: true,
    features: [
      "Unlimited API calls",
      "EOD data (24hr delayed)",
      "4 asset classes",
      "90 days history",
      "2 API keys",
      "Email support",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Simple Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            One bill. <span className="gradient-text">No surprises.</span>
          </h2>
          <p className="mt-5 text-muted text-lg">
            Hard caps, no overage charges — ever. Start free, upgrade when you
            grow. No credit card required for Sandbox.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-8 flex flex-col ${
                p.highlight
                  ? "border-2 border-accent bg-accent/[0.04] relative"
                  : "border border-border bg-card"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-accent text-white text-xs font-medium">
                  7-Day Free Trial
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{p.price}</span>
                  <span className="text-muted">{p.period}</span>
                </div>
                {p.annual && (
                  <div className="text-sm text-emerald mt-2">{p.annual}</div>
                )}
                <p className="text-muted mt-4">{p.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                className={`w-full py-3 rounded-lg font-medium transition text-center block ${
                  p.highlight
                    ? "bg-accent hover:bg-accent-dark text-white"
                    : "bg-card border border-border hover:border-muted/50 text-foreground"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Value proposition callout */}
        <div className="mt-16 rounded-2xl bg-card border border-border p-8">
          <h3 className="text-lg font-semibold mb-6 text-center">
            Start Free, Pay When You Grow
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                label: "No Credit Card",
                value: "Free Forever",
                detail: "Sandbox tier with 1,000 calls/day",
              },
              {
                label: "7-Day Trial",
                value: "Full Access",
                detail: "Try Standard free, cancel anytime",
              },
              {
                label: "Simple Pricing",
                value: "No Overages",
                detail: "Hard caps, never a surprise bill",
              },
            ].map((e) => (
              <div key={e.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {e.value}
                </div>
                <div className="text-sm font-medium mt-1">{e.label}</div>
                <div className="text-xs text-muted mt-1">{e.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
