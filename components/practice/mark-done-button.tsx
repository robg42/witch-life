"use client";

import { useState } from "react";

/*
  Mark-as-done — small button used on the daily practice, draw, spread,
  and library practice surfaces. Writes one row to the practices table
  via /api/practices. 401 → suggest sign-in; everything else succeeds
  silently into a "Marked" pill.
*/
interface Props {
  practiceType: "daily" | "card" | "spread" | "sabbat" | "library";
  sourceCardName?: string;
  className?: string;
  label?: string;
}

export function MarkDoneButton({
  practiceType,
  sourceCardName,
  className = "",
  label = "Mark as done",
}: Props) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "done" }
    | { kind: "needs-auth" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const submit = async () => {
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/practices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ practiceType, sourceCardName }),
      });
      if (res.status === 401) {
        setState({ kind: "needs-auth" });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setState({
          kind: "error",
          message: body?.error ?? `Server responded ${res.status}`,
        });
        return;
      }
      setState({ kind: "done" });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  if (state.kind === "done") {
    return (
      <span
        className={`inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.25em] text-moss ${className}`}
      >
        ✓ Marked
      </span>
    );
  }

  if (state.kind === "needs-auth") {
    return (
      <span
        className={`inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70 ${className}`}
      >
        Sign in to track your practice
      </span>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={submit}
        disabled={state.kind === "saving"}
        className="font-sans text-xs uppercase tracking-[0.25em] border border-moss/60 bg-moss/10 px-5 py-2 text-moss transition-base hover:bg-moss/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.kind === "saving" ? "Marking…" : label}
      </button>
      {state.kind === "error" && (
        <p className="mt-2 font-sans text-xs text-clay">{state.message}</p>
      )}
    </div>
  );
}
