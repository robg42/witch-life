import Link from "next/link";
import {
  formatCompact,
  formatUsd,
  getDashboardMetrics,
} from "@/lib/admin-metrics";
import { StatCard, SectionTitle } from "@/components/admin/primitives";

/*
  /admin — at-a-glance dashboard. Default window is 24 hours. The
  per-endpoint and per-model tables surface where cost is going.
  Recent errors are surfaced inline so admins notice them without
  hunting through the API call log.
*/

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const params = await searchParams;
  const windowMinutes = clampWindow(params.window);
  const m = await getDashboardMetrics(windowMinutes);

  const errorRate =
    m.totals.apiCalls === 0 ? 0 : (m.totals.errors / m.totals.apiCalls) * 100;

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--c-ink)]">
            Today on the leaf
          </h1>
          <p className="mt-1 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
            Window: last {humanWindow(windowMinutes)}.
          </p>
        </div>
        <WindowSwitcher current={windowMinutes} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="API calls"
          value={formatCompact(m.totals.apiCalls)}
          hint={`${m.totals.errors} error${m.totals.errors === 1 ? "" : "s"}`}
          tone={errorRate > 5 ? "warn" : "default"}
        />
        <StatCard
          label="Anthropic cost"
          value={formatUsd(m.totals.costUsd)}
          hint={`${formatCompact(m.totals.inputTokens)} in · ${formatCompact(m.totals.outputTokens)} out`}
        />
        <StatCard
          label="Cache reads"
          value={formatCompact(m.totals.cacheReadTokens)}
          hint={`${formatCompact(m.totals.cacheCreationTokens)} written`}
        />
        <StatCard
          label="Daily reading cache"
          value={String(m.totals.cachedReadingsHit)}
          hint="rows updated in window"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={String(m.userTotals.total)} hint={`+${m.userTotals.newInWindow} new`} />
        <StatCard label="Subscribers" value={String(m.userTotals.subscribers)} hint="active sub" />
        <StatCard label="Admins" value={String(m.userTotals.admins)} hint="is_admin = true" />
        <StatCard
          label="Error rate"
          value={`${errorRate.toFixed(1)}%`}
          hint="failures / calls"
          tone={errorRate > 5 ? "warn" : "default"}
        />
      </section>

      <section>
        <SectionTitle>By endpoint</SectionTitle>
        <div className="overflow-x-auto border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
          <table className="w-full font-[family-name:var(--font-mono)] text-xs">
            <thead>
              <tr className="border-b border-[var(--c-rule)] text-left uppercase tracking-[0.15em] text-[var(--c-ash)]">
                <th className="px-4 py-2 font-medium">Endpoint</th>
                <th className="px-4 py-2 text-right font-medium">Calls</th>
                <th className="px-4 py-2 text-right font-medium">Errors</th>
                <th className="px-4 py-2 text-right font-medium">Avg ms</th>
                <th className="px-4 py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {m.byEndpoint.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-[var(--c-ash)]">
                    No calls in window.
                  </td>
                </tr>
              ) : (
                m.byEndpoint.map((row) => (
                  <tr
                    key={row.endpoint}
                    className="border-b border-[var(--c-rule)]/30 last:border-0"
                  >
                    <td className="px-4 py-2 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]">
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--c-ink)]">
                      {row.calls}
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${row.errors > 0 ? "text-[var(--c-vermilion)]" : "text-[var(--c-ash)]"}`}
                    >
                      {row.errors}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--c-ash)]">
                      {row.avgDurationMs}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--c-ink)]">
                      {formatUsd(row.costUsd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>By model</SectionTitle>
          <div className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
            <table className="w-full font-[family-name:var(--font-mono)] text-xs">
              <thead>
                <tr className="border-b border-[var(--c-rule)] text-left uppercase tracking-[0.15em] text-[var(--c-ash)]">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 text-right font-medium">Calls</th>
                  <th className="px-4 py-2 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {m.byModel.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-[var(--c-ash)]">
                      No calls in window.
                    </td>
                  </tr>
                ) : (
                  m.byModel.map((row) => (
                    <tr
                      key={row.model}
                      className="border-b border-[var(--c-rule)]/30 last:border-0"
                    >
                      <td className="px-4 py-2 text-[var(--c-ink)]">{row.model}</td>
                      <td className="px-4 py-2 text-right text-[var(--c-ink)]">
                        {row.calls}
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--c-ink)]">
                        {formatUsd(row.costUsd)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SectionTitle>Recent errors</SectionTitle>
          {m.recentErrors.length === 0 ? (
            <div className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-6 text-center font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
              No errors logged.
            </div>
          ) : (
            <ul className="space-y-2">
              {m.recentErrors.map((e) => (
                <li
                  key={e.id}
                  className="border-l-2 border-[var(--c-vermilion)] bg-[var(--c-paper-3)]/40 px-3 py-2 text-xs"
                >
                  <div className="flex items-baseline justify-between font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.15em] text-[var(--c-ash)]">
                    <span>{e.endpoint}</span>
                    <time dateTime={e.created_at}>
                      {new Date(e.created_at).toLocaleString("en-GB", {
                        timeStyle: "short",
                        dateStyle: "short",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]">
                    {e.error_message ?? "(no message)"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionTitle>Quick links</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            href="/admin/users"
            className="block border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3 transition-colors hover:bg-[var(--c-paper-3)]"
          >
            <div className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)]">
              Users →
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
              Grant / revoke per-user feature overrides
            </div>
          </Link>
          <Link
            href="/admin/flags"
            className="block border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3 transition-colors hover:bg-[var(--c-paper-3)]"
          >
            <div className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)]">
              Flags →
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
              Toggle features globally
            </div>
          </Link>
          <Link
            href="/admin/api-calls"
            className="block border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3 transition-colors hover:bg-[var(--c-paper-3)]"
          >
            <div className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)]">
              API calls →
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
              Full Anthropic call log
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

const WINDOW_CHOICES = [
  { minutes: 60, label: "1h" },
  { minutes: 60 * 6, label: "6h" },
  { minutes: 60 * 24, label: "24h" },
  { minutes: 60 * 24 * 7, label: "7d" },
  { minutes: 60 * 24 * 30, label: "30d" },
];

function WindowSwitcher({ current }: { current: number }) {
  return (
    <div className="flex gap-1 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 p-1">
      {WINDOW_CHOICES.map((w) => {
        const active = w.minutes === current;
        return (
          <Link
            key={w.minutes}
            href={`/admin?window=${w.minutes}`}
            className={
              "px-3 py-1 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] transition-colors " +
              (active
                ? "bg-[var(--c-ink)] text-[var(--c-paper-3)]"
                : "text-[var(--c-ash)] hover:text-[var(--c-ink)]")
            }
          >
            {w.label}
          </Link>
        );
      })}
    </div>
  );
}

function clampWindow(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 60 * 24;
  // Cap at 90 days to keep queries cheap.
  return Math.min(parsed, 60 * 24 * 90);
}

function humanWindow(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(0)} hours`;
  return `${(minutes / 60 / 24).toFixed(0)} days`;
}
