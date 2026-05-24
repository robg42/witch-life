import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/feature-flags-server";

/*
  POST /api/foreshore/reply — file an operator reply to a specific
  letter. Replies are stored against the letter and against the
  user; they surface in the next letter's prompt context (via
  lib/foreshore/letters.ts → deliverLetterForUser). The Foreshore
  never acknowledges a reply immediately. The acknowledgement, if
  any, will appear in the next letter.
*/

export const dynamic = "force-dynamic";

const replyBodySchema = z.object({
  letterId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  if (!(await hasFeature("foreshore"))) {
    return NextResponse.json({ error: "FEATURE OFFLINE" }, { status: 403 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "NOT AUTHENTICATED" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID JSON" }, { status: 400 });
  }
  const parsed = replyBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID BODY", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json({ error: "USER NOT SYNCED" }, { status: 503 });
  }
  const uid = (userRow as { id: string }).id;

  // Verify the letter exists and belongs to the operator before we
  // accept a reply. The DB RLS also enforces this on insert, but
  // checking here gives us a meaningful 404.
  const { data: letter } = await sb
    .from("letters")
    .select("id, user_id")
    .eq("id", parsed.data.letterId)
    .maybeSingle();
  if (!letter || (letter as { user_id: string }).user_id !== uid) {
    return NextResponse.json({ error: "LETTER NOT FOUND" }, { status: 404 });
  }

  const { error } = await sb.from("letter_replies").insert({
    letter_id: parsed.data.letterId,
    user_id: uid,
    body: parsed.data.body.trim(),
  });
  if (error) {
    return NextResponse.json(
      { error: error.message.toUpperCase() },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
