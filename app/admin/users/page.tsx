import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SectionTitle, Pill } from "@/components/admin/primitives";

/*
  /admin/users — paginated list. Search by email substring. The row
  links to /admin/users/[id] for full controls and flag overrides.
*/

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface UserRow {
  id: string;
  clerk_id: string | null;
  email: string | null;
  oracle_voice: string | null;
  is_admin: boolean | null;
  subscription_status: string | null;
  created_at: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const sb = supabaseAdmin();
  let query = sb
    .from("users")
    .select(
      "id, clerk_id, email, oracle_voice, is_admin, subscription_status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("email", `%${q}%`);
  }

  const { data, count } = await query;
  const rows = (data ?? []) as UserRow[];
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--c-ink)]">
            Users
          </h1>
          <p className="mt-1 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
            {total} total · page {page} of {lastPage}
          </p>
        </div>
        <form className="flex gap-2" action="/admin/users">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="email substring..."
            className="border border-[var(--c-rule)] bg-[var(--c-paper-3)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--c-ink)] placeholder:text-[var(--c-ash)] focus:outline-none focus:ring-1 focus:ring-[var(--c-vermilion)]"
          />
          <button
            type="submit"
            className="border border-[var(--c-ink)] bg-[var(--c-ink)] px-3 py-2 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-paper-3)] hover:bg-[var(--c-vermilion)]"
          >
            Search
          </button>
        </form>
      </div>

      <SectionTitle>Recent users</SectionTitle>
      <div className="overflow-x-auto border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
        <table className="w-full font-[family-name:var(--font-mono)] text-xs">
          <thead>
            <tr className="border-b border-[var(--c-rule)] text-left uppercase tracking-[0.15em] text-[var(--c-ash)]">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Voice</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]"
                >
                  No users match.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--c-rule)]/30 last:border-0 hover:bg-[var(--c-paper-3)]"
                >
                  <td className="px-4 py-2 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]">
                    {u.email ?? "(unverified)"}
                  </td>
                  <td className="px-4 py-2 capitalize text-[var(--c-ash)]">
                    {u.oracle_voice ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.is_admin && <Pill tone="warn">admin</Pill>}
                      {u.subscription_status === "active" && (
                        <Pill tone="good">sub</Pill>
                      )}
                      {u.subscription_status !== "active" && !u.is_admin && (
                        <Pill tone="muted">free</Pill>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[var(--c-ash)]">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-vermilion)] hover:underline"
                    >
                      Open →
                    </Link>
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
            href={makePageHref(q, page - 1)}
            label="← Previous"
          />
          <span>
            Page {page} / {lastPage}
          </span>
          <PageLink
            disabled={page >= lastPage}
            href={makePageHref(q, page + 1)}
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
  if (disabled) {
    return <span className="opacity-30">{label}</span>;
  }
  return (
    <Link href={href} className="text-[var(--c-vermilion)] hover:underline">
      {label}
    </Link>
  );
}

function makePageHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}
