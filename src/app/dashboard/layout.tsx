// Dashboard Layout - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* TODO: Add Sidebar component */}
      <aside className="w-64 border-r border-border p-4">
        <nav className="space-y-2">
          <a href="/dashboard" className="block p-2 rounded hover:bg-secondary">
            Home
          </a>
          <a
            href="/dashboard/api-keys"
            className="block p-2 rounded hover:bg-secondary"
          >
            API Keys
          </a>
          <a
            href="/dashboard/billing"
            className="block p-2 rounded hover:bg-secondary"
          >
            Billing
          </a>
          <a
            href="/dashboard/docs"
            className="block p-2 rounded hover:bg-secondary"
          >
            Documentation
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
