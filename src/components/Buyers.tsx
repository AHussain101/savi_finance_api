"use client";

import {
  Rocket,
  Building2,
  Palette,
  Lightbulb,
  Wrench,
  DollarSign,
  Users,
  ArrowRight,
} from "lucide-react";

const buyers = [
  {
    icon: Rocket,
    color: "text-cyan",
    bg: "bg-cyan/10",
    title: "The Fintech MVP Builder",
    who: "Solo dev or 2-person team building a crypto portfolio tracker, multi-currency expense app, or stock screener.",
    pain: "Hits Alpha Vantage's 25-call/day free wall in 10 minutes. Signs up for 4 separate APIs. Writes ~800 lines of normalization boilerplate.",
    buys: "Builder plan ($19/mo)",
    saves: "Replaces $80-$150/mo of fragmented subscriptions and saves 2 weeks of integration.",
    tam: "~180,000 developers",
  },
  {
    icon: Building2,
    color: "text-emerald",
    bg: "bg-emerald/10",
    title: "The SaaS Platform",
    who: "B2B invoicing tool, SaaS pricing localizer, or cross-border payment dashboard needing live exchange rates.",
    pain: "Paying $49-$99/mo for a forex-only API. Can't serve crypto or commodity rates when a customer asks. Every new asset = new vendor.",
    buys: "Scale plan ($49/mo)",
    saves: "The embeddable widget saves their frontend team a full sprint. White-label ready.",
    tam: "~45,000 SaaS products",
  },
  {
    icon: Palette,
    color: "text-accent-light",
    bg: "bg-accent/10",
    title: "The Dev Agency",
    who: "5-15 person agency building client dashboards. ~30% of projects involve financial data.",
    pain: "Every client project reinvents the wheel. No reusable financial data layer in their toolkit.",
    buys: "Enterprise ($149/mo)",
    saves: "One subscription shared across all client projects. Unique API key per client for clean separation.",
    tam: "~12,000 agencies",
  },
  {
    icon: Lightbulb,
    color: "text-amber",
    bg: "bg-amber/10",
    title: "The Indie Hacker",
    who: "Building a crypto converter tool, Twitter bot, Notion integration, or newsletter with embedded rate data.",
    pain: "Wants the data, not the infrastructure. Free tiers elsewhere are either crippled or single-asset.",
    buys: "Sandbox (free, 1,000 calls/day)",
    saves: "Generous enough to build and ship. When their bot goes viral, upgrade is a no-brainer with zero rewrites.",
    tam: "~500,000 indie devs",
  },
  {
    icon: Wrench,
    color: "text-danger",
    bg: "bg-danger/10",
    title: "The Internal Tool Builder",
    who: "Engineer at a Series A-C startup building an admin panel, payment reconciliation dashboard, or FX exposure report.",
    pain: "Submits procurement for 3 APIs. Finance asks why there are 3 vendors for 'exchange rates.' Internal tool takes 3 weeks instead of 3 days.",
    buys: "Scale plan ($49/mo)",
    saves: "One vendor, one invoice, one PO. Ships the internal tool in 2 days.",
    tam: "~200,000 companies",
  },
];

export default function Buyers() {
  return (
    <section id="buyers" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Who Pays & Why
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Five buyers.{" "}
            <span className="gradient-text">Real dollar amounts.</span>
          </h2>
          <p className="mt-5 text-muted text-lg leading-relaxed">
            &ldquo;No one would buy this&rdquo; dies when you name the buyers.
            Here are five, with exactly what they pay and why they stay.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buyers.map((b, i) => (
            <div
              key={b.title}
              className={`group rounded-2xl border border-border bg-card hover:bg-card-hover transition-all p-6 ${
                i === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center`}
                >
                  <b.icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <h3 className="font-semibold text-lg">{b.title}</h3>
              </div>

              <p className="text-sm text-muted leading-relaxed mb-4">
                <span className="text-foreground font-medium">Who: </span>
                {b.who}
              </p>

              <p className="text-sm text-muted leading-relaxed mb-4">
                <span className="text-danger font-medium">Pain: </span>
                {b.pain}
              </p>

              <div className="rounded-lg bg-success/5 border border-success/20 p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-success" />
                  <span className="text-sm font-medium text-success">
                    {b.buys}
                  </span>
                </div>
                <p className="text-xs text-muted">{b.saves}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <Users className="w-3.5 h-3.5" />
                <span>TAM: {b.tam}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total TAM callout */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-accent/5 border border-accent/20">
            <span className="text-muted text-sm">
              Combined addressable developers:
            </span>
            <span className="text-2xl font-bold gradient-text">937,000+</span>
            <ArrowRight className="w-4 h-4 text-accent-light" />
            <a
              href="#market"
              className="text-sm text-accent-light hover:underline"
            >
              See full market analysis
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
