// Landing Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">FinFlux API</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Financial data made simple. $10/month. Unlimited calls.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/sign-up"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-secondary"
          >
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
