import { NextResponse } from "next/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";
import type { NatalChart, SkyState } from "@/lib/astro";

/*
  Main daily reading. Receives a precomputed SkyState + NatalChart from
  the client (both come from the pure lib/astro engine and are cheap to
  recompute), the voice preference, an optional question, and an optional
  recent-journal summary (Phase 5 wires this in).
*/

interface RequestBody {
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  question?: string;
  recentJournal?: string;
}

export interface ReadingResponse {
  energeticWeather: string;
  expand: string;
  contract: string;
  questionGuidance: string | null;
  protectYourEnergy: string;
  weeklyNarrative: string;
  journalAwareness: string | null;
}

const SCHEMA = `{
  "energeticWeather": "3-4 sentences. What is moving in the sky and how it meets this chart.",
  "expand": "2-3 sentences. Where to direct energy today.",
  "contract": "2-3 sentences. Where to consciously withdraw.",
  "questionGuidance": "2-3 sentences if a question was asked, otherwise the JSON value null.",
  "protectYourEnergy": "1 sentence. A specific practice, particular to this chart and today's sky.",
  "weeklyNarrative": "2-3 sentences. The arc of the week ahead.",
  "journalAwareness": "1 sentence acknowledging recent journal themes without quoting them, or the JSON value null if no journal entries were given."
}`;

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.sky || !body.natal || !body.voice) {
    return NextResponse.json(
      { error: "Missing sky, natal, or voice" },
      { status: 400 },
    );
  }

  const userMessage = buildPrompt(body);

  try {
    const result = await callOracle<ReadingResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 1400,
      schema: SCHEMA,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Oracle failed to respond";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function buildPrompt(body: RequestBody): string {
  const { sky, natal, question, recentJournal } = body;
  const dateLine = new Date(sky.date).toUTCString();
  return [
    `Date: ${dateLine}`,
    "",
    "Today's sky:",
    JSON.stringify(sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(natal, null, 2),
    question ? `\nThe reader has asked: "${question}"\n` : "",
    recentJournal
      ? `\nA summary of the reader's recent journal entries (do not quote them verbatim):\n${recentJournal}\n`
      : "",
    "",
    "Read this sky against this chart. Be specific to placements. Do not list bullet points; speak in prose within each JSON field. Stay in voice.",
  ]
    .filter(Boolean)
    .join("\n");
}
