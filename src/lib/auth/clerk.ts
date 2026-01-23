// Clerk Utilities - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { auth, currentUser } from "@clerk/nextjs/server";

export async function getAuthUser() {
  const user = await currentUser();
  return user;
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
