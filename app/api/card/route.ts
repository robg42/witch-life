import { NextResponse } from "next/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";
import type { NatalChart, SkyState } from "@/lib/astro";

/*
  Card interpretation. Fires when a card is flipped on the reading page or
  in /draw. The deck itself is built in Phase 4; for now we accept any
  card name + suit + description and ask the oracle to interpret it
  against this chart and this sky.
*/

interface RequestBody {
  card: {
    name: string;
    suit: "Root" | "Tide" | "Blade" | "Ember";
    description: string;
  };
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
}

export interface CardResponse {
  cardReading: string;
}

const SCHEMA = `{
  "cardReading": "3-4 sentences specific to this card, this natal chart, and today's sky. Do not give a generic card meaning — read it through the placements you can see."
}`;

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.card || !body.sky || !body.natal || !body.voice) {
    return NextResponse.json(
      { error: "Missing card, sky, natal, or voice" },
      { status: 400 },
    );
  }

  const userMessage = [
    `Card drawn: ${body.card.name} (suit of ${body.card.suit}).`,
    `Poetic description on the card: "${body.card.description}"`,
    "",
    "Today's sky:",
    JSON.stringify(body.sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(body.natal, null, 2),
    "",
    "Interpret this card for this person on this day. Stay in voice.",
  ].join("\n");

  try {
    const result = await callOracle<CardResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 500,
      schema: SCHEMA,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Oracle failed to respond";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
