import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
} from "@/lib/astro";
import { generateReport, REPORT_META, type ReportType } from "@/lib/reports";
import { rateLimit } from "@/lib/rate-limit";
import type { VoiceKey } from "@/lib/voices";

/*
  Manual report (re)generation. The happy path is Stripe webhook →
  immediate generation. This endpoint exists for two cases:

    1. A purchase landed but the user hadn't entered birth details yet
       and we stored a placeholder. After they add birth details they
       call POST /api/report?id=<row-id> to fill it in.
    2. Anthropic returned a malformed response and the row needs a retry.

  The reader can only regenerate reports they already paid for — we
  identify the row by its id and verify ownership.
*/

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = await rateLimit(userId, "/api/report");
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.message },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select(
      "id, birth_date, birth_time, birth_city, birth_lat, birth_lng, oracle_voice",
    )
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json({ error: "User not synced" }, { status: 503 });
  }

  const { data: reportRow } = await sb
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", userRow.id)
    .maybeSingle();
  if (!reportRow) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  const reportType = reportRow.report_type as ReportType;
  if (!REPORT_META[reportType]) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 500 });
  }

  if (!userRow.birth_date) {
    return NextResponse.json(
      { error: "Birth details missing — visit /onboarding first." },
      { status: 400 },
    );
  }

  const natalDate = buildBirthUtc(userRow);
  const natal: NatalChart = computeNatalChart({
    date: natalDate,
    lat: userRow.birth_lat ?? undefined,
    lng: userRow.birth_lng ?? undefined,
  });
  const sky = getSkyState(new Date());

  try {
    const reportJson = await generateReport({
      type: reportType,
      voice: (userRow.oracle_voice ?? "root") as VoiceKey,
      natal,
      sky,
      date: new Date(),
    });
    await sb
      .from("reports")
      .update({ report_json: reportJson })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Report generation failed",
      },
      { status: 502 },
    );
  }
}

function buildBirthUtc(row: {
  birth_date: string | null;
  birth_time: string | null;
  birth_lng: number | null;
}): Date {
  if (!row.birth_date) return new Date();
  const [y, m, d] = row.birth_date.split("-").map(Number);
  const [hh, mm] = (row.birth_time ?? "12:00").split(":").map(Number);
  const offsetMs =
    row.birth_lng != null
      ? Math.round((row.birth_lng / 15) * 3_600_000)
      : 0;
  return new Date(
    Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0, 0) - offsetMs,
  );
}
