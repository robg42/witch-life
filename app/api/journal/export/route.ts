import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/feature-flags-server";

/*
  Journal export — streams the user's full journal as a markdown
  document. Behind the 'journal-export' feature flag. Always returns
  text/markdown so the browser saves the file rather than rendering.
*/

export const dynamic = "force-dynamic";

interface JournalRow {
  entry_date: string;
  moon_phase: string | null;
  sun_sign: string | null;
  what_landed: string | null;
  moving_toward: string | null;
  free_text: string | null;
  created_at: string;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!(await hasFeature("journal-export"))) {
    return NextResponse.json(
      { error: "Feature unavailable" },
      { status: 403 },
    );
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id, email, oracle_voice")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json({ error: "User not synced" }, { status: 503 });
  }

  const { data: entries } = await sb
    .from("journal_entries")
    .select(
      "entry_date, moon_phase, sun_sign, what_landed, moving_toward, free_text, created_at",
    )
    .eq("user_id", (userRow as { id: string }).id)
    .order("entry_date", { ascending: false })
    .limit(2000);

  const rows = (entries ?? []) as JournalRow[];
  const md = renderMarkdown(rows, {
    email: (userRow as { email: string | null }).email,
    voice: (userRow as { oracle_voice: string | null }).oracle_voice,
  });

  const filename = `witch-life-journal-${new Date().toISOString().slice(0, 10)}.md`;
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function renderMarkdown(
  rows: JournalRow[],
  meta: { email: string | null; voice: string | null },
): string {
  const header = [
    `# Witch Life — Journal export`,
    ``,
    `**For:** ${meta.email ?? "(unknown)"}`,
    `**Voice:** ${meta.voice ?? "—"}`,
    `**Exported:** ${new Date().toISOString()}`,
    `**Entries:** ${rows.length}`,
    ``,
    `---`,
    ``,
  ];

  if (rows.length === 0) {
    return header.concat(["_No entries yet._", ""]).join("\n");
  }

  const body = rows.flatMap((r) => [
    `## ${formatDate(r.entry_date)}`,
    "",
    r.moon_phase || r.sun_sign
      ? `> ${[r.moon_phase, r.sun_sign].filter(Boolean).join(" · ")}`
      : "",
    r.moon_phase || r.sun_sign ? "" : "",
    sectionIfPresent("What I did", r.what_landed),
    sectionIfPresent("What's moving", r.moving_toward),
    sectionIfPresent("And the rest", r.free_text),
    "---",
    "",
  ]);

  return [...header, ...body].filter((s) => s !== "").join("\n") + "\n";
}

function sectionIfPresent(label: string, value: string | null): string {
  if (!value || !value.trim()) return "";
  return `**${label}**\n\n${value.trim()}\n`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
