/*
  Paid one-time reports. Four flavours:
    - natal           — full natal chart interpretation (£20)
    - year_ahead      — month-by-month forecast (£25)
    - saturn_return   — surfaces only inside the return window (£18)
    - eclipse_season  — surfaces only during eclipse seasons (£15)

  Each report is generated once on payment, stored in the `reports` table
  as JSONB, and re-rendered any time after that. Generation runs on the
  Stripe webhook so the user never waits in line — by the time they're
  redirected back from Checkout, the row is in place.

  Report quality matters more than cost here, so we override the default
  model with Opus when set — falls back to Sonnet if ANTHROPIC_REPORT_MODEL
  is absent.
*/

import Anthropic from "@anthropic-ai/sdk";
import { systemPromptFor, type VoiceKey } from "@/lib/voices";
import {
  eclipsesNear,
  isInEclipseSeason,
  saturnReturn,
  type Eclipse,
  type NatalChart,
  type SkyState,
} from "@/lib/astro";

if (typeof window !== "undefined") {
  throw new Error("lib/reports must not be imported in client code");
}

export type ReportType =
  | "natal"
  | "year_ahead"
  | "saturn_return"
  | "eclipse_season";

export interface ReportMeta {
  type: ReportType;
  title: string;
  blurb: string;
  /** Display price in GBP. The authoritative price lives in Stripe. */
  priceGBP: number;
  /** A report's relevance can be conditional on chart + sky. */
  isAvailable(input: { natal: NatalChart; sky: SkyState; date: Date }): boolean;
}

export const REPORT_META: Record<ReportType, ReportMeta> = {
  natal: {
    type: "natal",
    title: "Your natal chart, read in full",
    blurb:
      "A deep reading of every placement in your chart — luminaries, personal planets, social planets, ascendant — written in your chosen voice.",
    priceGBP: 20,
    isAvailable: () => true,
  },
  year_ahead: {
    type: "year_ahead",
    title: "The year ahead",
    blurb:
      "Month by month, twelve readings of the year unfolding against your chart. What's building, what's loosening, what to watch for.",
    priceGBP: 25,
    isAvailable: () => true,
  },
  saturn_return: {
    type: "saturn_return",
    title: "Saturn's return",
    blurb:
      "The Saturn return is not a crisis. It is a settlement. This report names what is being asked of you, what must be set down, and what is being built underneath.",
    priceGBP: 18,
    isAvailable: ({ natal, date }) => {
      const window = saturnReturn(date, natal.saturn);
      return window.active;
    },
  },
  eclipse_season: {
    type: "eclipse_season",
    title: "The eclipse window",
    blurb:
      "Eclipses do not arrive politely. This report reads the current eclipses against your chart and names where the field is being shaken.",
    priceGBP: 15,
    isAvailable: ({ date }) => isInEclipseSeason(date),
  },
};

const MODEL_FOR_REPORTS =
  process.env.ANTHROPIC_REPORT_MODEL ??
  process.env.ANTHROPIC_MODEL ??
  "claude-sonnet-4-5-20250929";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  _client = new Anthropic({ apiKey });
  return _client;
}

// ─── Report data shapes (what's stored in reports.report_json) ──────────

export interface NatalReportJson {
  title: string;
  summary: string;
  luminaries: string;
  personal_planets: string;
  social_planets: string;
  ascendant: string | null;
  synthesis: string;
}

export interface YearAheadMonth {
  month: string; // e.g. "January 2027"
  narrative: string;
  watchFor: string;
}

export interface YearAheadReportJson {
  title: string;
  opening: string;
  months: YearAheadMonth[];
  closing: string;
}

export interface SaturnReturnReportJson {
  title: string;
  whatItMeans: string;
  whatItUndoes: string;
  whatItBuilds: string;
  howToMeetIt: string;
}

export interface EclipseEntry {
  date: string;
  type: "solar" | "lunar";
  sign: string;
  whatItDisturbs: string;
}

export interface EclipseReportJson {
  title: string;
  opening: string;
  eclipses: EclipseEntry[];
  howToMove: string;
}

export type ReportJson =
  | { type: "natal"; data: NatalReportJson }
  | { type: "year_ahead"; data: YearAheadReportJson }
  | { type: "saturn_return"; data: SaturnReturnReportJson }
  | { type: "eclipse_season"; data: EclipseReportJson };

// ─── Generation ─────────────────────────────────────────────────────────

interface GenerateInput {
  type: ReportType;
  voice: VoiceKey;
  natal: NatalChart;
  sky: SkyState;
  date: Date;
}

export async function generateReport(input: GenerateInput): Promise<ReportJson> {
  switch (input.type) {
    case "natal":
      return { type: "natal", data: await generateNatal(input) };
    case "year_ahead":
      return { type: "year_ahead", data: await generateYearAhead(input) };
    case "saturn_return":
      return { type: "saturn_return", data: await generateSaturnReturn(input) };
    case "eclipse_season":
      return { type: "eclipse_season", data: await generateEclipseSeason(input) };
  }
}

async function callJson<T>({
  voice,
  userMessage,
  schema,
  maxTokens,
}: {
  voice: VoiceKey;
  userMessage: string;
  schema: string;
  maxTokens: number;
}): Promise<T> {
  const res = await client().messages.create({
    model: MODEL_FOR_REPORTS,
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
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Empty report response");
  }
  return JSON.parse(stripFences(block.text.trim())) as T;
}

function stripFences(text: string): string {
  if (!text.startsWith("```")) return text;
  const newline = text.indexOf("\n");
  const inner = newline === -1 ? "" : text.slice(newline + 1);
  return inner.replace(/```\s*$/, "").trim();
}

const NATAL_SCHEMA = `{
  "title": "string",
  "summary": "2-3 sentence orientation",
  "luminaries": "3-4 paragraphs on Sun and Moon",
  "personal_planets": "2-3 paragraphs on Mercury, Venus, Mars together",
  "social_planets": "2 paragraphs on Jupiter and Saturn",
  "ascendant": "1-2 paragraphs on rising sign, or the JSON value null if no rising sign was given",
  "synthesis": "1 closing paragraph"
}`;

async function generateNatal({
  voice,
  natal,
}: GenerateInput): Promise<NatalReportJson> {
  return callJson<NatalReportJson>({
    voice,
    maxTokens: 3000,
    schema: NATAL_SCHEMA,
    userMessage: [
      "Write a full natal chart interpretation for this reader. Read each",
      "placement specifically — by sign — and weave them together into a",
      "single voice. Do not summarise the meanings of signs; speak about",
      "this particular configuration. Stay in voice.",
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

const YEAR_SCHEMA = `{
  "title": "string",
  "opening": "1 paragraph orientation",
  "months": [
    { "month": "Month YYYY", "narrative": "2-3 paragraphs", "watchFor": "single short line" }
  ],
  "closing": "1 paragraph"
}`;

async function generateYearAhead({
  voice,
  natal,
  date,
}: GenerateInput): Promise<YearAheadReportJson> {
  const startMonth = new Date(date);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
  });
  return callJson<YearAheadReportJson>({
    voice,
    maxTokens: 5000,
    schema: YEAR_SCHEMA,
    userMessage: [
      "Read the year ahead for this reader month by month. Twelve months",
      "starting from the month given. For each month, ground the reading",
      "in major transits against the natal placements. The watchFor line",
      "is short — a single image, not a list.",
      "",
      "Months to cover (use these exact strings as the `month` field):",
      JSON.stringify(months),
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

const SATURN_SCHEMA = `{
  "title": "string",
  "whatItMeans": "2-3 paragraphs naming what Saturn returning to its natal sign asks of this particular chart",
  "whatItUndoes": "1-2 paragraphs on what is being loosened or removed",
  "whatItBuilds": "1-2 paragraphs on what is being constructed underneath",
  "howToMeetIt": "1-2 paragraphs of practical posture, not advice"
}`;

async function generateSaturnReturn({
  voice,
  natal,
  date,
}: GenerateInput): Promise<SaturnReturnReportJson> {
  const window = saturnReturn(date, natal.saturn);
  return callJson<SaturnReturnReportJson>({
    voice,
    maxTokens: 2500,
    schema: SATURN_SCHEMA,
    userMessage: [
      "Read this reader's Saturn return. Saturn is in their natal sign of",
      `${natal.saturn} and is currently ${
        Math.abs(window.offsetDegrees) < 1
          ? "exactly on natal"
          : window.offsetDegrees < 0
            ? `approaching natal (about ${Math.round(-window.offsetDegrees)}° away)`
            : `separating from natal (about ${Math.round(window.offsetDegrees)}° past exact)`
      }.`,
      "Speak to what this Saturn return — at this specific configuration —",
      "is actually doing. Do not give generic Saturn-return talk.",
      "",
      "Full natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

const ECLIPSE_SCHEMA = `{
  "title": "string",
  "opening": "1-2 paragraphs naming what an eclipse season is doing to this chart",
  "eclipses": [
    { "date": "YYYY-MM-DD", "type": "solar | lunar", "sign": "string", "whatItDisturbs": "1-2 sentences specific to this chart" }
  ],
  "howToMove": "2-3 paragraphs of practical posture"
}`;

async function generateEclipseSeason({
  voice,
  natal,
  date,
}: GenerateInput): Promise<EclipseReportJson> {
  const eclipses: Eclipse[] = eclipsesNear(date, 30);
  return callJson<EclipseReportJson>({
    voice,
    maxTokens: 2500,
    schema: ECLIPSE_SCHEMA,
    userMessage: [
      "Read the current eclipse window against this natal chart. For",
      "each eclipse listed, name where in the chart it lands and what it",
      "is disturbing.",
      "",
      "Eclipses in this window:",
      JSON.stringify(eclipses, null, 2),
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}
