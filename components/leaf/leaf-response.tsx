"use client";

import { Stamp, Frame } from "@/components/broadsheet";
import Link from "next/link";

/*
  LeafResponse — the dynamic response surface where the oracle's
  answers to user input land. Sits below the OracleInput. Can hold:

    - A question + answer pair (from /api/reading with question)
    - A drawn card with its action (from /api/card)
    - A library lookup (links to /library?q=...)

  Multiple responses accumulate as a stack. The most recent at the top.
*/

export interface LeafEntry {
  id: string;
  kind: "question" | "card" | "library" | "note" | "error";
  prompt: string;
  body?: React.ReactNode;
  meta?: string;
}

interface Props {
  entries: LeafEntry[];
  onDismiss: (id: string) => void;
}

export function LeafResponse({ entries, onDismiss }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {entries.map((e) => (
        <Frame
          key={e.id}
          shadow={e.kind === "error" ? "vermilion" : "ink"}
          className="px-6 py-5 fade-up"
        >
          <div className="flex items-baseline justify-between gap-4">
            <Stamp tone={e.kind === "error" ? "vermilion" : "ink"}>
              {kindLabel(e.kind)}
            </Stamp>
            <div className="flex items-baseline gap-3">
              {e.meta && <span className="almanac">{e.meta}</span>}
              <button
                type="button"
                onClick={() => onDismiss(e.id)}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50 hover:text-vermilion"
              >
                close ✕
              </button>
            </div>
          </div>
          <p className="italic-accent mt-3 text-lg text-ink/85">
            &ldquo;{e.prompt}&rdquo;
          </p>
          {e.body && <div className="mt-4">{e.body}</div>}
        </Frame>
      ))}
    </div>
  );
}

function kindLabel(k: LeafEntry["kind"]): string {
  switch (k) {
    case "question":
      return "Asked";
    case "card":
      return "Card pulled";
    case "library":
      return "Looked up";
    case "note":
      return "Made note";
    case "error":
      return "Could not respond";
  }
}

export function LibraryLookupBody({ query }: { query: string }) {
  return (
    <div>
      <p className="oracle-body text-ink/85">
        Opening the library to{" "}
        <span className="italic-accent">{query}</span>.
      </p>
      <Link
        href={`/library?q=${encodeURIComponent(query)}`}
        className="btn-ink mt-4 no-underline"
      >
        Open the index <span>→</span>
      </Link>
    </div>
  );
}

export function NoteAddedBody() {
  return (
    <p className="oracle-body text-ink/85">
      Added below to today&rsquo;s notes. Edit and inscribe when ready.
    </p>
  );
}
