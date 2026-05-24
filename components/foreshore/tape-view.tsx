"use client";

import { useEffect, useState } from "react";
import type { JournalEntry } from "@/lib/journal";

/*
  TAPE — scrolling archive of past captures. Visualised as a vertical
  teletype roll: each entry is a single dated line, monospace, on the
  CRT. Reverse-chronological. Fetched from /api/journal which already
  RLS-filters to the current user.

  This is the "tape" the Foreshore eventually reads back to its
  operator in the weekly letter — so reading it occasionally is part
  of the relationship.
*/

interface Props {
  onClose: () => void;
  /** Optional onSelectEntry — clicking a row could open it in the future. */
  onSelectEntry?: (entry: JournalEntry) => void;
}

interface ApiShape {
  entries: JournalEntry[];
  error?: string;
}

export function TapeView({ onClose, onSelectEntry }: Props) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; entries: JournalEntry[] }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/journal", { method: "GET" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          if (!cancelled) {
            setState({
              kind: "error",
              message: (body?.error ?? "TAPE UNREADABLE").toUpperCase(),
            });
          }
          return;
        }
        const body = (await res.json()) as ApiShape;
        if (!cancelled) {
          setState({ kind: "ok", entries: body.entries });
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: (e instanceof Error ? e.message : "TAPE UNREADABLE").toUpperCase(),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="fs-stencil">TAPE · ARCHIVE PLAYBACK</p>
        <button type="button" onClick={onClose} className="fs-switch">
          CLOSE
        </button>
      </div>

      {state.kind === "loading" && (
        <p className="fs-mono text-sm text-[var(--fs-phosphor-dim)] fs-phosphor">
          SPOOLING…
        </p>
      )}

      {state.kind === "error" && (
        <p className="fs-mono text-sm text-[var(--fs-alarm)]">{state.message}</p>
      )}

      {state.kind === "ok" && state.entries.length === 0 && (
        <p className="fs-mono text-sm text-[var(--fs-phosphor-dim)] fs-phosphor">
          TAPE EMPTY. FILE A CAPTURE TO BEGIN.
        </p>
      )}

      {state.kind === "ok" && state.entries.length > 0 && (
        <div className="relative">
          <ReelDecoration />
          <ul className="max-h-[22rem] overflow-y-auto border border-[var(--fs-rule)] bg-[var(--fs-housing-3)] px-3 py-3 fs-mono text-sm text-[var(--fs-phosphor)] fs-phosphor">
            {state.entries.map((e, i) => (
              <li
                key={e.id}
                className={
                  "py-2 " +
                  (i < state.entries.length - 1
                    ? "border-b border-[var(--fs-rule)]/30 "
                    : "") +
                  (onSelectEntry ? "cursor-pointer hover:bg-[var(--fs-housing-2)] " : "")
                }
                onClick={() => onSelectEntry?.(e)}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--fs-ivory-dim)]">
                    {formatDate(e.entryDate)}
                    {e.moonPhase && (
                      <span className="ml-3 text-[var(--fs-brass-glint)]">
                        {e.moonPhase}
                      </span>
                    )}
                  </span>
                  <span className="text-[0.6rem] tracking-[0.22em] text-[var(--fs-ivory-dim)]">
                    #{state.entries.length - i}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">
                  {captureLine(e)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Pick the most "operator-like" line from a journal row. The Foreshore
 * captures live in `freeText`, but rows created via the old broadsheet
 * have multiple fields — we concatenate them for display.
 */
function captureLine(e: JournalEntry): string {
  const bits = [e.freeText, e.whatLanded, e.movingToward].filter(
    (s): s is string => Boolean(s),
  );
  return bits.join(" · ");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Two small SVG reels in the corners. Purely decorative — they sit
 * outside the scrollable content so they don't move with the user's
 * scroll. Slow continuous rotation conveys "the tape is playing back."
 */
function ReelDecoration() {
  return (
    <>
      <Reel className="absolute -left-12 top-2 hidden md:block" />
      <Reel className="absolute -right-12 top-2 hidden md:block" reverse />
    </>
  );
}

function Reel({ className, reverse }: { className?: string; reverse?: boolean }) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      className={"h-10 w-10 " + (className ?? "")}
      aria-hidden
      style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.6))" }}
    >
      <g
        style={{
          transformOrigin: "center",
          animation: `fs-reel-spin 6s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        <circle r="38" fill="var(--fs-housing-3)" stroke="var(--fs-brass-dim)" />
        <circle r="8" fill="var(--fs-brass)" stroke="var(--fs-brass-glint)" />
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x = Math.cos(a) * 22;
          const y = Math.sin(a) * 22;
          return (
            <circle
              key={deg}
              cx={x}
              cy={y}
              r="3"
              fill="var(--fs-brass-dim)"
            />
          );
        })}
      </g>
      <style>{`
        @keyframes fs-reel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
