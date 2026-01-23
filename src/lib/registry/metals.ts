// Precious Metals Registry - Sean's responsibility
// See docs/SEAN_DATA.md for implementation details

export const PRECIOUS_METALS = [
  { symbol: "XAU", name: "Gold", unit: "troy ounce" },
  { symbol: "XAG", name: "Silver", unit: "troy ounce" },
  { symbol: "XPT", name: "Platinum", unit: "troy ounce" },
] as const;

export type MetalSymbol = (typeof PRECIOUS_METALS)[number]["symbol"];

export function isValidMetal(symbol: string): symbol is MetalSymbol {
  return PRECIOUS_METALS.some((m) => m.symbol === symbol.toUpperCase());
}

export function getMetalSymbols(): MetalSymbol[] {
  return PRECIOUS_METALS.map((m) => m.symbol);
}
