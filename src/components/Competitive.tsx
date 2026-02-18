"use client";

import { Check, X, Minus } from "lucide-react";

const competitors = [
  {
    name: "Alpha Vantage",
    covers: "Stocks, Forex, Crypto",
    price: "$49/mo",
    crossAsset: "partial",
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Free tier is 25 calls/day. We offer 1,000.",
  },
  {
    name: "Polygon",
    covers: "Stocks, Options, Forex, Crypto",
    price: "$29-$199/mo",
    crossAsset: "partial",
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Built for traders, not app developers. Complex WebSocket-first API.",
  },
  {
    name: "Twelve Data",
    covers: "Stocks, ETFs, Forex, Crypto",
    price: "$29-$99/mo",
    crossAsset: "partial",
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Strong, but no metals. No conversion. No alerts.",
  },
  {
    name: "CoinGecko",
    covers: "Crypto only",
    price: "Free-$129/mo",
    crossAsset: false,
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Crypto-only. Forces you to add another vendor for fiat.",
  },
  {
    name: "Fixer.io",
    covers: "Forex only",
    price: "$10-$60/mo",
    crossAsset: false,
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Breaks the moment you need BTC or stocks.",
  },
  {
    name: "Metals-API",
    covers: "Metals only",
    price: "$14-$60/mo",
    crossAsset: false,
    webhooks: false,
    conversion: false,
    unified: false,
    angle: "Single asset class. Niche.",
  },
];

const moats = [
  {
    title: "Schema Normalization",
    description:
      "Every response, regardless of asset class, has the same shape. This is the \"Stripe moment\" — Stripe won because the API was better, not because payments were novel.",
  },
  {
    title: "Cross-Asset Conversion",
    description:
      "No competitor offers GET /convert?from=BTC&to=XAU&amount=0.5. This is uniquely useful and non-trivial to implement well.",
  },
  {
    title: "Webhook Alerts",
    description:
      "Push > Poll. Developers building notifications currently build custom polling + cron + comparison logic. We eliminate that entire stack.",
  },
  {
    title: "Developer Experience",
    description:
      "Interactive playground, SDKs in 5 languages, copy-paste quickstart, and a generous free tier. This is how you build a developer community moat.",
  },
  {
    title: "Switching Cost",
    description:
      "Once our SDK is in a codebase, replacing it means rewriting every data call. Schema normalization creates stickiness.",
  },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="w-4 h-4 text-success mx-auto" />;
  if (value === "partial")
    return <Minus className="w-4 h-4 text-warning mx-auto" />;
  return <X className="w-4 h-4 text-danger/50 mx-auto" />;
}

export default function Competitive() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Competitive Landscape
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            &ldquo;Why not just use X?&rdquo;
          </h2>
          <p className="mt-5 text-muted text-lg">
            Our advantage isn&apos;t the data — it&apos;s largely commoditized.
            Our moat is the abstraction layer: one key, one schema, one bill.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-border overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left px-5 py-4 font-medium text-muted min-w-[140px]">
                    Provider
                  </th>
                  <th className="text-left px-5 py-4 font-medium text-muted min-w-[160px]">
                    Covers
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-muted">
                    Price
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-muted">
                    Cross-Asset
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-muted">
                    Webhooks
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-muted">
                    Conversion
                  </th>
                  <th className="text-center px-5 py-4 font-medium text-muted">
                    Unified Schema
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr
                    key={c.name}
                    className="border-b border-border/50 hover:bg-card-hover/50 transition"
                  >
                    <td className="px-5 py-4 font-medium">{c.name}</td>
                    <td className="px-5 py-4 text-muted text-xs">{c.covers}</td>
                    <td className="px-5 py-4 text-center font-mono text-xs">
                      {c.price}
                    </td>
                    <td className="px-5 py-4">
                      <FeatureIcon value={c.crossAsset} />
                    </td>
                    <td className="px-5 py-4">
                      <FeatureIcon value={c.webhooks} />
                    </td>
                    <td className="px-5 py-4">
                      <FeatureIcon value={c.conversion} />
                    </td>
                    <td className="px-5 py-4">
                      <FeatureIcon value={c.unified} />
                    </td>
                  </tr>
                ))}
                {/* VaultLine row */}
                <tr className="bg-accent/[0.06] border-t-2 border-accent/30">
                  <td className="px-5 py-4 font-bold text-accent-light">
                    VaultLine
                  </td>
                  <td className="px-5 py-4 text-xs font-medium">
                    Stocks, Forex, Crypto, Metals, Commodities
                  </td>
                  <td className="px-5 py-4 text-center font-mono text-xs font-medium text-success">
                    $0-$149/mo
                  </td>
                  <td className="px-5 py-4">
                    <Check className="w-4 h-4 text-success mx-auto" />
                  </td>
                  <td className="px-5 py-4">
                    <Check className="w-4 h-4 text-success mx-auto" />
                  </td>
                  <td className="px-5 py-4">
                    <Check className="w-4 h-4 text-success mx-auto" />
                  </td>
                  <td className="px-5 py-4">
                    <Check className="w-4 h-4 text-success mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Moats */}
        <h3 className="text-xl font-semibold text-center mb-8">
          The Moat — Why We Win
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moats.map((m, i) => (
            <div
              key={m.title}
              className={`rounded-xl bg-card border border-border p-5 ${
                i >= 3 ? "lg:col-span-1 sm:col-span-1" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent-light font-mono text-xs">
                  0{i + 1}
                </span>
                <h4 className="font-semibold text-sm">{m.title}</h4>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
