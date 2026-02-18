"use client";

import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Sandbox",
    price: "$0",
    period: "forever",
    description: "Generous free tier to build and ship real products.",
    cta: "Start Building",
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
    name: "Builder",
    price: "$19",
    period: "/month",
    annual: "$182/yr (save 20%)",
    description: "For indie developers and early-stage startups.",
    cta: "Start Free Trial",
    highlight: false,
    features: [
      "10,000 API calls/day",
      "15-min delayed data",
      "1-year history depth",
      "5 webhook alerts",
      "3 API keys",
      "Conversion engine",
      "Email support",
    ],
  },
  {
    name: "Scale",
    price: "$49",
    period: "/month",
    annual: "$470/yr (save 20%)",
    description: "For SaaS platforms and growing teams.",
    cta: "Start Free Trial",
    highlight: true,
    features: [
      "100,000 API calls/day",
      "15-min delayed data",
      "5-year history depth",
      "50 webhook alerts",
      "Conversion engine",
      "Embeddable widgets",
      "10 API keys",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/month",
    annual: "$1,430/yr (save 20%)",
    description: "For agencies and teams building at scale.",
    cta: "Contact Sales",
    highlight: false,
    features: [
      "Unlimited API calls",
      "Full history depth",
      "Unlimited webhook alerts",
      "99.9% uptime SLA",
      "Custom asset lists",
      "Unlimited API keys",
      "Team workspace + SSO",
      "Dedicated Slack support",
      "White-label widgets",
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 flex flex-col ${
                p.highlight
                  ? "border-2 border-accent bg-accent/[0.04] relative"
                  : "border border-border bg-card"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted">{p.period}</span>
                </div>
                {p.annual && (
                  <div className="text-xs text-emerald mt-1">{p.annual}</div>
                )}
                <p className="text-sm text-muted mt-3">{p.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
                  p.highlight
                    ? "bg-accent hover:bg-accent-dark text-white"
                    : "bg-card border border-border hover:border-muted/50 text-foreground"
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Unit economics callout */}
        <div className="mt-16 rounded-2xl bg-card border border-border p-8">
          <h3 className="text-lg font-semibold mb-6 text-center">
            Why These Prices Work — Unit Economics
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Upstream Data Cost",
                value: "~$180/mo",
                detail: "Fixed — doesn't scale with users",
              },
              {
                label: "Break-even",
                value: "4 Scale customers",
                detail: "Cover all upstream data costs",
              },
              {
                label: "Gross Margin at 200 Users",
                value: "97%",
                detail: "$6K MRR with ~$180 COGS",
              },
              {
                label: "Marginal Cost Per User",
                value: "~$0",
                detail: "95%+ cached at edge",
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
