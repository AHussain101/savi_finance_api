// Clerk Webhook Handler - Matthew's responsibility
// See docs/MATTHEW_INFRA.md for implementation details

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

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

  const eventType = evt.type;

  // TODO: Handle different event types
  switch (eventType) {
    case "user.created":
      // TODO: Create user in MongoDB (coordinate with Sean)
      console.log("User created:", evt.data.id);
      break;
    case "user.updated":
      // TODO: Update user in MongoDB
      console.log("User updated:", evt.data.id);
      break;
    case "user.deleted":
      // TODO: Soft delete user, revoke API keys
      console.log("User deleted:", evt.data.id);
      break;
  }

  return new Response("Webhook received", { status: 200 });
}
