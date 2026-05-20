import { NextResponse } from "next/server";
import { isSubscribed } from "@/lib/subscription";
import { callOracle } from "@/lib/anthropic";
import type { Card } from "@/lib/deck";
import type { NatalChart, SkyState } from "@/lib/astro";
import type { VoiceKey } from "@/lib/voices";

/*
  Three-card spread interpretation. Subscriber-only.

  Layout choices match the brief:
    - sao : Situation / Action / Outcome (default)
    - ppf : Past / Present / Future

  The client draws three cards locally (no repeats), reveals them one at
  a time, and only then asks the server for a single coherent reading
  across all three.
*/

export type SpreadLayout = "sao" | "ppf";

interface RequestBody {
  cards: [Card, Card, Card];
  layout: SpreadLayout;
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  question?: string;
}

export interface SpreadResponse {
  positionReadings: [string, string, string];
  synthesis: string;
}

const LAYOUT_LABELS: Record<SpreadLayout, [string, string, string]> = {
  sao: ["Situation", "Action", "Outcome"],
  ppf: ["Past", "Present", "Future"],
};

const SCHEMA = `{
  "positionReadings": ["3 sentences for position 1", "3 sentences for position 2", "3 sentences for position 3"],
  "synthesis": "2-3 sentences weaving the three positions into one coherent narrative"
}`;

export async function POST(req: Request) {
  if (!(await isSubscribed())) {
    return NextResponse.json(
      { error: "Subscriber-only feature" },
      { status: 402 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.cards || body.cards.length !== 3) {
    return NextResponse.json(
      { error: "Three cards are required" },
      { status: 400 },
    );
  }

  const positions = LAYOUT_LABELS[body.layout] ?? LAYOUT_LABELS.sao;

  const userMessage = [
    "A three-card spread for this reader.",
    `Layout: ${positions.join(" / ")}`,
    body.question ? `Question: "${body.question}"` : "",
    "",
    "Cards drawn (in position order):",
    body.cards
      .map(
        (c, i) =>
          `  ${positions[i]} — ${c.name} (suit of ${c.suit}). Description on card: "${c.description}"`,
      )
      .join("\n"),
    "",
    "Today's sky:",
    JSON.stringify(body.sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(body.natal, null, 2),
    "",
    "Read each position specifically, then synthesise across all three.",
    "Stay in voice. Do not give generic card meanings — read these cards in",
    "this configuration for this person on this day.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callOracle<SpreadResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 1500,
      schema: SCHEMA,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Oracle failed to respond",
      },
      { status: 502 },
    );
  }
}
