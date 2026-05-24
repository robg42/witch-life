import { supabaseAdmin } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/*
  Telemetry for the Anthropic SDK.

  Every callOracle / generateReport call funnels through here. We log
  endpoint, model, tokens, derived cost, duration, and status to the
  public.api_calls table — drives the /admin dashboard and per-user
  cost auditing.

  Pricing is a constant table keyed by model. Numbers in USD per
  million tokens (current Anthropic pricing for Sonnet 4.5; updated
  as needed).
*/

if (typeof window !== "undefined") {
  throw new Error("lib/telemetry must not be imported in client code");
}

interface UsageBreakdown {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

interface PriceTable {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/* USD per million tokens. */
const PRICES: Record<string, PriceTable> = {
  "claude-sonnet-4-5-20250929": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-opus-4-7": {
    input: 15.0,
    output: 75.0,
    cacheRead: 1.5,
    cacheWrite: 18.75,
  },
  "claude-haiku-4-5-20251001": {
    input: 0.8,
    output: 4.0,
    cacheRead: 0.08,
    cacheWrite: 1.0,
  },
};

const FALLBACK_PRICE: PriceTable = PRICES["claude-sonnet-4-5-20250929"];

export function estimateCostUsd(
  model: string,
  usage: UsageBreakdown,
): number {
  const p = PRICES[model] ?? FALLBACK_PRICE;
  const million = 1_000_000;
  return (
    (usage.inputTokens * p.input) / million +
    (usage.outputTokens * p.output) / million +
    (usage.cacheReadTokens * p.cacheRead) / million +
    (usage.cacheCreationTokens * p.cacheWrite) / million
  );
}

/**
 * Log a completed Anthropic call. Best-effort — telemetry errors are
 * swallowed because we never want a failed log to break the user's
 * request.
 */
export async function logApiCall(input: {
  endpoint: string;
  model: string;
  usage: UsageBreakdown;
  durationMs: number;
  status: "ok" | "error" | "rate_limited";
  errorMessage?: string;
  clerkUserId?: string | null;
}): Promise<void> {
  try {
    const sb = supabaseAdmin();
    let userId: string | null = null;
    if (input.clerkUserId) {
      const { data } = await sb
        .from("users")
        .select("id")
        .eq("clerk_id", input.clerkUserId)
        .maybeSingle();
      userId = (data as { id: string } | null)?.id ?? null;
    }
    await sb.from("api_calls").insert({
      user_id: userId,
      endpoint: input.endpoint,
      model: input.model,
      input_tokens: input.usage.inputTokens,
      output_tokens: input.usage.outputTokens,
      cache_creation_tokens: input.usage.cacheCreationTokens,
      cache_read_tokens: input.usage.cacheReadTokens,
      cost_usd: estimateCostUsd(input.model, input.usage),
      duration_ms: input.durationMs,
      status: input.status,
      error_message: input.errorMessage ?? null,
    });
  } catch {
    // never bubble telemetry failures
  }
}

/**
 * Convenience wrapper: capture the current Clerk session id (best-
 * effort) so logApiCall doesn't require the caller to thread it.
 */
export async function currentClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Pull token usage off an Anthropic SDK response. The SDK shape:
 *   response.usage = { input_tokens, output_tokens,
 *                      cache_creation_input_tokens?,
 *                      cache_read_input_tokens? }
 */
export function usageFromAnthropic(usage: unknown): UsageBreakdown {
  const u = usage as Record<string, number | undefined> | undefined;
  return {
    inputTokens: u?.input_tokens ?? 0,
    outputTokens: u?.output_tokens ?? 0,
    cacheCreationTokens: u?.cache_creation_input_tokens ?? 0,
    cacheReadTokens: u?.cache_read_input_tokens ?? 0,
  };
}
