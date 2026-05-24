"use client";

import { useState } from "react";
import type { LetterRecord } from "@/lib/foreshore/letters";

/*
  LETTER_OPEN — the only CRT panel that renders in PAPER mode
  instead of phosphor. The CRT becomes warm cream paper. The
  letter is laid into the screen like a sheet onto a desk.

  Below the letter the operator has REPLY / FILE / CLOSE. REPLY
  opens a cream-paper textarea over the letter; submit POSTs to
  /api/foreshore/reply. Replies are stored but the Foreshore never
  acknowledges them directly — the acknowledgement, if any,
  appears in the NEXT letter.
*/

export function LetterView({
  letter,
  callsign,
  onClose,
}: {
  letter: LetterRecord;
  callsign: string;
  onClose: () => void;
}) {
  const [composing, setComposing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setReplyStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/foreshore/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          letterId: letter.id,
          body: replyText.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setReplyStatus({
          kind: "error",
          message: (body?.error ?? "REPLY NOT SENT").toUpperCase(),
        });
        return;
      }
      setReplyStatus({ kind: "sent" });
      // After a beat, return to the letter view.
      window.setTimeout(() => {
        setComposing(false);
        setReplyText("");
        setReplyStatus({ kind: "idle" });
      }, 1400);
    } catch (e) {
      setReplyStatus({
        kind: "error",
        message: (e instanceof Error ? e.message : "REPLY NOT SENT").toUpperCase(),
      });
    }
  };

  return (
    <article className="relative">
      {/* The letter body */}
      <div className="space-y-5">
        <header className="text-right">
          <p className="font-[family-name:var(--fs-font-paper)] not-italic text-sm tracking-wide text-[var(--fs-paper-ink)]">
            {letter.sender_label} — {formatPaperDate(letter.sent_on)}
          </p>
        </header>

        <p className="font-[family-name:var(--fs-font-paper)] not-italic text-lg text-[var(--fs-paper-ink)]">
          Dear {callsign},
        </p>

        <div className="font-[family-name:var(--fs-font-paper)] text-lg leading-[1.7] text-[var(--fs-paper-ink)]">
          {letter.body.split(/\n\n+/).map((para, i) => (
            <p key={i} className="mt-3 first:mt-0">
              {para}
            </p>
          ))}
        </div>

        <footer className="space-y-1 pt-4 text-right">
          <p className="font-[family-name:var(--fs-font-paper)] text-lg text-[var(--fs-paper-ink)]">
            {letter.sender_label}.
          </p>
          {letter.sender_label === "From the Pith Room" ||
          letter.refs.length > 1 ? (
            <p className="font-[family-name:var(--fs-font-paper)] text-base text-[var(--fs-paper-ink)]/70">
              — W.
            </p>
          ) : null}
        </footer>
      </div>

      {/* Action row */}
      {!composing && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--fs-paper-shadow)] pt-5">
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="border border-[var(--fs-paper-ink)] bg-transparent px-4 py-2 font-[family-name:var(--fs-font-mono)] text-[0.65rem] uppercase tracking-[0.22em] text-[var(--fs-paper-ink)] not-italic hover:bg-[var(--fs-paper-ink)] hover:text-[var(--fs-paper)]"
          >
            ▶ REPLY
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--fs-paper-ink)] bg-transparent px-4 py-2 font-[family-name:var(--fs-font-mono)] text-[0.65rem] uppercase tracking-[0.22em] text-[var(--fs-paper-ink)] not-italic hover:bg-[var(--fs-paper-ink)] hover:text-[var(--fs-paper)]"
          >
            FILE & CLOSE
          </button>
        </div>
      )}

      {/* Reply composer slides up over the letter */}
      {composing && (
        <div
          className="absolute inset-x-0 bottom-0 top-12 border-t-2 border-[var(--fs-paper-shadow)] bg-[var(--fs-paper)] p-4"
          style={{
            animation: "fs-paper-slide 0.34s cubic-bezier(0.25, 0.9, 0.35, 1)",
          }}
        >
          <p className="font-[family-name:var(--fs-font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--fs-paper-ink)]/70">
            REPLY TO {letter.sender_label.toUpperCase()}
          </p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write back. The Foreshore will read this when it next writes."
            rows={6}
            maxLength={3500}
            autoFocus
            className="mt-2 w-full resize-none border-0 bg-transparent font-[family-name:var(--fs-font-paper)] text-lg leading-[1.7] text-[var(--fs-paper-ink)] outline-none placeholder:text-[var(--fs-paper-ink)]/40"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--fs-paper-shadow)] pt-3">
            <span className="font-[family-name:var(--fs-font-mono)] text-[0.55rem] uppercase tracking-[0.22em] text-[var(--fs-paper-ink)]/60 not-italic">
              {replyStatus.kind === "sent"
                ? "FILED. THE FORESHORE WILL READ IT BEFORE WRITING NEXT."
                : `${replyText.length} / 3500 · REPLIES ARE NEVER ANSWERED DIRECTLY · CMD+ENTER`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposing(false);
                  setReplyText("");
                  setReplyStatus({ kind: "idle" });
                }}
                disabled={replyStatus.kind === "sending"}
                className="border border-[var(--fs-paper-ink)] bg-transparent px-3 py-1 font-[family-name:var(--fs-font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--fs-paper-ink)] not-italic hover:bg-[var(--fs-paper-ink)] hover:text-[var(--fs-paper)] disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void sendReply()}
                disabled={
                  replyStatus.kind === "sending" ||
                  replyStatus.kind === "sent" ||
                  replyText.trim().length === 0
                }
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    void sendReply();
                  }
                }}
                className="border border-[var(--fs-paper-ink)] bg-[var(--fs-paper-ink)] px-3 py-1 font-[family-name:var(--fs-font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--fs-paper)] not-italic hover:bg-transparent hover:text-[var(--fs-paper-ink)] disabled:opacity-50"
              >
                {replyStatus.kind === "sending"
                  ? "FILING…"
                  : replyStatus.kind === "sent"
                    ? "FILED"
                    : "▶ FILE REPLY"}
              </button>
            </div>
          </div>

          {replyStatus.kind === "error" && (
            <p className="mt-2 font-[family-name:var(--fs-font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--fs-alarm)] not-italic">
              {replyStatus.message}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes fs-paper-slide {
          from { transform: translateY(20%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </article>
  );
}

function formatPaperDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
