import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SectionTitle, Pill } from "@/components/admin/primitives";
import { formatUsd } from "@/lib/admin-metrics";

/*
  /admin/api-calls — full call log. Filter by endpoint, status. Paginated.
*/

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface CallRow {
  id: string;
  user_id: string | null;
  endpoint: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  status: "ok" | "error" | "rate_limited";
  error_message: string | null;
  created_at: string;
}

export default async function AdminApiCallsPage({
  searchParams,
}: {
  searchParams: Promise<{
    endpoint?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const endpoint = (params.endpoint ?? "").trim();
  const status = params.status as "ok" | "error" | "rate_limited" | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const sb = supabaseAdmin();
  let query = sb
    .from("api_calls")
    .select(
      "id, user_id, endpoint, model, input_tokens, output_tokens, cost_usd, duration_ms, status, error_message, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (endpoint) query = query.eq("endpoint", endpoint);
  if (status) query = query.eq("status", status);

  const { data, count } = await query;
  const rows = (data ?? []) as CallRow[];
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--c-ink)]">
          API calls
        </h1>
        <p className="mt-1 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
          {total} total · page {page} of {lastPage}
        </p>
      </div>

      <form
        action="/admin/api-calls"
        className="flex flex-wrap items-end gap-2 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3"
      >
        <label className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
            Endpoint
          </span>
          <input
            type="text"
            name="endpoint"
            defaultValue={endpoint}
            placeholder="/api/reading"
            className="border border-[var(--c-rule)] bg-[var(--c-paper)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--c-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--c-vermilion)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
            Status
          </span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="border border-[var(--c-rule)] bg-[var(--c-paper)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--c-ink)]"
          >
            <option value="">any</option>
            <option value="ok">ok</option>
            <option value="error">error</option>
            <option value="rate_limited">rate_limited</option>
          </select>
        </label>
        <button
          type="submit"
          className="border border-[var(--c-ink)] bg-[var(--c-ink)] px-3 py-1 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-paper-3)] hover:bg-[var(--c-vermilion)]"
        >
          Filter
        </button>
        {(endpoint || status) && (
          <Link
            href="/admin/api-calls"
            className="px-3 py-1 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-vermilion)] hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      <SectionTitle>Recent calls</SectionTitle>
      <div className="overflow-x-auto border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
        <table className="w-full font-[family-name:var(--font-mono)] text-xs">
          <thead>
            <tr className="border-b border-[var(--c-rule)] text-left uppercase tracking-[0.15em] text-[var(--c-ash)]">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Endpoint</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">In</th>
              <th className="px-3 py-2 text-right font-medium">Out</th>
              <th className="px-3 py-2 text-right font-medium">ms</th>
              <th className="px-3 py-2 text-right font-medium">Cost</th>
              <th className="px-3 py-2 font-medium">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]"
                >
                  No calls match.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className={
                    "border-b border-[var(--c-rule)]/30 last:border-0 " +
                    (c.status === "error" ? "bg-[var(--c-vermilion)]/10" : "")
                  }
                >
                  <td className="px-3 py-2 text-[var(--c-ash)]">
                    {new Date(c.created_at).toLocaleString("en-GB", {
                      timeStyle: "short",
                      dateStyle: "short",
                    })}
                  </td>
                  <td className="px-3 py-2 text-[var(--c-ink)]">{c.endpoint}</td>
                  <td className="px-3 py-2">
                    {c.status === "error" ? (
                      <Pill tone="warn">err</Pill>
                    ) : c.status === "rate_limited" ? (
                      <Pill tone="warn">rate</Pill>
                    ) : (
                      <Pill tone="good">ok</Pill>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--c-ash)]">
                    {c.input_tokens ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--c-ash)]">
                    {c.output_tokens ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--c-ash)]">
                    {c.duration_ms ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--c-ink)]">
                    {formatUsd(c.cost_usd ?? 0)}
                  </td>
                  <td className="px-3 py-2">
                    {c.user_id ? (
                      <Link
                        href={`/admin/users/${c.user_id}`}
                        className="text-[var(--c-vermilion)] hover:underline"
                      >
                        →
                      </Link>
                    ) : (
                      <span className="text-[var(--c-ash)]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <nav className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
          <PageLink
            disabled={page <= 1}
            href={makeHref(endpoint, status, page - 1)}
            label="← Previous"
          />
          <span>
            Page {page} / {lastPage}
          </span>
          <PageLink
            disabled={page >= lastPage}
            href={makeHref(endpoint, status, page + 1)}
            label="Next →"
          />
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled: boolean;
}) {
  if (disabled) return <span className="opacity-30">{label}</span>;
  return (
    <Link href={href} className="text-[var(--c-vermilion)] hover:underline">
      {label}
    </Link>
  );
}

function makeHref(
  endpoint: string,
  status: string | undefined,
  page: number,
): string {
  const params = new URLSearchParams();
  if (endpoint) params.set("endpoint", endpoint);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/admin/api-calls?${s}` : "/admin/api-calls";
}
