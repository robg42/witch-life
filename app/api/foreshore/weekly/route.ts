import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callOracle } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { transmissionPromptFor } from "@/lib/foreshore/voices";
import type { VoiceKey } from "@/lib/voices";

/*
  /api/foreshore/weekly — once-a-week stitched broadcast that reads
  the operator's own captures from the last 7 days back to them,
  woven into a single short summary transmission. Different prompt
  than the daily transmission: this one explicitly references the
  operator's tape.

  Idempotent per (user, ISO week). Cached for a week in the
  cached_readings table under a synthetic 'voice' key
  'weekly:<voice>' so we don't pay for the same broadcast twice.

  Sent as a "transmission" string (5–35 words).
*/

export const dynamic = "force-dynamic";

export interface WeeklyResponse {
  transmission: string;
  basedOnCaptures: number;
}

async function userRowId(): Promise<{ id: string; voice: VoiceKey } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id, oracle_voice")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { id: string; oracle_voice: string | null };
  const voice = (row.oracle_voice ?? "root") as VoiceKey;
  return { id: row.id, voice };
}

function isoWeekKey(d: Date): string {
  // Build a stable key for "this week," YYYY-WNN style. Used as the
  // cache discriminator alongside voice.
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function POST() {
  const userRow = await userRowId();
  if (!userRow) {
    return NextResponse.json({ error: "NOT AUTHENTICATED" }, { status: 401 });
  }

  const { userId } = await auth();
  if (userId) {
    const rl = await rateLimit(userId, "/api/foreshore/weekly");
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

  const sb = supabaseAdmin();
  const weekKey = isoWeekKey(new Date());
  const cacheVoiceKey = `weekly:${userRow.voice}:${weekKey}`;

  // Try the cache. Same table we use for the daily reading. The
  // cache_key field naturally separates by ISO week.
  const cached = await sb
    .from("cached_readings")
    .select("payload")
    .eq("user_id", userRow.id)
    .eq("voice", cacheVoiceKey)
    .maybeSingle();
  if (cached.data) {
    const payload = (cached.data as { payload: WeeklyResponse }).payload;
    return NextResponse.json(payload, { headers: { "X-Cache": "HIT" } });
  }

  // Pull the past 7 days of captures.
  const sinceISO = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const { data: rows } = await sb
    .from("journal_entries")
    .select("entry_date, what_landed, moving_toward, free_text")
    .eq("user_id", userRow.id)
    .gte("entry_date", sinceISO)
    .order("entry_date", { ascending: false });

  type Row = {
    entry_date: string;
    what_landed: string | null;
    moving_toward: string | null;
    free_text: string | null;
  };
  const captures = (rows ?? []) as Row[];

  if (captures.length === 0) {
    return NextResponse.json(
      {
        error: "INSUFFICIENT CAPTURES THIS WEEK · FILE AT LEAST ONE LINE FIRST",
      },
      { status: 422 },
    );
  }

  const summarised = captures
    .map((r) => {
      const line = [r.free_text, r.what_landed, r.moving_toward]
        .filter((s): s is string => Boolean(s))
        .join(" · ");
      return `${r.entry_date}: ${line.slice(0, 240)}`;
    })
    .join("\n");

  const userMessage = [
    `STATION 28 — WEEKLY STITCHED BROADCAST.`,
    `ISO week: ${weekKey}`,
    ``,
    `The operator's captures from the last 7 days (chronological, newest first):`,
    summarised,
    ``,
    `Compose a SINGLE summary transmission, 10 to 35 words, in your voice. This is NOT a daily fragment — it is the station looking back across the week and naming what was. Refer obliquely to one or two specific captures. End with a small thing the operator might do or notice in the week ahead. No quotation marks around the line. No "Transmission:" label.`,
  ].join("\n");

  try {
    const text = await callOracle<string>({
      voice: userRow.voice,
      systemOverride: transmissionPromptFor(userRow.voice),
      userMessage,
      maxTokens: 180,
      schema: "",
      expectJson: false,
      endpoint: "/api/foreshore/weekly",
    });
    let transmission = text.trim();
    if (
      (transmission.startsWith('"') && transmission.endsWith('"')) ||
      (transmission.startsWith("'") && transmission.endsWith("'"))
    ) {
      transmission = transmission.slice(1, -1).trim();
    }
    transmission = transmission.replace(/^transmission\s*:\s*/i, "").replace(/\s+/g, " ");

    const payload: WeeklyResponse = {
      transmission,
      basedOnCaptures: captures.length,
    };
    await sb.from("cached_readings").upsert(
      {
        user_id: userRow.id,
        reading_date: new Date().toISOString().slice(0, 10),
        voice: cacheVoiceKey,
        cache_key: weekKey,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,reading_date,voice" },
    );
    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message.toUpperCase() : "SIGNAL LOST";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
