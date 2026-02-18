"use client";

import { TrendingUp, Target, Crosshair } from "lucide-react";

const tiers = [
  {
    icon: TrendingUp,
    label: "TAM",
    title: "Total Addressable Market",
    value: "$850M",
    description:
      "Financial data API market across forex, crypto, equities, and commodities. Players include Refinitiv, Bloomberg, Polygon, Alpha Vantage, CoinGecko, Fixer, Xignite, and Twelve Data.",
    color: "text-accent-light",
    bg: "bg-accent/10",
    border: "border-accent/30",
    barWidth: "100%",
  },
  {
    icon: Target,
    label: "SAM",
    title: "Serviceable Addressable Market",
    value: "$120M/yr",
    description:
      "Developers and small teams paying $10-$500/month for financial data APIs. Estimated from public pricing pages and reported customer counts of mid-tier providers.",
    color: "text-cyan",
    bg: "bg-cyan/10",
    border: "border-cyan/30",
    barWidth: "14%",
  },
  {
    icon: Crosshair,
    label: "SOM",
    title: "Year 1 Target",
    value: "$120K ARR",
    description:
      "0.1% of SAM — ~400 paying customers at an average of $25/month. Entirely achievable through developer marketing, SEO, and community presence.",
    color: "text-emerald",
    bg: "bg-emerald/10",
    border: "border-emerald/30",
    barWidth: "1.5%",
  },
];

const projections = [
  { period: "Month 1-3", free: "200", paid: "10", mrr: "$250", cumulative: "$750" },
  { period: "Month 4-6", free: "800", paid: "40", mrr: "$1,000", cumulative: "$3,750" },
  { period: "Month 7-9", free: "2,000", paid: "120", mrr: "$3,200", cumulative: "$13,350" },
  { period: "Month 10-12", free: "4,000", paid: "300", mrr: "$7,500", cumulative: "$35,850" },
];

export default function Market() {
  return (
    <section id="market" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-accent-light text-sm font-medium uppercase tracking-widest mb-4">
            Market Opportunity
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            A <span className="gradient-text">$850M market</span> with clear
            entry points
          </h2>
          <p className="mt-5 text-muted text-lg">
            The global API monetization platform market is projected to grow from
            $732M (2025) to $2.93B by 2035 at 11.9% CAGR.
          </p>
        </div>

        {/* TAM/SAM/SOM visual */}
        <div className="grid lg:grid-cols-3 gap-6 mb-20">
          {tiers.map((t) => (
            <div
              key={t.label}
              className={`rounded-2xl border ${t.border} bg-card p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center`}
                >
                  <t.icon className={`w-5 h-5 ${t.color}`} />
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted">
                    {t.label}
                  </div>
                  <div className="text-sm font-medium">{t.title}</div>
                </div>
              </div>

              <div className={`text-4xl font-bold ${t.color} mb-4`}>
                {t.value}
              </div>

              <p className="text-sm text-muted leading-relaxed">
                {t.description}
              </p>

              {/* Visual bar */}
              <div className="mt-6 h-2 rounded-full bg-border/50">
                <div
                  className={`h-full rounded-full ${t.bg.replace("/10", "/50")}`}
                  style={{ width: t.barWidth }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Year 3 target */}
        <div className="text-center mb-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-5 rounded-2xl bg-card border border-border">
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted mb-1">Year 3 Target</div>
              <div className="text-3xl font-bold gradient-text">$600K ARR</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted mb-1">Paying Customers</div>
              <div className="text-3xl font-bold text-foreground">~2,000</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted mb-1">Position</div>
              <div className="text-sm font-medium text-emerald">
                Credible for seed funding or sustainable bootstrapping
              </div>
            </div>
          </div>
        </div>

        {/* Revenue projections table */}
        <div>
          <h3 className="text-xl font-semibold text-center mb-8">
            Year 1 Revenue Projections (Conservative)
          </h3>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted">
                      Period
                    </th>
                    <th className="text-right px-6 py-4 font-medium text-muted">
                      Free Users
                    </th>
                    <th className="text-right px-6 py-4 font-medium text-muted">
                      Paid Users
                    </th>
                    <th className="text-right px-6 py-4 font-medium text-muted">
                      MRR
                    </th>
                    <th className="text-right px-6 py-4 font-medium text-muted">
                      Cumulative
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, i) => (
                    <tr
                      key={p.period}
                      className={`border-b border-border/50 ${
                        i === projections.length - 1
                          ? "bg-success/[0.03]"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">{p.period}</td>
                      <td className="text-right px-6 py-4 text-muted font-mono">
                        {p.free}
                      </td>
                      <td className="text-right px-6 py-4 font-mono text-accent-light">
                        {p.paid}
                      </td>
                      <td className="text-right px-6 py-4 font-mono text-emerald font-medium">
                        {p.mrr}
                      </td>
                      <td className="text-right px-6 py-4 font-mono font-medium">
                        {p.cumulative}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom line */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { label: "Year 1 Revenue", value: "~$36K", color: "text-emerald" },
              { label: "Year 1 Infra Cost", value: "~$4K", color: "text-warning" },
              { label: "Year 1 Net (pre-labor)", value: "~$32K", color: "text-success" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-card border border-border p-4 text-center"
              >
                <div className="text-sm text-muted mb-1">{s.label}</div>
                <div className={`text-2xl font-bold font-mono ${s.color}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-6">
            97% gross margin on data costs. Fundable at $8K+ MRR. This is a
            viable bootstrapped capstone that becomes investable.
          </p>
        </div>
      </div>
    </section>
  );
}
