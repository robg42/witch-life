import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/feature-flags-server";

/*
  Create a public share for a three-card spread reading. Returns the
  share token. The token is a URL-safe random — looks like
  `gZcQ8...` — never sequential, never guessable from any user data.

  Gated behind the 'shared-spreads' feature flag, which is itself
  paid-tier in lib/features.ts. So the check covers both rules.
*/

export const dynamic = "force-dynamic";

const cardSchema = z.object({
  name: z.string(),
  suit: z.string(),
  description: z.string(),
});

const bodySchema = z.object({
  cards: z.tuple([cardSchema, cardSchema, cardSchema]),
  layout: z.string(),
  question: z.string().optional(),
  // payload is the full SpreadResponse JSON — we trust the client because
  // we'll wrap-check it on the read side.
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!(await hasFeature("shared-spreads"))) {
    return NextResponse.json(
      { error: "Feature unavailable on your plan" },
      { status: 403 },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Invalid body",
      },
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
    return NextResponse.json({ error: "User not synced" }, { status: 503 });
  }

  const token = generateShareToken();
  await sb.from("shared_spreads").insert({
    user_id: (userRow as { id: string }).id,
    share_token: token,
    cards: parsed.cards,
    layout: parsed.layout,
    question: parsed.question ?? null,
    payload: parsed.payload,
  });

  return NextResponse.json({
    token,
    url: `/share/${token}`,
  });
}

/**
 * 22-character URL-safe random — 132 bits of entropy. Way more than
 * enough to defeat enumeration; short enough to look pleasant in a URL.
 */
function generateShareToken(): string {
  return crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
