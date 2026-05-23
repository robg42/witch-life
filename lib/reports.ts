/*
  Paid one-time reports — now written as PRACTICE PLANS, not interpretive
  prose. Four flavours:
    - natal           — every placement translated into a recurring
                        practice for this chart (£20)
    - year_ahead      — a practice per month for the next twelve (£25)
    - saturn_return   — the practice for the Saturn-return season,
                        surfaces only inside the window (£18)
    - eclipse_season  — the eclipse-window practice, surfaces only
                        during eclipse seasons (£15)

  Each report is generated once on payment, stored in the `reports` table
  as JSONB, and rendered by components/reports/report-renderer.tsx.
  Generation runs on the Stripe webhook.
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
  isAvailable(input: { natal: NatalChart; sky: SkyState; date: Date }): boolean;
}

export const REPORT_META: Record<ReportType, ReportMeta> = {
  natal: {
    type: "natal",
    title: "Your chart, as practice",
    blurb:
      "Every placement in your chart turned into a real practice you can do. Eight placements, eight rituals, one synthesis. Yours to keep and return to.",
    priceGBP: 20,
    isAvailable: () => true,
  },
  year_ahead: {
    type: "year_ahead",
    title: "A year of practice",
    blurb:
      "Twelve months of practices, each shaped by what is moving in the sky against your chart that month. A practice per month — concrete, doable, yours.",
    priceGBP: 25,
    isAvailable: () => true,
  },
  saturn_return: {
    type: "saturn_return",
    title: "The Saturn-return practice",
    blurb:
      "Saturn returning to its natal sign is not a crisis but a settlement. This report names what is being asked of you and gives you a recurring weekly practice for the duration.",
    priceGBP: 18,
    isAvailable: ({ natal, date }) => {
      const window = saturnReturn(date, natal.saturn);
      return window.active;
    },
  },
  eclipse_season: {
    type: "eclipse_season",
    title: "The eclipse practice",
    blurb:
      "Eclipses do not arrive politely. This report reads the current eclipses against your chart and gives you a specific practice for each one.",
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

// ─── Shared practice shape ─────────────────────────────────────────────

export interface PracticeBlock {
  gather: string[];
  steps: { duration: string; action: string }[];
  reflectionPrompt: string;
}

// ─── Report data shapes (what's stored in reports.report_json) ──────────

export interface NatalPlacementPractice {
  /** e.g. "Sun in Taurus", "Moon in Pisces", "Rising in Capricorn" */
  placement: string;
  /** 2-3 sentences: what this placement asks of the reader */
  asks: string;
  /** A recurring practice this placement specifically wants */
  practice: PracticeBlock;
}

export interface NatalReportJson {
  title: string;
  overview: string; // 2-3 sentences orienting the reader
  placements: NatalPlacementPractice[]; // 7 or 8 entries
  synthesis: string; // 1-2 paragraph close
}

export interface YearAheadMonth {
  month: string; // "May 2026"
  theme: string; // 1 sentence
  practice: PracticeBlock;
}

export interface YearAheadReportJson {
  title: string;
  opening: string;
  months: YearAheadMonth[];
  closing: string;
}

export interface SaturnAsk {
  ask: string; // 1 sentence
  expansion: string; // 1-2 sentences
}

export interface SaturnReturnReportJson {
  title: string;
  opening: string; // 1-2 paragraphs
  threeAsks: SaturnAsk[]; // exactly 3
  weeklyPractice: PracticeBlock; // a practice to repeat each week of the window
  closing: string; // 1 paragraph
}

export interface EclipseEntry {
  date: string;
  type: "solar" | "lunar";
  sign: string;
  practice: PracticeBlock;
}

export interface EclipseReportJson {
  title: string;
  opening: string;
  eclipses: EclipseEntry[];
  followUp: string; // 1-2 paragraphs: how to keep tending after the window
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

const PRACTICE_BLOCK_SCHEMA = `{
    "gather": ["3-5 real, findable items"],
    "steps": [{ "duration": "2 min | 30s | etc", "action": "specific physical/vocal action" }],
    "reflectionPrompt": "1 specific question for the journal"
  }`;

// ─── Natal ──────────────────────────────────────────────────────────────

const NATAL_SCHEMA = `{
  "title": "string",
  "overview": "2-3 sentences orienting the reader to what this report is for.",
  "placements": [
    {
      "placement": "Sun in Taurus / Moon in Pisces / etc — name the placement explicitly",
      "asks": "2-3 sentences: what this placement is asking the reader to learn and inhabit",
      "practice": ${PRACTICE_BLOCK_SCHEMA}
    }
  ],
  "synthesis": "1-2 paragraphs weaving the placements into one practice arc"
}`;

async function generateNatal({
  voice,
  natal,
}: GenerateInput): Promise<NatalReportJson> {
  return callJson<NatalReportJson>({
    voice,
    maxTokens: 6000,
    schema: NATAL_SCHEMA,
    userMessage: [
      "Translate this reader's natal chart into a practice plan. For each",
      "major placement (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn,",
      "and Rising if present), give a 2-3 sentence reading of what that",
      "placement asks of the reader followed by a CONCRETE PRACTICE that",
      "placement wants — gather, steps with durations, reflection prompt.",
      "",
      "Each practice is a recurring one the reader can return to whenever",
      "they want to tend that part of their chart. Not generic sign",
      "descriptions — this specific configuration.",
      "",
      "End with a synthesis: how the eight placements ask to be held",
      "together over time.",
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

// ─── Year ahead ────────────────────────────────────────────────────────

const YEAR_SCHEMA = `{
  "title": "string",
  "opening": "1-2 paragraphs orienting the reader to the year",
  "months": [
    {
      "month": "Month YYYY — use the exact strings provided",
      "theme": "1 sentence naming what this month is for",
      "practice": ${PRACTICE_BLOCK_SCHEMA}
    }
  ],
  "closing": "1-2 paragraphs closing the year"
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
    maxTokens: 8000,
    schema: YEAR_SCHEMA,
    userMessage: [
      "Build a year-of-practice plan. Twelve months from the month given.",
      "Each month gets a theme (1 sentence, grounded in what's moving in",
      "the sky against this chart that month) and a CONCRETE PRACTICE",
      "for the month — gather, steps with durations, reflection prompt.",
      "The practice can be done on a specific day of the month or",
      "repeated weekly through the month.",
      "",
      "Months to cover (use these exact strings as the `month` field):",
      JSON.stringify(months),
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

// ─── Saturn return ─────────────────────────────────────────────────────

const SATURN_SCHEMA = `{
  "title": "string",
  "opening": "1-2 paragraphs naming what Saturn returning to this specific natal sign is doing to this chart",
  "threeAsks": [
    { "ask": "1 sentence: a specific thing this Saturn return is asking the reader to do/become",
      "expansion": "1-2 sentences explaining the ask" }
  ],
  "weeklyPractice": ${PRACTICE_BLOCK_SCHEMA},
  "closing": "1 paragraph: how to know when the return has done its work"
}`;

async function generateSaturnReturn({
  voice,
  natal,
  date,
}: GenerateInput): Promise<SaturnReturnReportJson> {
  const window = saturnReturn(date, natal.saturn);
  return callJson<SaturnReturnReportJson>({
    voice,
    maxTokens: 3000,
    schema: SATURN_SCHEMA,
    userMessage: [
      "Build a Saturn-return practice for this reader. Saturn is in their",
      `natal sign of ${natal.saturn}, currently ${
        Math.abs(window.offsetDegrees) < 1
          ? "exactly on natal"
          : window.offsetDegrees < 0
            ? `approaching natal (about ${Math.round(-window.offsetDegrees)}° away)`
            : `separating from natal (about ${Math.round(window.offsetDegrees)}° past exact)`
      }.`,
      "",
      "Open with what this specific Saturn return is doing. Name three",
      "asks: concrete things Saturn is asking of THIS chart (not generic",
      "Saturn-return talk). Then give a single weekly practice the reader",
      "can repeat every week for the duration of the return window.",
      "Close with how to recognise when the return has done its work.",
      "",
      "Full natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}

// ─── Eclipse ───────────────────────────────────────────────────────────

const ECLIPSE_SCHEMA = `{
  "title": "string",
  "opening": "1-2 paragraphs on what this eclipse window is doing to this chart",
  "eclipses": [
    {
      "date": "YYYY-MM-DD",
      "type": "solar | lunar",
      "sign": "string",
      "practice": ${PRACTICE_BLOCK_SCHEMA}
    }
  ],
  "followUp": "1-2 paragraphs: how to keep tending the disturbance after the window closes"
}`;

async function generateEclipseSeason({
  voice,
  natal,
  date,
}: GenerateInput): Promise<EclipseReportJson> {
  const eclipses: Eclipse[] = eclipsesNear(date, 30);
  return callJson<EclipseReportJson>({
    voice,
    maxTokens: 3500,
    schema: ECLIPSE_SCHEMA,
    userMessage: [
      "Build a practice plan for the current eclipse window. For each",
      "eclipse in the window, give a CONCRETE PRACTICE the reader can do",
      "ON or NEAR the day of that eclipse — gather, steps with durations,",
      "reflection prompt. Then a follow-up practice for the weeks after",
      "the window closes.",
      "",
      "Eclipses in this window:",
      JSON.stringify(eclipses, null, 2),
      "",
      "Natal chart:",
      JSON.stringify(natal, null, 2),
    ].join("\n"),
  });
}
