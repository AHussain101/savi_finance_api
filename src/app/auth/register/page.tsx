"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, LoadingScreen } from "@/components/ui";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const isStandardPlan = plan === "standard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerRes.status === 409) {
          setErrors({ email: "An account with this email already exists" });
        } else {
          setErrors({ general: registerData.error || "Registration failed" });
        }
        return;
      }

      // If signing up for Standard, redirect to checkout
      if (isStandardPlan) {
        const checkoutRes = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interval: "month" }),
        });

        const checkoutData = await checkoutRes.json();

        if (checkoutRes.ok && checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold gradient-text mb-4 inline-block">
            VaultLine
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            {isStandardPlan ? (
              <span className="text-accent">
                Start your 7-day free trial of Standard. No credit card required upfront.
              </span>
            ) : (
              "Get started with your free Sandbox account"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {errors.general}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" loading={loading}>
              {isStandardPlan ? "Start Free Trial" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <RegisterForm />
    </Suspense>
  );
}
