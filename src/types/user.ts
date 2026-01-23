// User Types - Shared
// All team members can reference these types

export type SubscriptionStatus = "active" | "inactive" | "canceled";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  keyPrefix: string;
  name: string;
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

export interface UserWithSubscription extends User {
  subscription?: {
    plan: string;
    status: SubscriptionStatus;
    renewsAt?: Date;
    cancelAt?: Date;
  };
}
