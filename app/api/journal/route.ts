import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { getSkyState } from "@/lib/astro";
import {
  isInputNonEmpty,
  type JournalEntry,
  type JournalEntryInput,
} from "@/lib/journal";

/*
  Journal entries CRUD.

  - GET    /api/journal           — list the reader's entries, newest first.
  - POST   /api/journal           — create a new entry tagged with today's
                                    moon phase + sun sign.
  - DELETE /api/journal?id=<uuid> — delete one of the reader's entries.

  All operations go through `supabaseForUser()`, which signs requests
  with the Clerk JWT — so Supabase RLS enforces ownership and no extra
  server-side filtering is needed.
*/

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

async function userRowId(): Promise<string | null> {
  const sb = await supabaseForUser();
  const { data, error } = await sb
    .from("users")
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const sb = await supabaseForUser();
  const { data, error } = await sb
    .from("journal_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    entries: (data as DbRow[]).map(rowToEntry),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: JournalEntryInput;
  try {
    body = (await req.json()) as JournalEntryInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isInputNonEmpty(body)) {
    return NextResponse.json(
      { error: "Entry is empty — at least one field must contain text" },
      { status: 400 },
    );
  }

  const userUuid = await userRowId();
  if (!userUuid) {
    return NextResponse.json(
      { error: "User profile not synced yet — try again in a moment" },
      { status: 503 },
    );
  }

  const now = new Date();
  const sky = getSkyState(now);
  const entryDate = now.toISOString().slice(0, 10);

  const sb = await supabaseForUser();
  const { data, error } = await sb
    .from("journal_entries")
    .insert({
      user_id: userUuid,
      entry_date: entryDate,
      moon_phase: sky.moon.phaseName,
      sun_sign: sky.sun.sign,
      what_landed: body.whatLanded ?? null,
      moving_toward: body.movingToward ?? null,
      free_text: body.freeText ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: rowToEntry(data as DbRow) });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=" }, { status: 400 });
  }
  const sb = await supabaseForUser();
  const { error } = await sb.from("journal_entries").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
