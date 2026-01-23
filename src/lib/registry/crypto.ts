// Cryptocurrency Registry - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

export const CRYPTO_CURRENCIES = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "DOT", name: "Polkadot" },
] as const;

export type CryptoSymbol = (typeof CRYPTO_CURRENCIES)[number]["symbol"];

export function isValidCrypto(symbol: string): symbol is CryptoSymbol {
  return CRYPTO_CURRENCIES.some((c) => c.symbol === symbol.toUpperCase());
}

export function getCryptoSymbols(): CryptoSymbol[] {
  return CRYPTO_CURRENCIES.map((c) => c.symbol);
}
