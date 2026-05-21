"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/*
  The journal entry form. Three fields — two prompted, one free.
  Themed for the cream herbarium surface.
*/

export function JournalForm() {
  const router = useRouter();
  const [whatLanded, setWhatLanded] = useState("");
  const [movingToward, setMovingToward] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatLanded.trim() && !movingToward.trim() && !freeText.trim()) {
      setError("Write something first — even a single sentence.");
      return;
    }
    setSubmitting(true);
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
      setWhatLanded("");
      setMovingToward("");
      setFreeText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full resize-y border-b border-bark/40 bg-transparent px-1 py-2 font-serif text-lg leading-relaxed text-ink outline-none placeholder:text-bark/40 focus:border-clay";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <Field
        label="What landed today"
        hint="What from today's reading stayed with you?"
      >
        <textarea
          value={whatLanded}
          onChange={(e) => setWhatLanded(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </Field>

      <Field
        label="Moving toward"
        hint="What are you consciously moving toward right now?"
      >
        <textarea
          value={movingToward}
          onChange={(e) => setMovingToward(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </Field>

      <Field label="And the rest">
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={4}
          placeholder="Open field. Write nothing in particular."
          className={inputCls}
        />
      </Field>

      {error && <p className="font-sans text-sm text-clay">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-8 py-3 text-parchment transition-base hover:bg-clay/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Set it down"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
        {label}
      </span>
      {hint && (
        <p className="mt-1 font-serif text-sm italic text-bark/70">{hint}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
