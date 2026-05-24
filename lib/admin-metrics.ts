import { supabaseAdmin } from "@/lib/supabase/server";

/*
  Server-only helpers that crunch api_calls and users into the
  numbers we show on the /admin dashboard. All read-only.

  Everything is scoped to a rolling window. The dashboard defaults to
  "last 24 hours" but pages may pass a custom window in minutes.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/admin-metrics must not be imported in client code");
}

export interface DashboardMetrics {
  windowMinutes: number;
  totals: {
    apiCalls: number;
    errors: number;
    cachedReadingsHit: number; // best-effort — sourced from cached_readings touches
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
  byEndpoint: Array<{
    endpoint: string;
    calls: number;
    errors: number;
    costUsd: number;
    avgDurationMs: number;
  }>;
  byModel: Array<{
    model: string;
    calls: number;
    costUsd: number;
  }>;
  recentErrors: Array<{
    id: string;
    endpoint: string;
    model: string;
    error_message: string | null;
    created_at: string;
  }>;
  userTotals: {
    total: number;
    subscribers: number;
    admins: number;
    newInWindow: number;
  };
}

interface ApiCallRow {
  id: string;
  endpoint: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_tokens: number | null;
  cache_read_tokens: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  status: "ok" | "error" | "rate_limited";
  error_message: string | null;
  created_at: string;
}

/**
 * Pull the dashboard metrics. Defaults to a 24 hour rolling window.
 * The window is short enough that fetching all rows in memory is fine
 * (we expect hundreds, not millions). If it grows we add a materialised
 * view.
 */
export async function getDashboardMetrics(
  windowMinutes = 60 * 24,
): Promise<DashboardMetrics> {
  const sb = supabaseAdmin();
  const sinceISO = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const [callsRes, errorsRes, usersRes, subsRes, adminsRes, newUsersRes] =
    await Promise.all([
      sb
        .from("api_calls")
        .select(
          "id, endpoint, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, cost_usd, duration_ms, status, error_message, created_at",
        )
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false })
        .limit(5000),
      sb
        .from("api_calls")
        .select(
          "id, endpoint, model, error_message, created_at",
        )
        .eq("status", "error")
        .order("created_at", { ascending: false })
        .limit(10),
      sb.from("users").select("id", { count: "exact", head: true }),
      sb
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active"),
      sb
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true),
      sb
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceISO),
    ]);

  const calls = (callsRes.data ?? []) as ApiCallRow[];

  let costUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let errors = 0;
  const byEndpoint = new Map<
    string,
    { calls: number; errors: number; costUsd: number; durationSum: number }
  >();
  const byModel = new Map<string, { calls: number; costUsd: number }>();

  for (const c of calls) {
    const cost = Number(c.cost_usd ?? 0);
    costUsd += cost;
    inputTokens += c.input_tokens ?? 0;
    outputTokens += c.output_tokens ?? 0;
    cacheReadTokens += c.cache_read_tokens ?? 0;
    cacheCreationTokens += c.cache_creation_tokens ?? 0;
    if (c.status === "error") errors += 1;

    const e = byEndpoint.get(c.endpoint) ?? {
      calls: 0,
      errors: 0,
      costUsd: 0,
      durationSum: 0,
    };
    e.calls += 1;
    e.costUsd += cost;
    if (c.status === "error") e.errors += 1;
    e.durationSum += c.duration_ms ?? 0;
    byEndpoint.set(c.endpoint, e);

    const m = byModel.get(c.model) ?? { calls: 0, costUsd: 0 };
    m.calls += 1;
    m.costUsd += cost;
    byModel.set(c.model, m);
  }

  const { count: cacheReadingHits } = await sb
    .from("cached_readings")
    .select("user_id", { count: "exact", head: true })
    .gte("updated_at", sinceISO);

  return {
    windowMinutes,
    totals: {
      apiCalls: calls.length,
      errors,
      cachedReadingsHit: cacheReadingHits ?? 0,
      costUsd,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
    },
    byEndpoint: Array.from(byEndpoint.entries())
      .map(([endpoint, v]) => ({
        endpoint,
        calls: v.calls,
        errors: v.errors,
        costUsd: v.costUsd,
        avgDurationMs: v.calls > 0 ? Math.round(v.durationSum / v.calls) : 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd),
    byModel: Array.from(byModel.entries())
      .map(([model, v]) => ({ model, calls: v.calls, costUsd: v.costUsd }))
      .sort((a, b) => b.costUsd - a.costUsd),
    recentErrors: (errorsRes.data ?? []) as DashboardMetrics["recentErrors"],
    userTotals: {
      total: usersRes.count ?? 0,
      subscribers: subsRes.count ?? 0,
      admins: adminsRes.count ?? 0,
      newInWindow: newUsersRes.count ?? 0,
    },
  };
}

export function formatUsd(n: number): string {
  if (n < 0.01) return "$0.00";
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
