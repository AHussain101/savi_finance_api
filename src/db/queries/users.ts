import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { users, type User, type Plan } from '../schema';

/**
 * Get a user by their ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

/**
 * Get a user by their email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  passwordHash: string;
  plan?: Plan;
}): Promise<User> {
  const db = getDb();
  const result = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      plan: data.plan ?? 'sandbox',
    })
    .returning();
  return result[0];
}

/**
 * Update a user's plan
 */
export async function updateUserPlan(userId: string, plan: Plan): Promise<User | null> {
  const db = getDb();
  const result = await db
    .update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return result[0] ?? null;
}
