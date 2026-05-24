import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Database-backed rate limiter for the AI endpoints. Counts api_calls
  rows for a given user/endpoint in a rolling window, rejects if
  over the threshold.

  Free tier (anon visitors share an IP bucket — TODO when we add
  unauth abuse): generous enough for daily use, tight enough to
  prevent runaway costs.

  Limits are tuned conservatively. Adjust per endpoint as needed.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/rate-limit must not be imported in client code");
}

export interface RateLimitOk {
  ok: true;
  remaining: number;
}
export interface RateLimitDenied {
  ok: false;
  retryAfterSec: number;
  message: string;
}
export type RateLimitResult = RateLimitOk | RateLimitDenied;

interface Bucket {
  windowMinutes: number;
  max: number;
}

/*
  Endpoint → bucket. Authenticated users only — unauth requests are
  bounced by middleware before they get here.
*/
const BUCKETS: Record<string, Bucket> = {
  "/api/reading": { windowMinutes: 60, max: 20 },
  "/api/transmission": { windowMinutes: 60, max: 30 },
  "/api/card": { windowMinutes: 60, max: 30 },
  "/api/spread": { windowMinutes: 60, max: 10 },
  "/api/library/practice": { windowMinutes: 60, max: 20 },
  "/api/report": { windowMinutes: 60, max: 5 },
};

const DEFAULT_BUCKET: Bucket = { windowMinutes: 60, max: 60 };

export async function rateLimit(
  clerkUserId: string,
  endpoint: string,
): Promise<RateLimitResult> {
  const bucket = BUCKETS[endpoint] ?? DEFAULT_BUCKET;
  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .maybeSingle();
  if (!userRow) {
    return { ok: true, remaining: bucket.max };
  }
  const userId = (userRow as { id: string }).id;
  const sinceISO = new Date(
    Date.now() - bucket.windowMinutes * 60_000,
  ).toISOString();
  const { count } = await sb
    .from("api_calls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("created_at", sinceISO);

  const used = count ?? 0;
  if (used >= bucket.max) {
    return {
      ok: false,
      retryAfterSec: bucket.windowMinutes * 60,
      message: `Rate limit: ${bucket.max} requests per ${bucket.windowMinutes} minutes for ${endpoint}.`,
    };
  }
  return { ok: true, remaining: bucket.max - used };
}
