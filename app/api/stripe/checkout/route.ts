import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, isStripeConfigured, STRIPE_PRICES } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { REPORT_META, type ReportType } from "@/lib/reports";

/*
  Single endpoint for both subscription and one-time-report checkout.

  Request body:
    { mode: "subscription", plan: "monthly" | "yearly" }
    { mode: "report", report: ReportType }

  Always returns { url } on success — the client redirects to Stripe.
*/

interface SubBody {
  mode: "subscription";
  plan: "monthly" | "yearly";
}
interface ReportBody {
  mode: "report";
  report: ReportType;
}
type Body = SubBody | ReportBody;

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this deployment." },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id, email, stripe_customer_id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json(
      { error: "User not yet synced — try again in a moment" },
      { status: 503 },
    );
  }

  const stripeClient = stripe();
  if (!stripeClient) {
    return NextResponse.json(
      { error: "Stripe unavailable" },
      { status: 503 },
    );
  }

  // Resolve or create the Stripe Customer for this user.
  let customerId = userRow.stripe_customer_id;
  if (!customerId) {
    const clerkUser = await currentUser();
    const email =
      userRow.email ??
      clerkUser?.emailAddresses?.[0]?.emailAddress ??
      undefined;
    const created = await stripeClient.customers.create({
      email,
      metadata: { clerk_id: userId },
    });
    customerId = created.id;
    await sb
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", userRow.id);
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  if (body.mode === "subscription") {
    const priceId =
      body.plan === "yearly"
        ? STRIPE_PRICES.subYearly
        : STRIPE_PRICES.subMonthly;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe subscription price is not configured" },
        { status: 503 },
      );
    }
    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?subscribed=1`,
      cancel_url: `${origin}/account?subscribed=0`,
      metadata: { kind: "subscription", clerk_id: userId },
    });
    return NextResponse.json({ url: session.url });
  }

  // mode === "report"
  const reportMeta = REPORT_META[body.report];
  if (!reportMeta) {
    return NextResponse.json({ error: "Unknown report" }, { status: 400 });
  }
  const priceKey: keyof typeof STRIPE_PRICES = (
    {
      natal: "reportNatal",
      year_ahead: "reportYearAhead",
      saturn_return: "reportSaturnReturn",
      eclipse_season: "reportEclipseSeason",
    } as const
  )[body.report];
  const priceId = STRIPE_PRICES[priceKey];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for ${body.report} not configured` },
      { status: 503 },
    );
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/reports?purchased=${body.report}`,
    cancel_url: `${origin}/reports`,
    metadata: {
      kind: "report",
      report: body.report,
      clerk_id: userId,
      user_id: userRow.id,
    },
  });
  return NextResponse.json({ url: session.url });
}
