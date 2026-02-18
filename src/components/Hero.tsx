"use client";

import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  DollarSign,
  Bitcoin,
  TrendingUp,
  Gem,
} from "lucide-react";

const ticker = [
  { from: "BTC", to: "USD", rate: "98,450.00", change: "+2.3%", up: true },
  { from: "EUR", to: "USD", rate: "0.9423", change: "-0.1%", up: false },
  { from: "XAU", to: "USD", rate: "1,842.50", change: "+0.8%", up: true },
  { from: "AAPL", to: "USD", rate: "242.30", change: "+1.1%", up: true },
  { from: "ETH", to: "USD", rate: "3,240.15", change: "+3.7%", up: true },
  { from: "GBP", to: "USD", rate: "1.2634", change: "+0.2%", up: true },
  { from: "XAG", to: "USD", rate: "23.45", change: "-0.4%", up: false },
  { from: "SOL", to: "USD", rate: "148.20", change: "+5.2%", up: true },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden grid-bg">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Ticker bar */}
      <div className="absolute top-16 left-0 right-0 border-b border-border/50 bg-black/30 backdrop-blur-sm overflow-hidden">
        <div className="flex animate-ticker">
          {[...ticker, ...ticker].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-2 whitespace-nowrap text-xs"
            >
              <span className="font-mono font-medium text-foreground">
                {t.from}/{t.to}
              </span>
              <span className="font-mono text-muted">{t.rate}</span>
              <span
                className={`font-mono ${t.up ? "text-success" : "text-danger"}`}
              >
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent-light text-sm mb-8">
            <Zap className="w-3.5 h-3.5" />
            The Financial Data Infrastructure Layer
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl">
            One API for every{" "}
            <span className="gradient-text">financial rate</span> on Earth.
          </h1>

          {/* Subhead */}
          <p className="animate-fade-up delay-200 mt-6 text-lg sm:text-xl text-muted max-w-2xl leading-relaxed">
            Fiat. Crypto. Stocks. Metals.{" "}
            <span className="text-foreground font-medium">One key</span>.{" "}
            <span className="text-foreground font-medium">One schema</span>.{" "}
            <span className="text-foreground font-medium">One bill</span>.
            <br />
            Stop juggling 5 API subscriptions. Ship in hours, not weeks.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center gap-4 mt-10">
            <a
              href="#pricing"
              className="group px-6 py-3 rounded-lg bg-accent hover:bg-accent-dark transition font-medium text-white flex items-center gap-2"
            >
              Get Free API Key
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#api-demo"
              className="px-6 py-3 rounded-lg border border-border hover:border-muted/50 transition font-medium text-muted hover:text-foreground"
            >
              See Live Demo
            </a>
          </div>

          {/* Asset class pills */}
          <div className="animate-fade-up delay-400 flex flex-wrap justify-center gap-3 mt-14">
            {[
              { icon: DollarSign, label: "170+ Fiat Currencies", color: "text-emerald" },
              { icon: Bitcoin, label: "250+ Cryptocurrencies", color: "text-amber" },
              { icon: TrendingUp, label: "5,000+ Stocks", color: "text-cyan" },
              { icon: Gem, label: "Precious Metals", color: "text-accent-light" },
            ].map((a) => (
              <div
                key={a.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm"
              >
                <a.icon className={`w-4 h-4 ${a.color}`} />
                <span className="text-muted">{a.label}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="animate-fade-up delay-500 grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 w-full max-w-3xl">
            {[
              { value: "29M+", label: "Pair Combinations", icon: BarChart3 },
              { value: "<100ms", label: "P95 Response Time", icon: Zap },
              { value: "99.9%", label: "Uptime SLA", icon: Shield },
              { value: "$0", label: "To Get Started", icon: DollarSign },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-muted mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
