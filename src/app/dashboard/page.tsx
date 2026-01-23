// Dashboard Home - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* TODO: Add usage statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-6">
          <h3 className="text-sm text-muted-foreground">API Calls This Month</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-sm text-muted-foreground">Active API Keys</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-sm text-muted-foreground">Subscription Status</h3>
          <p className="text-3xl font-bold text-green-500">Active</p>
        </div>
      </div>
    </div>
  );
}
