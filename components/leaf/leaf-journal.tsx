"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import type { JournalEntry } from "@/lib/journal";
import { Stamp } from "@/components/broadsheet";

/*
  Inline journal panel on the leaf. Instead of sending the reader to a
  separate /journal page, they write into the leaf itself. Today's
  entry (if it exists) is loaded so they can extend rather than create
  a new one each interaction.

  Unauthenticated readers see a stub inviting them to sign in.
*/

interface Props {
  /** External notes appended by the OracleInput's "note:" command. */
  appendedNote?: string;
}

export function LeafJournal({ appendedNote }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const [whatLanded, setWhatLanded] = useState("");
  const [movingToward, setMovingToward] = useState("");
  const [freeText, setFreeText] = useState("");
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);
  const [state, setState] = useState<
    "idle" | "loading" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Append a note that arrived from the oracle input into the free
  // text field, so the user sees it and can extend it.
  useEffect(() => {
    if (!appendedNote) return;
    setFreeText((cur) =>
      cur ? `${cur}\n\n${appendedNote}` : appendedNote,
    );
  }, [appendedNote]);

  // Load today's existing entry (if any) once we know the user is signed in.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setState("loading");
    fetch("/api/journal", { method: "GET" })
      .then((res) => res.json())
      .then((body: { entries?: JournalEntry[] }) => {
        const todayISO = new Date().toISOString().slice(0, 10);
        const today = (body.entries ?? []).find(
          (e) => e.entryDate === todayISO,
        );
        if (today) {
          setTodayEntry(today);
          setWhatLanded(today.whatLanded ?? "");
          setMovingToward(today.movingToward ?? "");
          setFreeText(today.freeText ?? "");
        }
        setState("idle");
      })
      .catch(() => setState("idle"));
  }, [isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="rule-t pt-5">
        <div className="almanac">Notes</div>
        <p className="oracle-body mt-3 text-ink/80">
          <Link href="/sign-in" className="wl-link">
            Sign in
          </Link>{" "}
          to write into today&rsquo;s leaf. The oracle reads your notes
          before it speaks again.
        </p>
      </div>
    );
  }

  const save = async () => {
    if (!whatLanded.trim() && !movingToward.trim() && !freeText.trim()) {
      setError("Write something first.");
      return;
    }
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ whatLanded, movingToward, freeText }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Server responded ${res.status}`);
      }
      setState("saved");
      // Mark as done — the daily practice is implicitly completed when
      // the journal entry lands.
      fetch("/api/practices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ practiceType: "daily" }),
      }).catch(() => {});
      // Soft reset back to idle after a beat so the reader can edit
      // again.
      setTimeout(() => setState("idle"), 2400);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not save");
    }
  };

  return (
    <div className="rule-t pt-5 fade-up">
      <div className="flex items-baseline justify-between almanac">
        <span>Notes · for today</span>
        {todayEntry ? (
          <Stamp tone="sage">Entry started</Stamp>
        ) : (
          <span className="text-ink/50">A fresh leaf</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="What I did">
          <textarea
            value={whatLanded}
            onChange={(e) => setWhatLanded(e.target.value)}
            rows={3}
            placeholder="The practice today: what you gathered, what you did."
            className="broadsheet-input"
          />
        </Field>
        <Field label="What&rsquo;s moving">
          <textarea
            value={movingToward}
            onChange={(e) => setMovingToward(e.target.value)}
            rows={3}
            placeholder="What&rsquo;s underneath the visible."
            className="broadsheet-input"
          />
        </Field>
      </div>

      <Field label="And the rest" className="mt-5">
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={4}
          placeholder="Open field."
          className="broadsheet-input"
        />
      </Field>

      <div className="mt-5 flex flex-wrap items-baseline gap-4">
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
          className="btn-vermilion no-underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "saving"
            ? "Pressing…"
            : state === "saved"
              ? "✓ Inscribed"
              : todayEntry
                ? "Update entry"
                : "Inscribe in today&rsquo;s leaf"}
        </button>
        {error && (
          <span className="font-mono text-xs text-vermilion">{error}</span>
        )}
        <Link
          href="/journal"
          className="wl-link no-underline font-mono text-xs uppercase tracking-[0.18em] text-ink/70"
        >
          See previous leaves →
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="almanac">{label}</span>
      <div className="mt-2">{children}</div>
    </div>
  );
}
