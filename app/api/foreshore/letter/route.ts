import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/feature-flags-server";
import { rateLimit } from "@/lib/rate-limit";
import {
  deliverLetterForUser,
  isoWeekKey,
  type LetterRecord,
} from "@/lib/foreshore/letters";

/*
  Letters from the Foreshore.

  GET  /api/foreshore/letter         — return the latest letter (if any)
  GET  /api/foreshore/letter?all     — return the operator's full bundle
  POST /api/foreshore/letter         — force-deliver this week's letter
                                       (idempotent per ISO week)
  PATCH /api/foreshore/letter?id=    — mark a letter as read

  Gated by the 'foreshore' feature flag.
*/

export const dynamic = "force-dynamic";

async function userRow(): Promise<
  | {
      id: string;
      email: string | null;
      oracle_voice: string | null;
    }
  | null
> {
  const { userId } = await auth();
  if (!userId) return null;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id, email, oracle_voice")
    .eq("clerk_id", userId)
    .maybeSingle();
  return (
    (data as {
      id: string;
      email: string | null;
      oracle_voice: string | null;
    } | null) ?? null
  );
}

export async function GET(req: Request) {
  if (!(await hasFeature("foreshore"))) {
    return NextResponse.json({ error: "FEATURE OFFLINE" }, { status: 403 });
  }
  const row = await userRow();
  if (!row) {
    return NextResponse.json({ error: "NOT AUTHENTICATED" }, { status: 401 });
  }

  const all = new URL(req.url).searchParams.has("all");
  const sb = supabaseAdmin();
  const query = sb
    .from("letters")
    .select("*")
    .eq("user_id", row.id)
    .order("sent_on", { ascending: false });

  if (all) {
    const { data } = await query;
    return NextResponse.json({ letters: (data ?? []) as LetterRecord[] });
  } else {
    const { data } = await query.limit(1).maybeSingle();
    return NextResponse.json({ letter: (data as LetterRecord | null) ?? null });
  }
}

export async function POST() {
  if (!(await hasFeature("foreshore"))) {
    return NextResponse.json({ error: "FEATURE OFFLINE" }, { status: 403 });
  }
  const row = await userRow();
  if (!row) {
    return NextResponse.json({ error: "NOT AUTHENTICATED" }, { status: 401 });
  }
  const { userId } = await auth();
  if (userId) {
    const rl = await rateLimit(userId, "/api/foreshore/letter");
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.message.toUpperCase() },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }
  }

  // Already have this week's letter? Return it (idempotent).
  const sb = supabaseAdmin();
  const weekKey = isoWeekKey(new Date());
  const existing = await sb
    .from("letters")
    .select("*")
    .eq("user_id", row.id)
    .eq("iso_week", weekKey)
    .maybeSingle();
  if (existing.data) {
    return NextResponse.json({
      letter: existing.data as LetterRecord,
      delivered: false,
    });
  }

  try {
    const letter = await deliverLetterForUser(row);
    if (!letter) {
      return NextResponse.json(
        { error: "LETTER NOT WRITTEN" },
        { status: 502 },
      );
    }
    return NextResponse.json({ letter, delivered: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message.toUpperCase() : "POSTAL FAULT";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function PATCH(req: Request) {
  const row = await userRow();
  if (!row) {
    return NextResponse.json({ error: "NOT AUTHENTICATED" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "MISSING ?id=" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("letters")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", row.id);
  if (error) {
    return NextResponse.json(
      { error: error.message.toUpperCase() },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
