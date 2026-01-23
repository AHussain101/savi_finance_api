// Metal Rates API - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const currency = searchParams.get("currency")?.toUpperCase() || "USD";

  // TODO: Implement API key validation
  // TODO: Implement rate lookup from cache

  if (!symbol) {
    return Response.json(
      {
        success: false,
        error: { code: "MISSING_PARAMS", message: "symbol parameter required" },
      },
      { status: 400 }
    );
  }

  // Placeholder response
  return Response.json({
    success: true,
    data: { symbol, currency, rate: 1985.5 },
    meta: {
      cached: true,
      timestamp: new Date().toISOString(),
      source: "FinFlux",
    },
  });
}
