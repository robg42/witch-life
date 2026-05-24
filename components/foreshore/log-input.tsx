"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  LOG ENTRY — the in-CRT capture input. Two or three sentences max;
  the operator notes something they observed today and files it to
  the archive. The line is committed via POST /api/journal with the
  text going into the `free_text` field (the operator only has one
  field — the journal's old three-field structure is collapsed for
  the Foreshore).

  The textarea grows to its content height up to a cap. Submit on
  CMD/CTRL+ENTER or via the FILE button.
*/

interface Props {
  onClose: () => void;
  onFiled?: (capture: { text: string; entryDate: string }) => void;
  /** Optional channel context to prefill (e.g. "CH 17 — THRESHOLD"). */
  channelHint?: string;
}

export function LogInput({ onClose, onFiled, channelHint }: Props) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "filing" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus on mount.
    taRef.current?.focus();
  }, []);

  const file = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStatus({ kind: "filing" });
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ freeText: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus({
          kind: "error",
          message: (body?.error ?? "FILING FAILED").toUpperCase(),
        });
        return;
      }
      const body = (await res.json()) as {
        entry: { entryDate: string };
      };
      onFiled?.({ text: trimmed, entryDate: body.entry.entryDate });
      onClose();
    } catch (e) {
      setStatus({
        kind: "error",
        message: (e instanceof Error ? e.message : "FILING FAILED").toUpperCase(),
      });
    }
  }, [text, onFiled, onClose]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void file();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <p className="fs-stencil">
        CAPTURE · {channelHint ?? "OPEN ENTRY"}
      </p>
      <p className="fs-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--fs-ivory-dim)]">
        TWO OR THREE LINES. THE OPERATOR WROTE THIS, NOT THE STATION.
      </p>

      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        maxLength={1200}
        placeholder="The kettle whistled and I jumped..."
        className="w-full resize-none border border-[var(--fs-rule-strong)] bg-[var(--fs-housing-3)] px-3 py-3 fs-mono text-[var(--fs-phosphor)] fs-phosphor placeholder:text-[var(--fs-phosphor-dim)] focus:border-[var(--fs-brass-glint)] focus:outline-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="fs-engraved">
          {text.length} / 1200 · ⌘⏎ TO FILE · ESC TO CLOSE
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="fs-switch">
            CANCEL
          </button>
          <button
            type="button"
            onClick={() => void file()}
            disabled={status.kind === "filing" || text.trim().length === 0}
            className="fs-switch"
            aria-pressed={status.kind === "filing"}
          >
            {status.kind === "filing" ? "FILING…" : "▷ FILE CAPTURE"}
          </button>
        </div>
      </div>

      {status.kind === "error" && (
        <p className="fs-mono text-sm text-[var(--fs-alarm)]">
          {status.message}
        </p>
      )}
    </div>
  );
}
