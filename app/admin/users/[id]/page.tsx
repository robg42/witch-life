import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { FEATURES, featureDefinition, type FeatureKey } from "@/lib/features";
import { SectionTitle, Pill } from "@/components/admin/primitives";
import { UserFlagControls } from "@/components/admin/user-flag-controls";
import { UserAdminToggle } from "@/components/admin/user-admin-toggle";

/*
  /admin/users/[id] — one user's full surface. Shows core profile,
  subscription state, per-feature overrides, recent practices, recent
  api calls. The override controls call server actions defined in
  app/admin/users/[id]/actions.ts.
*/

export const dynamic = "force-dynamic";

interface UserDetailRow {
  id: string;
  clerk_id: string | null;
  email: string | null;
  oracle_voice: string | null;
  is_admin: boolean | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  birth_date: string | null;
  hemisphere: string | null;
  created_at: string;
}

interface OverrideRow {
  flag_key: string;
  enabled: boolean;
}

interface PracticeRow {
  id: string;
  practice_date: string;
  practice_type: string;
  created_at: string;
}

interface CallRow {
  id: string;
  endpoint: string;
  model: string;
  cost_usd: number | null;
  status: string;
  created_at: string;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const [userRes, overridesRes, practicesRes, callsRes] = await Promise.all([
    sb
      .from("users")
      .select(
        "id, clerk_id, email, oracle_voice, is_admin, subscription_status, stripe_customer_id, birth_date, hemisphere, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("user_feature_overrides")
      .select("flag_key, enabled")
      .eq("user_id", id),
    sb
      .from("practices")
      .select("id, practice_date, practice_type, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("api_calls")
      .select("id, endpoint, model, cost_usd, status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const user = userRes.data as UserDetailRow | null;
  if (!user) notFound();

  const overrides = (overridesRes.data ?? []) as OverrideRow[];
  const overrideMap = new Map(overrides.map((o) => [o.flag_key, o.enabled]));
  const practices = (practicesRes.data ?? []) as PracticeRow[];
  const calls = (callsRes.data ?? []) as CallRow[];

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin/users"
          className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--c-vermilion)] hover:underline"
        >
          ← All users
        </Link>
        <div className="mt-2 flex items-baseline justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--c-ink)]">
            {user.email ?? "(no email)"}
          </h1>
          <div className="flex gap-1">
            {user.is_admin && <Pill tone="warn">admin</Pill>}
            {user.subscription_status === "active" ? (
              <Pill tone="good">subscriber</Pill>
            ) : (
              <Pill tone="muted">free</Pill>
            )}
          </div>
        </div>
      </div>

      <section>
        <SectionTitle>Profile</SectionTitle>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3 font-[family-name:var(--font-mono)] text-xs sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Voice</dt>
            <dd className="capitalize text-[var(--c-ink)]">{user.oracle_voice ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Hemisphere</dt>
            <dd className="text-[var(--c-ink)]">{user.hemisphere ?? "N"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Birth date</dt>
            <dd className="text-[var(--c-ink)]">{user.birth_date ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Stripe</dt>
            <dd className="truncate text-[var(--c-ink)]">
              {user.stripe_customer_id ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Joined</dt>
            <dd className="text-[var(--c-ink)]">
              {new Date(user.created_at).toLocaleString("en-GB")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.15em] text-[var(--c-ash)]">Clerk ID</dt>
            <dd className="truncate text-[var(--c-ink)]">{user.clerk_id ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section>
        <SectionTitle>Admin status</SectionTitle>
        <UserAdminToggle userId={user.id} isAdmin={user.is_admin ?? false} />
      </section>

      <section>
        <SectionTitle>Feature overrides</SectionTitle>
        <p className="mb-3 font-[family-name:var(--font-serif)] italic text-sm text-[var(--c-ash)]">
          Overrides win over the global flag and over the hardcoded default. Set
          to <em>inherit</em> to fall back to those.
        </p>
        <ul className="space-y-2">
          {(Object.keys(FEATURES) as FeatureKey[]).map((key) => {
            const def = featureDefinition(key);
            return (
              <li
                key={key}
                className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)]">
                        {def.name}
                      </span>
                      <Pill tone={def.tier === "paid" ? "good" : "muted"}>
                        {def.tier}
                      </Pill>
                    </div>
                    <p className="mt-1 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ash)]">
                      {def.description}
                    </p>
                  </div>
                  <UserFlagControls
                    userId={user.id}
                    flagKey={key}
                    current={overrideMap.get(key) ?? null}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionTitle>Recent practices</SectionTitle>
        {practices.length === 0 ? (
          <div className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-6 text-center font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
            No practices logged.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--c-rule)]/30 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
            {practices.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-2 font-[family-name:var(--font-mono)] text-xs">
                <span className="text-[var(--c-ink)]">{p.practice_date}</span>
                <span className="uppercase tracking-[0.15em] text-[var(--c-ash)]">
                  {p.practice_type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Recent API calls</SectionTitle>
        {calls.length === 0 ? (
          <div className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-6 text-center font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
            No calls recorded.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40">
            <table className="w-full font-[family-name:var(--font-mono)] text-xs">
              <thead>
                <tr className="border-b border-[var(--c-rule)] text-left uppercase tracking-[0.15em] text-[var(--c-ash)]">
                  <th className="px-4 py-2 font-medium">Endpoint</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Cost</th>
                  <th className="px-4 py-2 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--c-rule)]/30 last:border-0"
                  >
                    <td className="px-4 py-2 text-[var(--c-ink)]">{c.endpoint}</td>
                    <td
                      className={`px-4 py-2 uppercase tracking-[0.15em] ${c.status === "error" ? "text-[var(--c-vermilion)]" : "text-[var(--c-ash)]"}`}
                    >
                      {c.status}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--c-ink)]">
                      ${(c.cost_usd ?? 0).toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--c-ash)]">
                      {new Date(c.created_at).toLocaleString("en-GB", {
                        timeStyle: "short",
                        dateStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
