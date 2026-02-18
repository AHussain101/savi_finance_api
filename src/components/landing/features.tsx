import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    title: "Fiat Currencies",
    description: "170+ fiat currency pairs with daily EOD rates. USD, EUR, GBP, and more.",
    icon: "💵",
  },
  {
    title: "Cryptocurrencies",
    description: "Top 100 cryptocurrencies by market cap. BTC, ETH, SOL, and beyond.",
    icon: "₿",
  },
  {
    title: "NASDAQ Stocks",
    description: "Real-time and historical stock prices for NASDAQ-listed companies.",
    icon: "📈",
  },
  {
    title: "Precious Metals",
    description: "Gold, Silver, Platinum, and Palladium spot prices updated daily.",
    icon: "🥇",
  },
];

export function Features() {
  return (
    <section className="py-20 px-4 bg-secondary/30" id="features">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          All the financial data you need
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          One unified API for all your financial data needs. No more juggling multiple providers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
