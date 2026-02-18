"use client";

import { X, Check, ArrowDown } from "lucide-react";

const oldStack = [
  { name: "Alpha Vantage", price: "$49/mo", asset: "Stocks" },
  { name: "CoinGecko Pro", price: "$129/mo", asset: "Crypto" },
  { name: "Fixer.io", price: "$60/mo", asset: "Forex" },
  { name: "Metals-API", price: "$60/mo", asset: "Metals" },
  { name: "Custom Glue Code", price: "2-4 weeks", asset: "Normalization" },
];

const problems = [
  "5 different API keys to manage",
  "5 different JSON response schemas",
  "5 different rate limit strategies",
  "5 different billing dashboards",
  "800+ lines of normalization boilerplate",
  "2-4 weeks of integration engineering",
  "$150-$500/month in overlapping subscriptions",
];

export default function Problem() {
  return (
    <section id="problem" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Financial data is{" "}
            <span className="text-danger">fragmented</span> by design
          </h2>
          <p className="mt-5 text-muted text-lg leading-relaxed">
            Building a multi-asset app today means signing up for 3-5 separate
            providers, managing 3-5 API keys, normalizing 3-5 different schemas,
            and handling 3-5 different rate limits. That integration tax is
            crushing.
          </p>
        </div>

        {/* Before / After comparison */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* BEFORE */}
          <div className="rounded-2xl border border-danger/20 bg-danger/[0.03] p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                <X className="w-4 h-4 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-danger">
                Your current stack
              </h3>
            </div>

            <div className="space-y-3 mb-8">
              {oldStack.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-border/50"
                >
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted">{s.asset}</div>
                  </div>
                  <div className="text-sm font-mono text-danger">
                    {s.price}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {problems.map((p) => (
                <div key={p} className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <span className="text-muted">{p}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-danger/20 flex items-center justify-between">
              <span className="text-sm text-muted">Total cost</span>
              <span className="text-xl font-bold text-danger">
                $298+/mo + 4 weeks
              </span>
            </div>
          </div>

          {/* AFTER */}
          <div className="rounded-2xl border border-success/20 bg-success/[0.03] p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-success">
                With VaultLine
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-black/30 border border-success/20 mb-8 animate-pulse-glow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold">VaultLine API</div>
                  <div className="text-sm text-muted">
                    Fiat + Crypto + Stocks + Metals
                  </div>
                </div>
                <div className="text-lg font-mono text-success font-bold">
                  $19/mo
                </div>
              </div>
              <div className="text-xs font-mono text-muted bg-black/50 rounded-md p-2">
                Authorization: Bearer vl_live_sk_a1b2c3d4...
              </div>
            </div>

            <div className="space-y-2">
              {[
                "1 API key for everything",
                "1 unified JSON schema across all assets",
                "1 simple rate limit strategy",
                "1 billing dashboard",
                "0 lines of normalization code",
                "Integration in under 1 hour",
                "Cross-asset conversion engine included",
              ].map((b) => (
                <div key={b} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span className="text-muted">{b}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-success/20 flex items-center justify-between">
              <span className="text-sm text-muted">Total cost</span>
              <span className="text-xl font-bold text-success">
                $19/mo + 1 hour
              </span>
            </div>
          </div>
        </div>

        {/* Arrow transition */}
        <div className="flex justify-center mt-12">
          <div className="flex flex-col items-center gap-2 text-muted">
            <ArrowDown className="w-5 h-5 animate-bounce" />
            <span className="text-sm">See it in action</span>
          </div>
        </div>
      </div>
    </section>
  );
}
