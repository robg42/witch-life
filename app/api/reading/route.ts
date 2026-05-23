import { NextResponse } from "next/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";
import type { NatalChart, SkyState } from "@/lib/astro";

/*
  The daily practice. Receives precomputed SkyState + NatalChart from
  the client, the voice preference, optional question, optional intentions
  the user picked at onboarding, and a condensed summary of recent
  journal entries.

  The model's job is to produce a PRACTICE — gather, do, reflect —
  scaffolded by today's sky and seasonal context. No interpretive
  monologue, no horoscope prose.
*/

interface RequestBody {
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  question?: string;
  recentJournal?: string;
  intentions?: string[]; // user-picked intentions from onboarding
  seasonalContext?: string; // optional almanac line (e.g. "Beltane, hawthorn in bloom")
  dailyCard?: { name: string; suit: string; description: string };
}

export interface PracticeStep {
  duration: string; // "2 min", "30 seconds", "5 minutes"
  action: string;
}

export interface ReadingResponse {
  intentionLine: string; // 1-2 sentences: today's frame in plant/season/phase language
  gather: string[]; // 3-5 concrete items
  steps: PracticeStep[]; // 3-5 actions, total 5-15 min
  reflectionPrompt: string; // 1 specific question for the journal
  cardAction: string | null; // if a card was passed in, 1 paragraph of action
  questionGuidance: string | null; // 2-3 sentences if a question was asked
  journalAwareness: string | null; // 1 sentence acknowledging themes
  tonightNote: string | null; // 1 sentence about tonight, only on lunar events
}

const SCHEMA = `{
  "intentionLine": "1 to 2 sentences. The frame for today's practice in plant/season/moon language. No zodiac terms unless directly naming a specific natal placement that is doing real work today.",
  "gather": ["3 to 5 concrete items the reader can find at home or outside right now. Real physical things only — candle, water, paper, a leaf, a stone, an object from their home. No abstractions."],
  "steps": [
    { "duration": "2 min | 30 seconds | etc", "action": "A specific physical or vocal action. 'Light the candle.' 'Hold the stone in your closed left hand.' 'Say the sentence out loud, twice.' 'Write four lines about X.' Total of all steps must be 5 to 15 minutes." }
  ],
  "reflectionPrompt": "1 specific question the reader will answer in their journal after the practice. Not 'how do you feel.'",
  "cardAction": "If a daily card was provided, a single paragraph reading that card AS AN ACTION the reader can take today. Otherwise the JSON value null.",
  "questionGuidance": "2 to 3 sentences answering the reader's question, ending with a concrete action, if a question was asked. Otherwise the JSON value null.",
  "journalAwareness": "1 sentence acknowledging a theme from the journal summary without quoting it, if a summary was provided. Otherwise the JSON value null.",
  "tonightNote": "1 sentence about tonight, only when today is within 24 hours of new moon, full moon, or an eclipse. Otherwise the JSON value null."
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
      maxTokens: 1500,
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
  const { sky, natal, question, recentJournal, intentions, seasonalContext, dailyCard } =
    body;
  const dateLine = new Date(sky.date).toUTCString();
  return [
    `Today: ${dateLine}`,
    seasonalContext ? `On the land: ${seasonalContext}` : "",
    "",
    "Today's sky (use for grounding, not for listing):",
    JSON.stringify(sky, null, 2),
    "",
    "Reader's natal chart:",
    JSON.stringify(natal, null, 2),
    "",
    intentions && intentions.length > 0
      ? `Reader's chosen intentions for their practice (use to shape what this practice serves): ${intentions.join(", ")}`
      : "",
    dailyCard
      ? `Today's drawn card: ${dailyCard.name} (suit of ${dailyCard.suit}). Line on the card: "${dailyCard.description}". Provide a cardAction that turns this card into a concrete 5-10 minute action for today.`
      : "",
    question ? `\nThe reader has asked: "${question}"\n` : "",
    recentJournal
      ? `\nCondensed summary of the reader's recent journal entries (themes only, never quote verbatim):\n${recentJournal}\n`
      : "",
    "",
    "Generate today's practice. Read the sky against this chart, ground in the season and the land, and produce gather/steps/reflect. The practice must be doable today in 5 to 15 minutes with things the reader can find at home or outside.",
  ]
    .filter(Boolean)
    .join("\n");
}
