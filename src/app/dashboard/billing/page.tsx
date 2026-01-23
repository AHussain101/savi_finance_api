// Billing Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">FinFlux Pro</p>
            <p className="text-muted-foreground">$10/month - Unlimited API calls</p>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Active
          </span>
        </div>
      </div>

      <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
        Manage Billing
      </button>
    </div>
  );
}
