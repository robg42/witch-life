/*
  Energy journal — types and helpers shared by the API, the page, and
  the reading client.

  An entry is anchored to a date and tagged with the moon phase and sun
  sign at the moment of writing. The three text fields mirror the
  prompts in the brief; all are optional but the row is only saved if
  at least one of them is non-empty.
*/

export interface JournalEntryInput {
  whatLanded?: string;
  movingToward?: string;
  freeText?: string;
}

export interface JournalEntry extends JournalEntryInput {
  id: string;
  entryDate: string; // YYYY-MM-DD (UTC)
  moonPhase: string | null;
  sunSign: string | null;
  createdAt: string;
}

export function isInputNonEmpty(input: JournalEntryInput): boolean {
  return Boolean(
    (input.whatLanded && input.whatLanded.trim()) ||
      (input.movingToward && input.movingToward.trim()) ||
      (input.freeText && input.freeText.trim()),
  );
}

/**
 * Summarise the reader's recent journal entries into a short paragraph
 * the oracle can read for context. Deliberately compresses: we want the
 * AI to sense themes, not quote sentences back.
 *
 * The format we feed to Claude is intentionally terse — date stamps
 * plus condensed phrases joined by semicolons. The oracle's house
 * rules tell it to acknowledge without quoting.
 */
export function summariseEntries(entries: JournalEntry[]): string {
  if (entries.length === 0) return "";
  return entries
    .slice(0, 5)
    .map((e) => {
      const parts: string[] = [];
      if (e.whatLanded) parts.push(`landed: ${condense(e.whatLanded)}`);
      if (e.movingToward) parts.push(`moving toward: ${condense(e.movingToward)}`);
      if (e.freeText) parts.push(`free: ${condense(e.freeText)}`);
      return `${e.entryDate} — ${parts.join(" · ")}`;
    })
    .join("\n");
}

function condense(s: string): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 120) return trimmed;
  return trimmed.slice(0, 117) + "…";
}
