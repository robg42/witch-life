import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { callOracle } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { transmissionPromptFor } from "@/lib/foreshore/voices";
import type { VoiceKey } from "@/lib/voices";
import type { NatalChart, SkyState } from "@/lib/astro";

/*
  /api/transmission — the Foreshore reinterpretation of the daily
  reading. Takes the same astronomical + operator inputs, returns a
  single very short transmission string (5–25 words) in the operator's
  chosen voice (FIELD / CIPHER / LONG-WAVE).

  Rate-limited and telemetry-tagged like the other AI endpoints. We
  deliberately reuse the same Anthropic wrapper (callOracle) so the
  cost-tracking, ASCII-folding, and prompt-cache machinery applies
  identically.
*/

export const dynamic = "force-dynamic";

const transmissionBodySchema = z.object({
  sky: z.record(z.string(), z.unknown()),
  natal: z.record(z.string(), z.unknown()),
  voice: z.enum(["root", "blade", "tide"]),
  intentions: z.array(z.string().max(64)).max(10).optional(),
  recentCaptures: z.string().max(4000).optional(),
  channel: z.object({
    number: z.number().int().min(0).max(27),
    name: z.string().min(1).max(40),
    card: z.object({
      name: z.string(),
      suit: z.string(),
      description: z.string(),
    }),
  }),
});

export interface TransmissionResponse {
  transmission: string;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID JSON" }, { status: 400 });
  }
  const parsed = transmissionBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID BODY", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const { userId } = await auth();
  if (userId) {
    const rl = await rateLimit(userId, "/api/transmission");
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.message.toUpperCase() },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }
  }

  const userMessage = buildPrompt(body as unknown as RequestBody);

  try {
    const text = await callOracle<string>({
      voice: body.voice as VoiceKey,
      systemOverride: transmissionPromptFor(body.voice as VoiceKey),
      userMessage,
      maxTokens: 120,
      schema: "",
      expectJson: false,
      endpoint: "/api/transmission",
    });
    // The model returns the transmission directly. We strip any
    // leading/trailing quotation marks or station-noise the model may
    // wrap around it.
    const transmission = clean(text);
    return NextResponse.json<TransmissionResponse>({ transmission });
  } catch (err) {
    const message =
      err instanceof Error ? err.message.toUpperCase() : "SIGNAL LOST";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

interface RequestBody {
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  intentions?: string[];
  recentCaptures?: string;
  channel: {
    number: number;
    name: string;
    card: { name: string; suit: string; description: string };
  };
}

function buildPrompt(body: RequestBody): string {
  return [
    `STATION 28 — INCOMING TRANSMISSION`,
    `Channel primed: CH ${String(body.channel.number).padStart(2, "0")} — ${body.channel.name}`,
    `Frequency profile: "${body.channel.card.description}"`,
    ``,
    `Atmospherics (current):`,
    JSON.stringify(body.sky, null, 2),
    ``,
    `Operator natal fix:`,
    JSON.stringify(body.natal, null, 2),
    ``,
    body.intentions && body.intentions.length > 0
      ? `Operator standing requests: ${body.intentions.join(", ")}`
      : "",
    body.recentCaptures
      ? `Recent captures (themes only, never quote verbatim):\n${body.recentCaptures}`
      : "",
    ``,
    `Emit a single transmission, 5 to 25 words, in your voice, on this channel, against these atmospherics. No surrounding quotation marks. No preamble. No "transmission:" label. Just the line.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function clean(raw: string): string {
  let s = raw.trim();
  // Strip wrapping quotes if the model added them.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  // Strip a leading "Transmission:" label if the model added it anyway.
  s = s.replace(/^transmission\s*:\s*/i, "");
  // Collapse internal whitespace.
  s = s.replace(/\s+/g, " ");
  return s;
}
