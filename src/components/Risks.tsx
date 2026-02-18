"use client";

import {
  AlertTriangle,
  ShieldCheck,
  Target,
  Award,
  BarChart3,
  Activity,
  Users,
  Bell,
  Globe,
  Download,
} from "lucide-react";

const risks = [
  {
    risk: "Upstream provider changes pricing or shuts down",
    likelihood: "Medium",
    impact: "High",
    likelihoodColor: "text-warning",
    impactColor: "text-danger",
    mitigation:
      "Dual-provider strategy for every asset class. Abstract provider behind internal interface. Switch is a config change, not a code rewrite.",
  },
  {
    risk: '"Nobody will pay" — low conversion',
    likelihood: "Medium",
    impact: "High",
    likelihoodColor: "text-warning",
    impactColor: "text-danger",
    mitigation:
      "Generous free tier builds trust. 7-day auto-trial of Builder. Conversion endpoint and webhooks are upgrade triggers — features you can't get free anywhere.",
  },
  {
    risk: "Abuse / scraping on free tier",
    likelihood: "High",
    impact: "Medium",
    likelihoodColor: "text-danger",
    impactColor: "text-warning",
    mitigation:
      "Rate limits enforced at edge (Cloudflare). API key required for every call. Bot detection. Free tier is generous but capped.",
  },
  {
    risk: "Data accuracy issues",
    likelihood: "Low",
    impact: "High",
    likelihoodColor: "text-success",
    impactColor: "text-danger",
    mitigation:
      "Cross-validate rates between primary and fallback providers. Flag anomalies (>10% deviation). Never overwrite good data with bad data.",
  },
  {
    risk: "Scaling costs if viral",
    likelihood: "Low",
    impact: "Medium",
    likelihoodColor: "text-success",
    impactColor: "text-warning",
    mitigation:
      "95%+ cached at edge = near-zero marginal cost per user. MongoDB auto-scales. Upstash is serverless. 10x users ≠ 10x cost.",
  },
];

const kpis = {
  product: [
    { metric: "API Uptime", target: ">99.9%", icon: Activity },
    { metric: "P95 Response Time", target: "<100ms", icon: BarChart3 },
    { metric: "Cache Hit Ratio", target: ">95%", icon: ShieldCheck },
    { metric: "Data Freshness", target: "<15 min", icon: Target },
  ],
  business: [
    { metric: "Free Users (Month 12)", target: "4,000", icon: Users },
    { metric: "Paying Users", target: "300", icon: Award },
    { metric: "MRR", target: "$7,500", icon: BarChart3 },
    { metric: "Free→Paid Conversion", target: "7.5%", icon: Target },
  ],
  engagement: [
    { metric: "Avg Daily Calls/Paid User", target: ">200", icon: Activity },
    { metric: "Webhook Alerts Created", target: ">500 total", icon: Bell },
    { metric: "Widget Embeds", target: ">100 sites", icon: Globe },
    { metric: "SDK Downloads/Month", target: ">2,000", icon: Download },
  ],
};

export default function Risks() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* KPIs */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Success Metrics
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            How we measure <span className="gradient-text">success</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {Object.entries(kpis).map(([category, metrics]) => (
            <div
              key={category}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                {category === "product"
                  ? "Product Health"
                  : category === "business"
                  ? "Business Health"
                  : "Engagement"}
              </h3>
              <div className="space-y-4">
                {metrics.map((m) => (
                  <div key={m.metric} className="flex items-center gap-3">
                    <m.icon className="w-4 h-4 text-accent-light shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted">{m.metric}</div>
                      <div className="text-sm font-mono font-medium text-emerald">
                        {m.target}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Risks */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Risks & Mitigations
          </h3>
          <p className="text-muted text-sm">
            Every risk has a concrete, actionable mitigation strategy.
          </p>
        </div>

        <div className="space-y-4">
          {risks.map((r) => (
            <div
              key={r.risk}
              className="rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-2">{r.risk}</h4>
                  <div className="flex gap-4 text-xs mb-3">
                    <span>
                      Likelihood:{" "}
                      <span className={`font-medium ${r.likelihoodColor}`}>
                        {r.likelihood}
                      </span>
                    </span>
                    <span>
                      Impact:{" "}
                      <span className={`font-medium ${r.impactColor}`}>
                        {r.impact}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="sm:w-1/2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <p className="text-xs text-muted leading-relaxed">
                      {r.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
