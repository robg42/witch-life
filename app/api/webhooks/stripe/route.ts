import { headers } from "next/headers";
import type Stripe from "stripe";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  generateReport,
  REPORT_META,
  type ReportType,
} from "@/lib/reports";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
} from "@/lib/astro";
import type { VoiceKey } from "@/lib/voices";

/*
  Stripe → Supabase mirror.

  Handles three event types:
    - customer.subscription.created  → users.subscription_status = active
    - customer.subscription.updated  → mirror status (active / cancelled)
    - customer.subscription.deleted  → cancelled
    - checkout.session.completed     → for one-time report purchases,
                                       generate the report immediately
                                       and insert into the reports table

  All work uses the service-role Supabase client — the user is asleep
  during this code path.
*/

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return new Response("Stripe not configured", { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }
  const client = stripe();
  if (!client) {
    return new Response("Stripe unavailable", { status: 503 });
  }

  const signature = headers().get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return new Response(
      `Invalid signature: ${err instanceof Error ? err.message : "?"}`,
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await mirrorSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await markCancelled(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      default:
        break;
    }
  } catch (err) {
    return new Response(
      `Handler error: ${err instanceof Error ? err.message : "?"}`,
      { status: 500 },
    );
  }
  return new Response("ok", { status: 200 });
}

async function mirrorSubscription(sub: Stripe.Subscription) {
  const sb = supabaseAdmin();
  const active = sub.status === "active" || sub.status === "trialing";
  await sb
    .from("users")
    .update({ subscription_status: active ? "active" : "cancelled" })
    .eq("stripe_customer_id", typeof sub.customer === "string" ? sub.customer : sub.customer.id);
}

async function markCancelled(sub: Stripe.Subscription) {
  const sb = supabaseAdmin();
  await sb
    .from("users")
    .update({ subscription_status: "cancelled" })
    .eq("stripe_customer_id", typeof sub.customer === "string" ? sub.customer : sub.customer.id);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Subscriptions: the corresponding subscription.created webhook will
  // mirror the active status. Nothing more to do here.
  if (session.mode !== "payment") return;

  const meta = session.metadata ?? {};
  if (meta.kind !== "report") return;
  const reportType = meta.report as ReportType;
  if (!reportType || !REPORT_META[reportType]) return;

  const userUuid = meta.user_id;
  if (!userUuid) {
    throw new Error("checkout.session.completed missing user_id in metadata");
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select(
      "id, birth_date, birth_time, birth_city, birth_lat, birth_lng, oracle_voice",
    )
    .eq("id", userUuid)
    .maybeSingle();
  if (!userRow) throw new Error("Stripe webhook: user not found");

  if (!userRow.birth_date) {
    // Can't generate without birth details — record a placeholder so the
    // user sees their purchase, can fill in their chart, and we'll
    // re-run generation from /api/report on demand.
    await sb.from("reports").insert({
      user_id: userUuid,
      report_type: reportType,
      report_json: {
        type: reportType,
        pendingReason: "Birth details missing — visit /onboarding then re-run",
      },
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    });
    return;
  }

  const natalDate = buildBirthUtc(userRow);
  const natal: NatalChart = computeNatalChart({
    date: natalDate,
    lat: userRow.birth_lat ?? undefined,
    lng: userRow.birth_lng ?? undefined,
  });
  const sky = getSkyState(new Date());

  const reportJson = await generateReport({
    type: reportType,
    voice: (userRow.oracle_voice ?? "root") as VoiceKey,
    natal,
    sky,
    date: new Date(),
  });

  await sb.from("reports").insert({
    user_id: userUuid,
    report_type: reportType,
    report_json: reportJson,
    stripe_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
  });
}

function buildBirthUtc(row: {
  birth_date: string | null;
  birth_time: string | null;
  birth_lng: number | null;
}): Date {
  if (!row.birth_date) return new Date();
  const [y, m, d] = row.birth_date.split("-").map(Number);
  const [hh, mm] = (row.birth_time ?? "12:00").split(":").map(Number);
  const offsetMs =
    row.birth_lng != null
      ? Math.round((row.birth_lng / 15) * 3_600_000)
      : 0;
  return new Date(
    Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0, 0) - offsetMs,
  );
}
