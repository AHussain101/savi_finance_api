// Clerk Webhook Handler - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { ApiKey } from "@/lib/db/models/api-key";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  await connectToDatabase();

  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, primary_email_address_id } = evt.data;
      const primaryEmail = email_addresses?.find(
        (e) => e.id === primary_email_address_id
      );
      const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

      if (email) {
        await User.create({
          clerkId: id,
          email,
          subscriptionStatus: "inactive",
        });
        console.log("User created in MongoDB:", id);
      }
      break;
    }
    case "user.updated": {
      const { id, email_addresses, primary_email_address_id } = evt.data;
      const primaryEmail = email_addresses?.find(
        (e) => e.id === primary_email_address_id
      );
      const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

      if (email) {
        await User.findOneAndUpdate({ clerkId: id }, { email });
        console.log("User updated in MongoDB:", id);
      }
      break;
    }
    case "user.deleted": {
      const { id } = evt.data;

      // Find the user to get their MongoDB _id
      const user = await User.findOne({ clerkId: id });

      if (user) {
        // Revoke all API keys for this user
        await ApiKey.updateMany(
          { userId: user._id, revokedAt: null },
          { revokedAt: new Date() }
        );

        // Mark subscription as canceled
        await User.findOneAndUpdate(
          { clerkId: id },
          { subscriptionStatus: "canceled" }
        );
        console.log("User deleted, API keys revoked:", id);
      }
      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
}
