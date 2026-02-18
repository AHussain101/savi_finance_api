// API Keys Page - Victoria's responsibility
// See docs/VICTORIA_FRONTEND.md for implementation details

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { ApiKey } from "@/lib/db/models/api-key";
import { ApiKeysClient } from "./api-keys-client";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

async function getApiKeys(userId: string): Promise<ApiKeyData[]> {
  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return [];
  }

  const keys = await ApiKey.find({ userId: user._id, revokedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return keys.map((key: any) => ({
    id: String(key._id),
    name: key.name,
    keyPrefix: key.keyPrefix,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() || null,
  }));
}

export default async function ApiKeysPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const keys = await getApiKeys(userId);

  return <ApiKeysClient initialKeys={keys} />;
}
