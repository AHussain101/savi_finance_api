"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Copy, Check, Code, Play } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <span className="text-sm text-muted">{title}</span>
          <button
            onClick={handleCopy}
            className="text-muted hover:text-foreground transition p-1"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const pythonClient = `"""
VaultLine API Client

Usage:
    client = VaultLine('vl_your_api_key')
    rates = client.get_rates(['BTC/USD', 'ETH/USD'])
"""

import requests
from dataclasses import dataclass
from typing import Optional


@dataclass
class RateLimit:
    limit: int
    remaining: int
    reset: int


class VaultLineError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"[{status_code}] {message}")


class VaultLine:
    def __init__(self, api_key: str, base_url: str = "https://api.vaultline.io/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}"
        })
        self.rate_limit: Optional[RateLimit] = None

    def _request(self, endpoint: str, params: dict = None) -> dict:
        """Make an API request and return JSON response"""
        response = self.session.get(f"{self.base_url}{endpoint}", params=params)

        self.rate_limit = RateLimit(
            limit=int(response.headers.get("X-RateLimit-Limit", 0)),
            remaining=int(response.headers.get("X-RateLimit-Remaining", 0)),
            reset=int(response.headers.get("X-RateLimit-Reset", 0)),
        )

        if not response.ok:
            error = response.json()
            raise VaultLineError(
                response.status_code,
                error.get("message") or error.get("error") or f"HTTP {response.status_code}"
            )

        return response.json()

    def get_assets(self, asset_class: str = None) -> dict:
        """
        Get available symbols grouped by asset class

        Args:
            asset_class: Filter by 'fiat', 'crypto', 'stocks', or 'metals'

        Returns:
            dict with asset_classes and total_symbols
        """
        params = {}
        if asset_class:
            params["asset_class"] = asset_class
        return self._request("/assets", params)

    def get_rates(self, symbols: list[str], date: str = None) -> dict:
        """
        Get current rates for symbols

        Args:
            symbols: List of symbols, e.g. ['BTC/USD', 'AAPL']
            date: Optional ISO date (YYYY-MM-DD)

        Returns:
            dict with data array of rates
        """
        params = {"symbols": ",".join(symbols)}
        if date:
            params["date"] = date
        return self._request("/rates", params)

    def get_history(self, symbol: str, from_date: str, to_date: str) -> dict:
        """
        Get historical rates for a symbol

        Args:
            symbol: Symbol, e.g. 'BTC/USD'
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)

        Returns:
            dict with symbol info and history array
        """
        return self._request("/rates/history", {
            "symbol": symbol,
            "from": from_date,
            "to": to_date,
        })`;

const exampleGetAssets = `from vaultline import VaultLine

client = VaultLine(
    "vl_your_api_key",
    base_url="https://savifinanceapi.vercel.app/api/v1"
)

assets = client.get_assets()
print(assets)`;

const exampleGetRates = `from vaultline import VaultLine

client = VaultLine(
    "vl_your_api_key",
    base_url="https://savifinanceapi.vercel.app/api/v1"
)

rates = client.get_rates(["BTC/USD", "ETH/USD"])
print(rates)`;

const sidebarItems = [
  { id: "client", label: "Python Client", icon: Code },
  { id: "examples", label: "Examples", icon: Play },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("client");

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/30 fixed top-16 bottom-0 left-0 overflow-y-auto hidden lg:block">
          <nav className="p-4">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-3">
              Documentation
            </h2>
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      activeSection === item.id
                        ? "bg-accent/20 text-accent-light"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-card/80 backdrop-blur border-b border-border">
          <div className="flex gap-2 p-3 overflow-x-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  activeSection === item.id
                    ? "bg-accent/20 text-accent-light"
                    : "text-muted hover:text-foreground bg-card"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:pl-64 pt-8 lg:pt-0">
          <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
            {activeSection === "client" && (
              <>
                {/* Header */}
                <div className="mb-10">
                  <h1 className="text-3xl font-bold tracking-tight mb-3">
                    Python <span className="gradient-text">Client</span>
                  </h1>
                  <p className="text-muted">
                    A simple Python client for the VaultLine API.
                  </p>
                </div>

                {/* Installation */}
                <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Installation</h2>
                  <p className="text-muted mb-4">
                    Save the client code below to a file named{" "}
                    <code className="px-1.5 py-0.5 rounded bg-card text-accent-light text-sm">
                      vaultline.py
                    </code>{" "}
                    in your project.
                  </p>
                </section>

                {/* Client Code */}
                <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">Client Code</h2>
                  <CodeBlock code={pythonClient} title="vaultline.py" />
                </section>

                {/* API Methods */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">API Methods</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-card/30">
                      <h3 className="font-mono text-accent-light mb-2">
                        get_assets(asset_class=None)
                      </h3>
                      <p className="text-sm text-muted">
                        Get available symbols. Optionally filter by asset class:{" "}
                        <code className="text-xs px-1 py-0.5 rounded bg-card">
                          &apos;fiat&apos;
                        </code>
                        ,{" "}
                        <code className="text-xs px-1 py-0.5 rounded bg-card">
                          &apos;crypto&apos;
                        </code>
                        ,{" "}
                        <code className="text-xs px-1 py-0.5 rounded bg-card">
                          &apos;stocks&apos;
                        </code>
                        , or{" "}
                        <code className="text-xs px-1 py-0.5 rounded bg-card">
                          &apos;metals&apos;
                        </code>
                        .
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-card/30">
                      <h3 className="font-mono text-accent-light mb-2">
                        get_rates(symbols, date=None)
                      </h3>
                      <p className="text-sm text-muted">
                        Get current rates for a list of symbols. Optionally
                        specify a date (YYYY-MM-DD) for historical rates.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-card/30">
                      <h3 className="font-mono text-accent-light mb-2">
                        get_history(symbol, from_date, to_date)
                      </h3>
                      <p className="text-sm text-muted">
                        Get historical rates for a symbol between two dates
                        (YYYY-MM-DD format).
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeSection === "examples" && (
              <>
                {/* Header */}
                <div className="mb-10">
                  <h1 className="text-3xl font-bold tracking-tight mb-3">
                    Example <span className="gradient-text">Usages</span>
                  </h1>
                  <p className="text-muted">
                    Quick examples to get you started with the VaultLine API.
                  </p>
                </div>

                {/* Examples */}
                <div className="space-y-10">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">
                      Get Available Assets
                    </h2>
                    <p className="text-muted mb-4">
                      Retrieve all available assets grouped by asset class.
                    </p>
                    <CodeBlock code={exampleGetAssets} title="example_assets.py" />
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">
                      Get Current Rates
                    </h2>
                    <p className="text-muted mb-4">
                      Fetch current rates for specific symbols.
                    </p>
                    <CodeBlock code={exampleGetRates} title="example_rates.py" />
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
