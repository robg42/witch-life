import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Stripe Customer Portal session — lets the subscriber update card,
  cancel, or download invoices. Returns a one-shot URL.
*/

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("stripe_customer_id")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (!userRow?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer yet — subscribe first." },
      { status: 400 },
    );
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const client = stripe();
  if (!client) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
  }
  const session = await client.billingPortal.sessions.create({
    customer: userRow.stripe_customer_id,
    return_url: `${origin}/account`,
  });
  return NextResponse.json({ url: session.url });
}
