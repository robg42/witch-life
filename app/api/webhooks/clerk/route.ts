import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Clerk webhook → mirror user records into Supabase.

  Configure in the Clerk dashboard: webhook endpoint pointing at
  /api/webhooks/clerk, subscribed to `user.created`, `user.updated`,
  `user.deleted`. Paste the signing secret into CLERK_WEBHOOK_SECRET.
*/

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = supabaseAdmin();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const email = event.data.email_addresses?.[0]?.email_address ?? null;
      const { error } = await supabase
        .from("users")
        .upsert(
          { clerk_id: event.data.id, email },
          { onConflict: "clerk_id" },
        );
      if (error) {
        return new Response(`Supabase error: ${error.message}`, { status: 500 });
      }
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("clerk_id", event.data.id);
        if (error) {
          return new Response(`Supabase error: ${error.message}`, { status: 500 });
        }
      }
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
