import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Financial Data
          <span className="text-primary"> Made Simple</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          One API for Fiat, Crypto, Stocks, and Precious Metals.
          Set it and forget it. $10/month flat. Unlimited calls.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="#pricing">
            <Button variant="outline" size="lg">View Pricing</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required to start
        </p>
      </div>
    </section>
  );
}
