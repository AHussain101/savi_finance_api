"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Key, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoadingScreen, Badge, Button } from "@/components/ui";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/keys", label: "API Keys", icon: Key },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

function DashboardNav() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border">
        <Link href="/" className="text-xl font-bold gradient-text">
          VaultLine
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-card"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-card">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground hover:bg-card"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-card">
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link href="/" className="text-xl font-bold gradient-text">
              VaultLine
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground hover:bg-background"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="px-4 py-3 mb-3">
              <div className="text-sm font-medium truncate">{user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.plan === "standard" ? "accent" : "default"}>
                  {user.plan === "standard" ? "Standard" : "Sandbox"}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-6 lg:p-8">{/* Children rendered here via slot */}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardNav />
      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </AuthProvider>
  );
}
