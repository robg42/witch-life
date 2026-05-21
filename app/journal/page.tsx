import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { JournalForm } from "@/components/journal/journal-form";
import { JournalList } from "@/components/journal/journal-list";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import type { JournalEntry } from "@/lib/journal";

export const dynamic = "force-dynamic";

interface DbRow {
  id: string;
  entry_date: string;
  moon_phase: string | null;
  sun_sign: string | null;
  what_landed: string | null;
  moving_toward: string | null;
  free_text: string | null;
  created_at: string;
}

function rowToEntry(row: DbRow): JournalEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    moonPhase: row.moon_phase,
    sunSign: row.sun_sign,
    whatLanded: row.what_landed ?? undefined,
    movingToward: row.moving_toward ?? undefined,
    freeText: row.free_text ?? undefined,
    createdAt: row.created_at,
  };
}

export default async function JournalPage() {
  const { userId } = await auth();
  if (!userId) return null;

  let entries: JournalEntry[] = [];
  let loadError: string | null = null;
  try {
    const sb = await supabaseForUser();
    const { data, error } = await sb
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    entries = (data as DbRow[]).map(rowToEntry);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load entries";
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
          >
            ← The Verdant Oracle
          </Link>
        </header>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mt-10">
          What is moving through you
        </p>
        <h1 className="display mt-3 text-3xl text-ink md:text-5xl">
          The journal
        </h1>
        <p className="oracle-body mt-4 text-ink/85">
          Set down what is moving through you. The oracle reads these — not
          your exact words, only the themes.
        </p>

        <BotanicalDivider className="my-10" />

        <JournalForm />

        <BotanicalDivider className="my-16" />

        <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 mb-6">
          Previously
        </h2>

        {loadError ? (
          <p className="font-serif text-base italic text-clay">{loadError}</p>
        ) : (
          <JournalList entries={entries} />
        )}
      </div>
    </main>
  );
}
