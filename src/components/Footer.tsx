"use client";

import { Vault, ArrowRight, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative">
      {/* CTA Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Stop juggling.{" "}
            <span className="gradient-text">Start shipping.</span>
          </h2>
          <p className="text-muted text-lg mb-10 max-w-xl mx-auto">
            One API key. One schema. One bill. Replace your fragmented financial
            data stack in under an hour.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="group px-8 py-3.5 rounded-lg bg-accent hover:bg-accent-dark transition font-medium text-white flex items-center gap-2 text-lg"
            >
              Get Your Free API Key
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#api-demo"
              className="px-8 py-3.5 rounded-lg border border-border hover:border-muted/50 transition font-medium text-muted hover:text-foreground text-lg"
            >
              Explore the API
            </a>
          </div>

          <p className="text-xs text-muted mt-6">
            No credit card required. 1,000 free API calls per day. Upgrade
            anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Vault className="w-4.5 h-4.5 text-accent-light" />
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  Vault<span className="text-accent-light">Line</span>
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                The financial data infrastructure layer for the embedded finance
                era. One API for every financial rate on Earth.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2">
                {[
                  "API Reference",
                  "Pricing",
                  "SDK Documentation",
                  "Status Page",
                  "Changelog",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted hover:text-foreground transition"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Developers</h4>
              <ul className="space-y-2">
                {[
                  "Quickstart Guide",
                  "Interactive Playground",
                  "Widget Builder",
                  "GitHub SDKs",
                  "Community",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted hover:text-foreground transition"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact", "Privacy Policy"].map(
                  (l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-muted hover:text-foreground transition"
                      >
                        {l}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted">
              &copy; 2026 VaultLine. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/AHussain101/savi_finance_api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground transition"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted hover:text-foreground transition"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
