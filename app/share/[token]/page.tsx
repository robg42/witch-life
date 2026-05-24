import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { SpreadResponse } from "@/app/api/spread/route";

/*
  Public share page for a three-card spread. Token-gated, world-
  readable. We increment view_count on every render so the original
  owner can see whether their share got traction.

  No personal data is shown — just the cards, the question, the
  practice. We deliberately don't render the owner's name or chart.
*/

export const dynamic = "force-dynamic";

interface ShareRow {
  cards: Array<{ name: string; suit: string; description: string }>;
  layout: string;
  question: string | null;
  payload: SpreadResponse;
  view_count: number;
  created_at: string;
  expires_at: string | null;
}

const LAYOUT_LABELS: Record<string, [string, string, string]> = {
  sao: ["Situation", "Action", "Outcome"],
  ppf: ["Past", "Present", "Future"],
};

export default async function SharedSpreadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) notFound();

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("shared_spreads")
    .select(
      "cards, layout, question, payload, view_count, created_at, expires_at",
    )
    .eq("share_token", token)
    .maybeSingle();

  const row = data as ShareRow | null;
  if (!row) notFound();
  if (row.expires_at && new Date(row.expires_at) < new Date()) notFound();

  // Best-effort view counter — never block on it.
  void sb
    .from("shared_spreads")
    .update({ view_count: row.view_count + 1 })
    .eq("share_token", token);

  const positions =
    LAYOUT_LABELS[row.layout] ?? (["First", "Second", "Third"] as const);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 border-b border-[var(--c-rule)] pb-6">
        <p className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--c-ash)]">
          Witch Life · Shared spread
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--c-ink)]">
          {row.question ?? "A three-card practice"}
        </h1>
        <p className="mt-2 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
          Read {new Date(row.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {row.view_count > 0 && ` · ${row.view_count} views`}
        </p>
      </header>

      <section className="space-y-10">
        {row.payload.positions.map((pos, i) => (
          <article
            key={positions[i]}
            className="border-l-2 border-[var(--c-vermilion)] pl-6"
          >
            <h2 className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--c-ash)]">
              {positions[i]}
            </h2>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--c-ink)]">
              {row.cards[i].name}
            </h3>
            <p className="mt-3 font-[family-name:var(--font-serif)] text-base text-[var(--c-ink)]">
              {pos.interpretation}
            </p>
            <p className="mt-3 font-[family-name:var(--font-serif)] text-base text-[var(--c-ink)]/85">
              {pos.action}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12 border-t border-[var(--c-rule)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--c-ink)]">
          This week
        </h2>
        <p className="mt-2 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
          {row.payload.weekPractice.intention}
        </p>
        <ul className="mt-4 space-y-3">
          {row.payload.weekPractice.steps.map((s) => (
            <li
              key={s.day}
              className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3"
            >
              <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--c-ash)]">
                {s.day}
              </span>
              <p className="mt-1 font-[family-name:var(--font-serif)] text-base text-[var(--c-ink)]">
                {s.action}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-16 border-t border-[var(--c-rule)] pt-6 text-center">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.2em] text-[var(--c-vermilion)] hover:underline"
        >
          Witch Life · Read your own
        </Link>
      </footer>
    </main>
  );
}
