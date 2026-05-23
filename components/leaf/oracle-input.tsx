"use client";

import { useState, useRef, useEffect } from "react";

/*
  OracleInput — the single conversational primitive at the heart of
  the leaf. The reader types one of three rough kinds of thing:

    1. A question for the oracle to answer (default).
    2. A note to add to today's journal entry — prefix "note: …"
    3. A command — "pull a card", "draw three", "library: rosemary"

  We do not parse commands very strictly — anything that isn't a
  recognised command is treated as a question. The leaf owns the
  response display; this component just emits.
*/

export type OracleAction =
  | { kind: "question"; text: string }
  | { kind: "note"; text: string }
  | { kind: "card" }
  | { kind: "library"; query: string };

interface Props {
  onSubmit: (action: OracleAction) => void;
  placeholder?: string;
  busy?: boolean;
}

export function OracleInput({
  onSubmit,
  placeholder = "Ask the oracle, or type note: …, pull a card",
  busy = false,
}: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses the input from anywhere.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = () => {
    const raw = value.trim();
    if (!raw) return;
    const action = parse(raw);
    onSubmit(action);
    setValue("");
  };

  return (
    <div className="border-[2px] border-ink bg-paper-3 ink-shadow">
      <div className="rule-b px-5 py-2 flex items-baseline justify-between almanac">
        <span>Speak</span>
        <span className="text-ink/50">
          press <kbd className="font-mono text-vermilion">/</kbd> to focus
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-stretch"
      >
        <span className="flex items-center px-4 text-vermilion font-display italic text-3xl leading-none">
          ❦
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="flex-1 bg-transparent py-4 pr-4 font-serif text-lg text-ink outline-none placeholder:italic placeholder:text-ink/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="border-l-[1.5px] border-rule px-5 py-3 bg-vermilion text-paper font-mono text-xs uppercase tracking-[0.18em] transition-base hover:bg-rust disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading…" : "Ask"}
        </button>
      </form>
      <div className="rule-t px-5 py-2 almanac flex flex-wrap gap-x-4 gap-y-1 text-ink/60">
        <Hint>Question — anything</Hint>
        <Hint>
          note: <span className="italic-accent normal-case text-ink/70">…</span>
        </Hint>
        <Hint>pull a card</Hint>
        <Hint>
          library: <span className="italic-accent normal-case text-ink/70">rosemary</span>
        </Hint>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-ink/60">·{" "}{children}</span>;
}

function parse(raw: string): OracleAction {
  const lower = raw.toLowerCase();
  // Note: …
  if (lower.startsWith("note:") || lower.startsWith("note ")) {
    return { kind: "note", text: raw.slice(5).trim() };
  }
  // Library: …
  if (lower.startsWith("library:") || lower.startsWith("library ")) {
    return { kind: "library", query: raw.slice(8).trim() };
  }
  // Card pull
  if (
    /^(pull|draw)\s+(a|another|me\s+a|me)?\s*card$/i.test(raw.trim()) ||
    lower === "pull a card" ||
    lower === "draw a card"
  ) {
    return { kind: "card" };
  }
  return { kind: "question", text: raw };
}
