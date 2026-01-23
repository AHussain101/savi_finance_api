// Documentation Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">API Documentation</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        <p className="mb-4 text-muted-foreground">
          All API requests require an API key passed in the <code>x-api-key</code> header.
        </p>
        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
          {`curl -H "x-api-key: sk_live_xxxxx" https://api.finflux.io/v1/rates/fiat?from=USD&to=EUR`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Endpoints</h2>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-mono text-lg mb-2">GET /v1/rates/fiat</h3>
            <p className="text-muted-foreground mb-2">Get fiat currency exchange rates</p>
            <p><strong>Parameters:</strong> from, to</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-mono text-lg mb-2">GET /v1/rates/crypto</h3>
            <p className="text-muted-foreground mb-2">Get cryptocurrency exchange rates</p>
            <p><strong>Parameters:</strong> symbol, currency</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-mono text-lg mb-2">GET /v1/rates/stock</h3>
            <p className="text-muted-foreground mb-2">Get NASDAQ stock prices</p>
            <p><strong>Parameters:</strong> ticker</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-mono text-lg mb-2">GET /v1/rates/metal</h3>
            <p className="text-muted-foreground mb-2">Get precious metal rates</p>
            <p><strong>Parameters:</strong> symbol, currency</p>
          </div>
        </div>
      </section>
    </div>
  );
}
