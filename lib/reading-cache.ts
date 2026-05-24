import crypto from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ReadingResponse } from "@/app/api/reading/route";
import type { VoiceKey } from "@/lib/voices";

/*
  Cache today's reading per (user, date, voice). Without this, every
  page load of the leaf hits Anthropic — wasteful and slow.

  Cache key is a hash of the inputs that materially shape the
  reading: voice + intentions + question + summarised journal +
  daily card name + seasonal context. If any of those change, the
  cached entry is missed and a fresh one is generated.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/reading-cache must not be imported in client code");
}

export interface ReadingCacheInput {
  voice: VoiceKey;
  intentions?: string[];
  question?: string;
  recentJournal?: string;
  dailyCardName?: string;
  seasonalContext?: string;
}

function computeCacheKey(input: ReadingCacheInput): string {
  const ordered = {
    voice: input.voice,
    intentions: (input.intentions ?? []).slice().sort(),
    question: input.question ?? "",
    recentJournal: input.recentJournal ?? "",
    dailyCardName: input.dailyCardName ?? "",
    seasonalContext: input.seasonalContext ?? "",
  };
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(ordered))
    .digest("hex")
    .slice(0, 32);
}

async function userRowId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Try to read a cached reading. Returns null on any cache miss
 * (no row, mismatched key, no user, no Supabase, etc.) so the
 * caller falls through to a fresh generation.
 */
export async function getCachedReading(
  input: ReadingCacheInput,
): Promise<ReadingResponse | null> {
  try {
    const uid = await userRowId();
    if (!uid) return null;
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("cached_readings")
      .select("payload, cache_key")
      .eq("user_id", uid)
      .eq("reading_date", todayISO())
      .eq("voice", input.voice)
      .maybeSingle();
    if (!data) return null;
    const row = data as { payload: ReadingResponse; cache_key: string };
    if (row.cache_key !== computeCacheKey(input)) return null;
    return row.payload;
  } catch {
    return null;
  }
}

/**
 * Save a freshly generated reading. Best-effort — never throws to
 * the caller; failing to cache is not a fatal error.
 */
export async function saveCachedReading(
  input: ReadingCacheInput,
  payload: ReadingResponse,
): Promise<void> {
  try {
    const uid = await userRowId();
    if (!uid) return;
    const sb = supabaseAdmin();
    await sb.from("cached_readings").upsert(
      {
        user_id: uid,
        reading_date: todayISO(),
        voice: input.voice,
        cache_key: computeCacheKey(input),
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,reading_date,voice" },
    );
  } catch {
    // best-effort
  }
}
