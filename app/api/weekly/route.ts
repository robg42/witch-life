import { NextResponse } from "next/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";
import { getSkyState, type NatalChart } from "@/lib/astro";

/*
  Weekly arc. The astronomy is deterministic — we compute the moon phase
  and moon sign for each of the next seven days here on the server, and
  only ask the oracle for the qualitative energy and one-word descriptor
  per day plus the overall narrative arc.

  This keeps the response small and the AI focused on what only it can do.
*/

interface RequestBody {
  startISO: string; // ISO date string, day 1 of the week
  natal: NatalChart;
  voice: VoiceKey;
}

export type EnergyQuality =
  | "expand"
  | "flow"
  | "inward"
  | "contract"
  | "friction";

export interface WeeklyDay {
  date: string; // YYYY-MM-DD
  moonPhase: string;
  moonSign: string;
  energyQuality: EnergyQuality;
  descriptor: string;
}

export interface WeeklyResponse {
  days: WeeklyDay[];
  narrativeArc: string;
}

const SCHEMA = `{
  "days": [
    { "date": "YYYY-MM-DD (matches the date I gave you for each day)",
      "energyQuality": "one of: expand, flow, inward, contract, friction",
      "descriptor": "one or two words" }
  ],
  "narrativeArc": "2-3 sentences. The shape of the week as a whole."
}`;

const ALLOWED_QUALITIES: EnergyQuality[] = [
  "expand",
  "flow",
  "inward",
  "contract",
  "friction",
];

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.startISO || !body.natal || !body.voice) {
    return NextResponse.json(
      { error: "Missing startISO, natal, or voice" },
      { status: 400 },
    );
  }

  const start = new Date(body.startISO);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startISO" }, { status: 400 });
  }

  // Pre-compute the deterministic astronomy for each of the seven days.
  const astroDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    const sky = getSkyState(d);
    return {
      date: d.toISOString().slice(0, 10),
      moonPhase: sky.moon.phaseName,
      moonSign: sky.moon.sign,
      sun: sky.sun,
      mercury: sky.planets.mercury,
    };
  });

  const userMessage = [
    "Sketch the shape of the next seven days against this natal chart.",
    "For each day I have already computed the moon phase, moon sign, and",
    "sun position. You only need to give the energyQuality keyword and a",
    "one- or two-word descriptor per day, then a short narrative arc for",
    "the week as a whole.",
    "",
    "Days:",
    JSON.stringify(astroDays, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(body.natal, null, 2),
    "",
    "Stay in voice. Pick energyQuality from: expand, flow, inward, contract, friction.",
  ].join("\n");

  try {
    const ai = await callOracle<{
      days: { date: string; energyQuality: string; descriptor: string }[];
      narrativeArc: string;
    }>({
      voice: body.voice,
      userMessage,
      maxTokens: 900,
      schema: SCHEMA,
    });

    // Merge oracle qualitative output with deterministic astronomy.
    const merged: WeeklyDay[] = astroDays.map((d, i) => {
      const oracle = ai.days?.[i];
      const quality =
        oracle && (ALLOWED_QUALITIES as string[]).includes(oracle.energyQuality)
          ? (oracle.energyQuality as EnergyQuality)
          : "flow";
      return {
        date: d.date,
        moonPhase: d.moonPhase,
        moonSign: d.moonSign,
        energyQuality: quality,
        descriptor: oracle?.descriptor ?? "—",
      };
    });

    const response: WeeklyResponse = {
      days: merged,
      narrativeArc: ai.narrativeArc ?? "",
    };
    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Oracle failed to respond";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
