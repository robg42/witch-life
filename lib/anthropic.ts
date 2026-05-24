import Anthropic from "@anthropic-ai/sdk";
import { systemPromptFor, type VoiceKey } from "@/lib/voices";
import {
  currentClerkUserId,
  logApiCall,
  usageFromAnthropic,
} from "@/lib/telemetry";

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

/**
 * The Claude model Witch Life uses for short-form calls (daily
 * practice, card interpretation, three-card spread). Hardcoded so a
 * stray env var can't break things — change here if we ever upgrade.
 */
export const ORACLE_MODEL = "claude-sonnet-4-5-20250929";

/**
 * Validate that an env-var-derived string contains only ASCII (≤127).
 * If not, throw a diagnostic that pinpoints the offending character.
 * Used to catch stray em dashes / curly quotes pasted into Vercel
 * env vars at server-side init time, before the SDK can throw a more
 * cryptic ByteString error.
 */
function assertAscii(name: string, value: string): void {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 127) {
      throw new Error(
        `${name} contains a non-ASCII character at position ${i} ` +
          `(U+${code.toString(16).toUpperCase().padStart(4, "0")}). ` +
          `This is usually a stray em dash or curly quote from copy-pasting. ` +
          `Re-enter the value in your env settings.`,
      );
    }
  }
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to .env.local.",
    );
  }
  assertAscii("ANTHROPIC_API_KEY", apiKey);
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
  /**
   * Logged into api_calls for cost tracking and rate limiting.
   * Defaults to "unknown" — pass the actual route name.
   */
  endpoint?: string;
}

/**
 * Some hosting environments (or chained middlewares between us and
 * api.anthropic.com) reject any HTTP header that contains a character
 * outside the ISO-8859-1 (ByteString) range — producing the
 * "Cannot convert argument to a ByteString" error. When that header is
 * derived from a hash, prefix, or excerpt of the request body, even
 * benign typographic characters (em dash, en dash, curly quotes,
 * ellipsis, non-breaking space) blow it up.
 *
 * The safe move is to fold the typography in our outgoing prompts to
 * their ASCII equivalents. Anthropic doesn't care — semantically the
 * em dash and the two-hyphen sequence are interchangeable here.
 */
function asciiFold(s: string): string {
  return (
    s
      // dashes
      .replace(/[‐-―]/g, "-")
      // single curly quotes & prime
      .replace(/[‘’‚‛′]/g, "'")
      // double curly quotes
      .replace(/[“”„‟″]/g, '"')
      // ellipsis
      .replace(/…/g, "...")
      // non-breaking and friends
      .replace(/[   ]/g, " ")
      // middle dot, bullet
      .replace(/[·•]/g, "·".charCodeAt(0) < 256 ? "·" : "-")
      // ornaments we use in UI but never need in prompts
      .replace(/[❦❧❦❋✻✦]/g, "*")
  );
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
  endpoint = "unknown",
}: OracleCallOptions): Promise<T> {
  const system = asciiFold(systemPromptFor(voice));
  const userContent = asciiFold(
    `${userMessage}\n\nRespond in valid JSON matching this schema:\n${schema}`,
  );

  const clerkUserId = await currentClerkUserId();
  const startedAt = Date.now();

  let response;
  try {
    response = await client().messages.create({
      model: ORACLE_MODEL,
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Best-effort failure log.
    await logApiCall({
      endpoint,
      model: ORACLE_MODEL,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      },
      durationMs: Date.now() - startedAt,
      status: "error",
      errorMessage: msg.slice(0, 500),
      clerkUserId,
    });
    if (msg.includes("ByteString")) {
      throw new Error(
        "Anthropic request rejected non-ASCII content in a header. " +
          "Prompts have been normalised; if this persists, check the " +
          "ANTHROPIC_API_KEY env var for stray characters.",
      );
    }
    throw err;
  }

  // Successful call — log usage + cost.
  await logApiCall({
    endpoint,
    model: ORACLE_MODEL,
    usage: usageFromAnthropic(response.usage),
    durationMs: Date.now() - startedAt,
    status: "ok",
    clerkUserId,
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
