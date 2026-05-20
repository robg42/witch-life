import Anthropic from "@anthropic-ai/sdk";
import { systemPromptFor, type VoiceKey } from "@/lib/voices";

/*
  Server-only Claude client. The Anthropic key NEVER leaves the server.
  Every call passes through this module so the voice system prompt and
  cache settings stay consistent.

  Prompt caching: the voice system prompt is static per voice and used
  many times per day. Marking it `cache_control: ephemeral` lets the
  Anthropic cache reuse it for ~5 minutes, cutting prompt cost on
  repeated calls.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/anthropic must not be imported in client code");
}

export const ORACLE_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to .env.local.",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export interface OracleCallOptions {
  voice: VoiceKey;
  userMessage: string;
  maxTokens?: number;
  /**
   * Inline schema description shown to the model so it returns the
   * correct JSON shape. Kept as plain text rather than a JSON Schema
   * blob — Claude follows natural-language schema instructions
   * reliably, and the prompt stays compact.
   */
  schema: string;
}

/**
 * Single Claude call that returns a parsed JSON object. Strips code
 * fences if Claude wraps the response, then JSON.parses. Throws on
 * malformed output — callers should handle and surface a friendly error.
 */
export async function callOracle<T>({
  voice,
  userMessage,
  maxTokens = 1024,
  schema,
}: OracleCallOptions): Promise<T> {
  const response = await client().messages.create({
    model: ORACLE_MODEL,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: systemPromptFor(voice),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${userMessage}\n\nRespond in valid JSON matching this schema:\n${schema}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Oracle returned no text content");
  }
  const raw = stripCodeFences(block.text.trim());
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Oracle returned non-JSON output:\n${raw.slice(0, 300)}`);
  }
}

function stripCodeFences(text: string): string {
  if (text.startsWith("```")) {
    const newline = text.indexOf("\n");
    const inner = newline === -1 ? "" : text.slice(newline + 1);
    return inner.replace(/```\s*$/, "").trim();
  }
  return text;
}
