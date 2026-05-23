import { NextResponse } from "next/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";
import type { NatalChart, SkyState } from "@/lib/astro";

/*
  Card interpretation, reframed as ACTION. Returns a one-sentence
  interpretation plus a single paragraph describing what to actually
  do today with this card, in 5-10 minutes.
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
  seasonalContext?: string;
}

export interface CardResponse {
  interpretation: string; // 1 sentence: what this card is naming for this reader today
  action: string; // 1 paragraph: a specific 5-10 minute thing to do, ending with a concrete next step
}

const SCHEMA = `{
  "interpretation": "1 sentence. What this card is naming for this reader today, read against the day's sky and the natal chart. No generic card meanings.",
  "action": "1 paragraph. A specific 5 to 10 minute practice the reader can do today, ending with one concrete next step. Real things: an item they can find, a sentence to say, a person to text, a window to open, a walk to take. No abstractions."
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
    `Line on the card: "${body.card.description}"`,
    body.seasonalContext ? `On the land: ${body.seasonalContext}` : "",
    "",
    "Today's sky (for grounding):",
    JSON.stringify(body.sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(body.natal, null, 2),
    "",
    "Give a 1-sentence interpretation, then a single paragraph naming what to do today with this card. The action is concrete and 5-10 minutes. End the action with a single explicit next step.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callOracle<CardResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 600,
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
