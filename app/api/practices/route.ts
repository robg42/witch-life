import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseForUser } from "@/lib/supabase/server";

/*
  Practice log — record of practices the reader has marked complete.

  GET    /api/practices            — list practices, newest first.
  POST   /api/practices            — create a new completed practice.
  DELETE /api/practices?id=<uuid>  — remove an entry (for mistakes).
*/

export const dynamic = "force-dynamic";

const VALID_TYPES = ["daily", "card", "spread", "sabbat", "library"] as const;
type PracticeType = (typeof VALID_TYPES)[number];

interface DbRow {
  id: string;
  practice_date: string;
  practice_type: PracticeType;
  source_card_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface PracticeEntry {
  id: string;
  practiceDate: string;
  practiceType: PracticeType;
  sourceCardName: string | null;
  notes: string | null;
  createdAt: string;
}

function rowToEntry(row: DbRow): PracticeEntry {
  return {
    id: row.id,
    practiceDate: row.practice_date,
    practiceType: row.practice_type,
    sourceCardName: row.source_card_name,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function userRowId(): Promise<string | null> {
  const sb = await supabaseForUser();
  const { data, error } = await sb.from("users").select("id").single();
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
    .from("practices")
    .select("*")
    .order("practice_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    entries: (data as DbRow[]).map(rowToEntry),
  });
}

interface CreateBody {
  practiceType: PracticeType;
  sourceCardName?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.practiceType || !VALID_TYPES.includes(body.practiceType)) {
    return NextResponse.json(
      { error: "Invalid or missing practiceType" },
      { status: 400 },
    );
  }

  const userUuid = await userRowId();
  if (!userUuid) {
    return NextResponse.json(
      { error: "User profile not synced — try again in a moment" },
      { status: 503 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const sb = await supabaseForUser();
  const { data, error } = await sb
    .from("practices")
    .insert({
      user_id: userUuid,
      practice_date: today,
      practice_type: body.practiceType,
      source_card_name: body.sourceCardName ?? null,
      notes: body.notes ?? null,
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
  const { error } = await sb.from("practices").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
