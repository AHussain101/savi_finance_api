// API Keys Management - Aarfan's responsibility
// See docs/AARFAN_BACKEND.md for implementation details

import { NextRequest } from "next/server";

// GET - List user's API keys
export async function GET(req: NextRequest) {
  // TODO: Get user from Clerk auth
  // TODO: Fetch keys from MongoDB

  return Response.json({
    success: true,
    data: {
      keys: [],
    },
  });
}

// POST - Create new API key
export async function POST(req: NextRequest) {
  // TODO: Get user from Clerk auth
  // TODO: Generate new API key
  // TODO: Save to MongoDB

  const body = await req.json();
  const name = body.name || "Default Key";

  return Response.json({
    success: true,
    data: {
      key: "sk_live_xxxxxxxxxxxxxxxxxxxx",
      name,
      createdAt: new Date().toISOString(),
    },
  });
}

// DELETE - Revoke API key
export async function DELETE(req: NextRequest) {
  // TODO: Get user from Clerk auth
  // TODO: Revoke key in MongoDB

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("keyId");

  if (!keyId) {
    return Response.json(
      {
        success: false,
        error: { code: "MISSING_PARAMS", message: "keyId parameter required" },
      },
      { status: 400 }
    );
  }

  return Response.json({
    success: true,
  });
}
