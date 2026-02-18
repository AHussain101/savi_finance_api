"use client";

import { useState } from "react";
import { Play, Copy, Check, ArrowRightLeft } from "lucide-react";

const endpoints = [
  {
    id: "rates",
    label: "GET /v1/rates",
    description: "The unified endpoint — works for any pair across all asset classes",
    request: `GET /v1/rates?from=BTC&to=EUR
Authorization: Bearer vl_live_sk_demo...`,
    response: `{
  "ok": true,
  "data": {
    "from": { "symbol": "BTC", "name": "Bitcoin", "type": "crypto" },
    "to": { "symbol": "EUR", "name": "Euro", "type": "fiat" },
    "rate": 94230.45,
    "inverse_rate": 0.00001061,
    "change_24h": -1.23,
    "change_24h_pct": -0.0013,
    "as_of": "2026-02-17T14:15:00Z"
  },
  "meta": {
    "request_id": "req_7f3a2b1c",
    "cached": true,
    "tier": "builder",
    "rate_limit": { "remaining": 8420, "daily_limit": 10000 }
  }
}`,
  },
  {
    id: "convert",
    label: "GET /v1/convert",
    description: "Cross-asset conversion — try something no other API can do",
    request: `GET /v1/convert?from=BTC&to=XAU&amount=0.5
Authorization: Bearer vl_live_sk_demo...`,
    response: `{
  "ok": true,
  "data": {
    "from": "BTC",
    "to": "XAU",
    "amount_in": 0.5,
    "amount_out": 26.83,
    "rate_used": 53.66,
    "rate_as_of": "2026-02-17T14:15:00Z",
    "human_readable": "0.5 BTC = 26.83 troy ounces of Gold"
  }
}`,
  },
  {
    id: "batch",
    label: "POST /v1/batch",
    description: "Batch lookup — up to 25 pairs in a single request (counts as 1 call)",
    request: `POST /v1/batch
Authorization: Bearer vl_live_sk_demo...

{
  "pairs": [
    { "from": "USD", "to": "EUR" },
    { "from": "BTC", "to": "USD" },
    { "from": "AAPL", "to": "USD" },
    { "from": "XAU", "to": "GBP" }
  ]
}`,
    response: `{
  "ok": true,
  "data": {
    "results": [
      { "from": "USD", "to": "EUR", "rate": 0.9423, "as_of": "..." },
      { "from": "BTC", "to": "USD", "rate": 98450.00, "as_of": "..." },
      { "from": "AAPL", "to": "USD", "rate": 242.30, "as_of": "..." },
      { "from": "XAU", "to": "GBP", "rate": 1587.20, "as_of": "..." }
    ],
    "count": 4
  }
}`,
  },
  {
    id: "alerts",
    label: "POST /v1/alerts",
    description: "Webhook alerts — push notifications when rates cross thresholds",
    request: `POST /v1/alerts
Authorization: Bearer vl_live_sk_demo...

{
  "pair": { "from": "BTC", "to": "USD" },
  "condition": "crosses_above",
  "threshold": 100000,
  "webhook_url": "https://myapp.com/hooks/vl",
  "channels": ["webhook", "email"]
}`,
    response: `{
  "ok": true,
  "data": {
    "alert_id": "alt_abc123",
    "pair": "BTC/USD",
    "condition": "crosses_above",
    "threshold": 100000,
    "state": "active",
    "webhook_url": "https://myapp.com/hooks/vl",
    "channels": ["webhook", "email"],
    "created_at": "2026-02-17T14:30:00Z"
  }
}`,
  },
];

const codeExamples: Record<string, string> = {
  JavaScript: `import { VaultLine } from '@vaultline/sdk';

const vl = new VaultLine('vl_live_sk_...');

// Get any rate — fiat, crypto, stocks, metals
const rate = await vl.rates.get({ from: 'BTC', to: 'EUR' });
console.log(rate.data.rate); // 94230.45

// Cross-asset conversion
const gold = await vl.convert({
  from: 'BTC', to: 'XAU', amount: 0.5
});
console.log(gold.data.human_readable);
// "0.5 BTC = 26.83 troy ounces of Gold"`,
  Python: `from vaultline import VaultLine

vl = VaultLine("vl_live_sk_...")

# Get any rate — fiat, crypto, stocks, metals
rate = vl.rates.get(from_="BTC", to="EUR")
print(rate.data.rate)  # 94230.45

# Cross-asset conversion
gold = vl.convert(from_="BTC", to="XAU", amount=0.5)
print(gold.data.human_readable)
# "0.5 BTC = 26.83 troy ounces of Gold"`,
  cURL: `# Get any rate
curl "https://api.vaultline.dev/v1/rates?from=BTC&to=EUR" \\
  -H "Authorization: Bearer vl_live_sk_..."

# Cross-asset conversion
curl "https://api.vaultline.dev/v1/convert\\
?from=BTC&to=XAU&amount=0.5" \\
  -H "Authorization: Bearer vl_live_sk_..."`,
  Go: `package main

import "github.com/vaultline/vaultline-go"

func main() {
    vl := vaultline.New("vl_live_sk_...")

    // Get any rate
    rate, _ := vl.Rates.Get("BTC", "EUR")
    fmt.Println(rate.Data.Rate) // 94230.45

    // Cross-asset conversion
    gold, _ := vl.Convert("BTC", "XAU", 0.5)
    fmt.Println(gold.Data.HumanReadable)
    // "0.5 BTC = 26.83 troy ounces of Gold"
}`,
};

export default function ApiDemo() {
  const [active, setActive] = useState("rates");
  const [lang, setLang] = useState("JavaScript");
  const [copied, setCopied] = useState<string | null>(null);

  const ep = endpoints.find((e) => e.id === active)!;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="api-demo" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Live API Preview
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            One endpoint.{" "}
            <span className="gradient-text">Every asset class.</span>
          </h2>
          <p className="mt-5 text-muted text-lg">
            Auto-detects asset types from symbols. BTC→EUR, AAPL→GBP, XAU→JPY
            — all the same endpoint, all the same schema.
          </p>
        </div>

        {/* Endpoint tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {endpoints.map((e) => (
            <button
              key={e.id}
              onClick={() => setActive(e.id)}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition ${
                active === e.id
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-muted/50"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted mb-8">{ep.description}</p>

        {/* Request / Response panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Request */}
          <div className="code-block overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Play className="w-3.5 h-3.5 text-success" />
                <span className="font-medium">Request</span>
              </div>
              <button
                onClick={() => copy(ep.request, "req")}
                className="text-muted hover:text-foreground transition"
              >
                {copied === "req" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
              <code className="text-emerald">{ep.request}</code>
            </pre>
          </div>

          {/* Response */}
          <div className="code-block overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan" />
                <span className="font-medium">Response</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                  200 OK
                </span>
              </div>
              <button
                onClick={() => copy(ep.response, "res")}
                className="text-muted hover:text-foreground transition"
              >
                {copied === "res" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
              <code className="text-amber/90">{ep.response}</code>
            </pre>
          </div>
        </div>

        {/* SDK Code examples */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-center mb-8">
            3 lines of code. Any language.
          </h3>

          <div className="flex justify-center gap-2 mb-6">
            {Object.keys(codeExamples).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-md text-sm transition ${
                  lang === l
                    ? "bg-card border border-accent/40 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto code-block overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm font-medium">{lang}</span>
              <button
                onClick={() => copy(codeExamples[lang], "sdk")}
                className="text-muted hover:text-foreground transition"
              >
                {copied === "sdk" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="p-4 text-sm leading-relaxed overflow-x-auto">
              <code className="text-accent-light/90">
                {codeExamples[lang]}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
