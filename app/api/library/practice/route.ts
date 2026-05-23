import { NextResponse } from "next/server";
import { isSubscribed } from "@/lib/subscription";
import { callOracle } from "@/lib/anthropic";
import { correspondenceById } from "@/lib/correspondences";
import type { VoiceKey } from "@/lib/voices";

/*
  Generates a single-correspondence practice on demand. Subscriber-only.
  Input: the correspondence id (e.g. "rosemary") and the user's voice +
  current sky. Output: a 5-10 minute practice using that specific
  thing.
*/

interface RequestBody {
  correspondenceId: string;
  voice: VoiceKey;
  seasonalContext?: string;
  intention?: string;
}

export interface LibraryPracticeResponse {
  title: string; // short — "A rosemary clearing", "A candle dedication"
  intentionLine: string; // 1 sentence
  gather: string[];
  steps: { duration: string; action: string }[];
  reflectionPrompt: string;
}

const SCHEMA = `{
  "title": "Short title for this practice — 3 to 5 words.",
  "intentionLine": "1 sentence: what the practice is for, named in plant/season/object language.",
  "gather": ["3 to 5 real, findable items. The correspondence MUST be one of them."],
  "steps": [
    { "duration": "2 min | 30 seconds | etc", "action": "A specific physical action. Total 5 to 10 minutes." }
  ],
  "reflectionPrompt": "1 specific question for the journal afterward."
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

  const correspondence = correspondenceById(body.correspondenceId);
  if (!correspondence) {
    return NextResponse.json(
      { error: "Unknown correspondence" },
      { status: 400 },
    );
  }

  const userMessage = [
    `Generate a single-correspondence practice using: ${correspondence.name} (${correspondence.type}).`,
    `Traditional uses: ${correspondence.traditionalUses.join("; ")}.`,
    `Practice hint to scaffold from: ${correspondence.practiceHint}`,
    body.intention
      ? `\nThe reader wants this practice to serve: ${body.intention}.`
      : "",
    body.seasonalContext
      ? `\nOn the land right now: ${body.seasonalContext}`
      : "",
    "",
    "The practice is 5 to 10 minutes. Gather must include the named correspondence. Steps are specific. Reflection prompt is one question.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callOracle<LibraryPracticeResponse>({
      voice: body.voice,
      userMessage,
      maxTokens: 700,
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
