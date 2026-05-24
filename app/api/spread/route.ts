import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { isSubscribed } from "@/lib/subscription";
import { callOracle } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import type { Card } from "@/lib/deck";
import type { NatalChart, SkyState } from "@/lib/astro";
import type { VoiceKey } from "@/lib/voices";

const cardSchema = z.object({
  name: z.string().min(1).max(80),
  suit: z.enum(["Root", "Tide", "Blade", "Ember"]),
  description: z.string().min(1).max(500),
});
const spreadBodySchema = z.object({
  cards: z.tuple([cardSchema, cardSchema, cardSchema]),
  layout: z.enum(["sao", "ppf"]),
  sky: z.record(z.string(), z.unknown()),
  natal: z.record(z.string(), z.unknown()),
  voice: z.enum(["root", "blade", "tide"]),
  question: z.string().max(2000).optional(),
  seasonalContext: z.string().max(2000).optional(),
});

/*
  Three-card spread, output as practice. Each position now returns
  interpretation + action. The synthesis is a week-shaped practice:
  an intention for the week + three concrete steps spread across it.
*/

export type SpreadLayout = "sao" | "ppf";

interface RequestBody {
  cards: [Card, Card, Card];
  layout: SpreadLayout;
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  question?: string;
  seasonalContext?: string;
}

export interface SpreadPosition {
  interpretation: string; // 1 sentence
  action: string; // 1 paragraph, concrete, 5-10 min
}

export interface SpreadResponse {
  positions: [SpreadPosition, SpreadPosition, SpreadPosition];
  weekPractice: {
    intention: string; // 1 sentence: what to hold across the week
    steps: { day: string; action: string }[]; // 3 entries — early week, mid week, weekend
  };
}

const LAYOUT_LABELS: Record<SpreadLayout, [string, string, string]> = {
  sao: ["Situation", "Action", "Outcome"],
  ppf: ["Past", "Present", "Future"],
};

const SCHEMA = `{
  "positions": [
    { "interpretation": "1 sentence reading this position's card against the chart and the day.", "action": "1 paragraph, a 5-10 minute concrete practice for this position." }
  ],
  "weekPractice": {
    "intention": "1 sentence: what to hold across the next seven days.",
    "steps": [
      { "day": "Early week | Mid week | Weekend", "action": "1 sentence: a concrete action for that part of the week." }
    ]
  }
}`;

export async function POST(req: Request) {
  if (!(await isSubscribed())) {
    return NextResponse.json(
      { error: "Subscriber-only feature" },
      { status: 402 },
    );
  }

  const { userId } = await auth();
  if (userId) {
    const rl = await rateLimit(userId, "/api/spread");
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.message },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = spreadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data as unknown as RequestBody;

  const positions = LAYOUT_LABELS[body.layout] ?? LAYOUT_LABELS.sao;

  const userMessage = [
    "A three-card spread, output as practice.",
    `Layout: ${positions.join(" / ")}`,
    body.question ? `Question: "${body.question}"` : "",
    body.seasonalContext ? `On the land: ${body.seasonalContext}` : "",
    "",
    "Cards drawn (in position order):",
    body.cards
      .map(
        (c, i) =>
          `  ${positions[i]} — ${c.name} (suit of ${c.suit}). Line on the card: "${c.description}"`,
      )
      .join("\n"),
    "",
    "Today's sky:",
    JSON.stringify(body.sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(body.natal, null, 2),
    "",
    "Read each position specifically as interpretation + concrete 5-10 minute action. Then weave the three together into a week-shaped practice: an intention plus three actions spread across early-week, mid-week, and the weekend.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callOracle<SpreadResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 1800,
      schema: SCHEMA,
      endpoint: "/api/spread",
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
