// Dashboard Layout - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-background">{children}</main>
    </div>
  );
}
