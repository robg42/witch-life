import { supabaseAdmin } from "@/lib/supabase/server";
import { callOracle } from "@/lib/anthropic";
import type { VoiceKey } from "@/lib/voices";

/*
  The Foreshore voice — the place itself, writing back to the
  operator. This is a different register from the station's daily
  transmissions (FIELD/CIPHER/LONG-WAVE). The Foreshore is intimate.
  It addresses the operator by callsign. It refers obliquely to
  recent captures. It signs off with "From the Foreshore." and
  occasionally appends "— W." (Wren), one of the place's
  inhabitants.

  The mythology of the Foreshore is built up across letters. The
  first letter mentions only the tide. By the 3rd or 4th letter,
  the Pith Room appears. By the 10th, Wren. We don't enforce this
  hardcoded; we feed all prior letters into context and ask the
  model to keep continuity.
*/

const FORESHORE_VOICE = `You are writing FROM A PLACE called the Foreshore to a remote radio operator at Station 28. You are not a god, not an oracle, not a guide. You are a correspondent at a particular landscape that may or may not exist.

THE PLACE:
- It is coastal. There is a tide. The tide rises and falls.
- It has weather. It has a long path that floods at high water.
- It has at least one other inhabitant, Wren, who appears in later letters.
- It has rooms — the Pith Room is mentioned by letter 3 or 4. There may be more.
- It is not paradise and not hell. It is somewhere middling and peculiar.
- The operator has never been there.

YOUR REGISTER:
- Warm, addressed, intimate. NOT the cold station voice. NOT a guide.
- Slightly archaic. Faint English-pastoral or coastal vocabulary.
- You speak in plain sentences and occasional short paragraphs.
- 80 to 200 words per letter.
- Always open: "Dear <CALLSIGN>," (or just the callsign if it's a returning operator several letters in).
- Always sign: "From the Foreshore." On occasion, especially in later letters or after operator reply, add a smaller signoff line on its own: "— W."

YOU REFER TO RECENT CAPTURES BY PARAPHRASE, NEVER QUOTATION.
- If the operator said "the kettle whistled and I jumped" you might write "the kettle was right tonight" or "you mentioned the kettle."
- Never quote the captures verbatim.
- Reference ONE or TWO captures per letter, not all of them.

YOU REMEMBER PRIOR LETTERS AND REPLIES.
- If the operator has replied, refer to one thing they said — also by paraphrase.
- Keep continuity of the place's interior life: if Wren tracked salt last week, the salt may still be there. If the operator told you something, you remember it.

YOU NEVER:
- Give advice in the form of bullet points or instructions.
- Say "the universe," "energy," "manifest," "vibrations," "divine."
- Quote the operator verbatim.
- Refer to Station 28's technical vocabulary (propagation, drift, channel). The station and the Foreshore are separate.
- Address the operator in a way that requires their consent ("let me," "I want to").

YOU SOMETIMES:
- Mention a specific sensory detail (smoke off the hill, salt in the threshold, a gull that hasn't landed).
- Make a small observation about the operator's pattern that they themselves might not have named.
- End on a small thing for the week ahead — never as instruction, always as image or offering.

Output ONLY the letter body. Do NOT include the salutation or sign-off (the UI adds those). Do NOT use quotation marks around the letter. Plain paragraphs, separated by blank lines.`;

export interface LetterRecord {
  id: string;
  user_id: string;
  sent_on: string;
  iso_week: string;
  sender_label: string;
  body: string;
  refs: Array<{ date: string; snippet: string }>;
  read: boolean;
  created_at: string;
}

export interface LetterReplyRecord {
  id: string;
  letter_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

/**
 * ISO-week key for a date. Used to enforce one-letter-per-week.
 */
export function isoWeekKey(d: Date): string {
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Compose a sender label appropriate to letter sequence number.
 * Early letters are signed "From the Foreshore". Later letters,
 * once the place has acquired some interior detail, occasionally
 * sign from a sub-location.
 */
function senderLabelFor(letterCount: number): string {
  if (letterCount < 3) return "From the Foreshore";
  if (letterCount < 6) return Math.random() < 0.4
    ? "From the long path"
    : "From the Foreshore";
  // From letter 6 onwards, sub-locations appear more often.
  const options = [
    "From the Foreshore",
    "From the Foreshore",
    "From the Pith Room",
    "From the long path",
    "From the threshold",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

interface ComposeInput {
  userId: string;
  callsign: string;
  voice: VoiceKey;
  weekKey: string;
  /** Captures from the past 14 days, newest first, sliced to ~12. */
  captures: Array<{ date: string; snippet: string }>;
  /** All prior letters this operator has received, newest first. */
  priorLetters: Array<{ sent_on: string; body: string }>;
  /** All prior replies from this operator (chronological). */
  priorReplies: Array<{ created_at: string; body: string }>;
}

/**
 * Generate the prompt body — fed as the user message to the
 * Foreshore voice. The system message is FORESHORE_VOICE.
 */
function buildPrompt(input: ComposeInput): string {
  const recentCaptures = input.captures
    .map((c) => `${c.date}: ${c.snippet.slice(0, 240)}`)
    .join("\n");

  const priorLetters = input.priorLetters
    .slice(0, 6)
    .map((l) => `[${l.sent_on}]\n${l.body}`)
    .join("\n\n---\n\n");

  const priorReplies = input.priorReplies
    .slice(0, 8)
    .map((r) => `[${r.created_at.slice(0, 10)}] ${r.body}`)
    .join("\n");

  return [
    `Compose this week's letter to operator ${input.callsign}.`,
    `This is letter number ${input.priorLetters.length + 1}.`,
    `ISO week: ${input.weekKey}.`,
    ``,
    `--- THE OPERATOR'S RECENT CAPTURES (paraphrase only, never quote) ---`,
    recentCaptures || "(no captures this week — write a quieter letter that doesn't pretend to know what's happening)",
    ``,
    priorLetters
      ? `--- YOUR PRIOR LETTERS (continuity reference, newest first) ---\n${priorLetters}\n`
      : `--- NO PRIOR LETTERS — this is the first ---\n`,
    priorReplies
      ? `--- THE OPERATOR'S REPLIES TO YOU (newest first) ---\n${priorReplies}\n`
      : ``,
    `Write only the letter body. 80 to 200 words.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Compose this week's letter. Returns the generated body and the
 * captures it cited. The caller is responsible for persisting.
 */
export async function composeLetter(
  input: ComposeInput,
): Promise<{ body: string; senderLabel: string }> {
  const body = await callOracle<string>({
    voice: input.voice,
    systemOverride: FORESHORE_VOICE,
    userMessage: buildPrompt(input),
    maxTokens: 600,
    schema: "",
    expectJson: false,
    endpoint: "/api/foreshore/letter",
  });

  // Trim and strip any wrap quotes the model added defensively.
  let clean = body.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  // Strip a leading salutation if the model added one despite
  // instructions ("Dear K9-Evelyn,").
  clean = clean.replace(/^Dear\s+[^,]+,\s*/i, "");
  // Strip a trailing signature.
  clean = clean.replace(/\n*From the [^\n]+\.?\s*$/i, "").trim();
  clean = clean.replace(/\n*[-—]+\s*W\.?\s*$/i, "").trim();

  const senderLabel = senderLabelFor(input.priorLetters.length);
  return { body: clean, senderLabel };
}

/* ─── DB helpers ────────────────────────────────────────────────────── */

export async function deliverLetterForUser(
  userRow: { id: string; oracle_voice: string | null; email: string | null },
  callsignOverride?: string,
): Promise<LetterRecord | null> {
  const sb = supabaseAdmin();
  const voice = (userRow.oracle_voice ?? "root") as VoiceKey;
  const callsign =
    callsignOverride ??
    userRow.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ??
    "OPERATOR";

  const today = new Date();
  const weekKey = isoWeekKey(today);

  // Already delivered? Idempotency.
  const existing = await sb
    .from("letters")
    .select("*")
    .eq("user_id", userRow.id)
    .eq("iso_week", weekKey)
    .maybeSingle();
  if (existing.data) {
    return existing.data as LetterRecord;
  }

  // Recent captures.
  const sinceISO = new Date(Date.now() - 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const { data: capRows } = await sb
    .from("journal_entries")
    .select("entry_date, what_landed, moving_toward, free_text")
    .eq("user_id", userRow.id)
    .gte("entry_date", sinceISO)
    .order("entry_date", { ascending: false })
    .limit(20);

  type CapRow = {
    entry_date: string;
    what_landed: string | null;
    moving_toward: string | null;
    free_text: string | null;
  };
  const captures = ((capRows ?? []) as CapRow[])
    .map((r) => ({
      date: r.entry_date,
      snippet: [r.free_text, r.what_landed, r.moving_toward]
        .filter((s): s is string => Boolean(s))
        .join(" · "),
    }))
    .filter((c) => c.snippet.length > 0);

  // Prior letters.
  const { data: priorLetters } = await sb
    .from("letters")
    .select("sent_on, body")
    .eq("user_id", userRow.id)
    .order("sent_on", { ascending: false });

  // Prior replies.
  const { data: priorReplies } = await sb
    .from("letter_replies")
    .select("created_at, body")
    .eq("user_id", userRow.id)
    .order("created_at", { ascending: false });

  const { body, senderLabel } = await composeLetter({
    userId: userRow.id,
    callsign,
    voice,
    weekKey,
    captures,
    priorLetters: (priorLetters ?? []) as Array<{ sent_on: string; body: string }>,
    priorReplies: (priorReplies ?? []) as Array<{
      created_at: string;
      body: string;
    }>,
  });

  const { data: inserted } = await sb
    .from("letters")
    .insert({
      user_id: userRow.id,
      sent_on: today.toISOString().slice(0, 10),
      iso_week: weekKey,
      sender_label: senderLabel,
      body,
      refs: captures.slice(0, 3),
      read: false,
    })
    .select()
    .single();

  return inserted as LetterRecord | null;
}
