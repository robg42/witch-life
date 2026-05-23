"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CORRESPONDENCES,
  CORRESPONDENCE_TYPES,
  PREVIEW_CORRESPONDENCES,
  type Correspondence,
  type CorrespondenceType,
} from "@/lib/correspondences";
import { INTENTIONS, type IntentionKey } from "@/lib/intentions";
import { loadBirth } from "@/lib/birth-details";
import type { LibraryPracticeResponse } from "@/app/api/library/practice/route";

/*
  Searchable correspondence browser. Free users see PREVIEW_CORRESPONDENCES
  with an upgrade gate around the rest. Subscribers see everything plus
  the "Practice with this" affordance.
*/

interface Props {
  isSubscribed: boolean;
}

type Filter = { kind: "all" } | { kind: "type"; type: CorrespondenceType } | { kind: "intention"; intention: IntentionKey };

export function LibraryBrowser({ isSubscribed }: Props) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Correspondence | null>(null);

  const all = useMemo<Correspondence[]>(() => {
    const source = isSubscribed
      ? CORRESPONDENCES
      : PREVIEW_CORRESPONDENCES;
    let filtered: Correspondence[] = [...source];
    if (filter.kind === "type") {
      filtered = filtered.filter((c) => c.type === filter.type);
    } else if (filter.kind === "intention") {
      filtered = filtered.filter((c) => c.bestFor.includes(filter.intention));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.traditionalUses.some((u) => u.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }, [filter, query, isSubscribed]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search + filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <input
            type="text"
            placeholder="Search — rosemary, courage, a candle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/40 focus:border-clay"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60 hover:text-clay"
            >
              clear
            </button>
          )}
        </div>

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          <Chip
            active={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
            label="All"
          />
          {CORRESPONDENCE_TYPES.map(({ type, label }) => (
            <Chip
              key={type}
              active={filter.kind === "type" && filter.type === type}
              onClick={() => setFilter({ kind: "type", type })}
              label={label}
            />
          ))}
        </div>

        {/* Intention chips */}
        <div className="flex flex-wrap gap-2">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60 self-center">
            For
          </span>
          {INTENTIONS.map((i) => (
            <Chip
              key={i.key}
              active={
                filter.kind === "intention" && filter.intention === i.key
              }
              onClick={() => setFilter({ kind: "intention", intention: i.key })}
              label={i.label}
              tone="moss"
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-px bg-bark/15 sm:grid-cols-2 md:grid-cols-3">
        {all.map((c) => (
          <Card
            key={c.id}
            entry={c}
            onOpen={() => setSelected(c)}
            isSubscribed={isSubscribed}
          />
        ))}
      </div>

      {all.length === 0 && (
        <p className="font-serif text-base italic text-bark/70">
          Nothing matches that search yet.
        </p>
      )}

      {/* Locked banner for free users */}
      {!isSubscribed && (
        <LockedBanner remaining={CORRESPONDENCES.length - PREVIEW_CORRESPONDENCES.length} />
      )}

      {/* Detail modal-ish panel */}
      {selected && (
        <DetailPanel
          entry={selected}
          onClose={() => setSelected(null)}
          isSubscribed={isSubscribed}
        />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  tone = "clay",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "clay" | "moss";
}) {
  const activeCls =
    tone === "moss"
      ? "border-moss bg-moss/10 text-moss"
      : "border-clay bg-clay/10 text-clay";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-sans text-[10px] uppercase tracking-[0.25em] border px-3 py-1.5 transition-base ${
        active
          ? activeCls
          : "border-bark/25 text-bark/70 hover:border-clay hover:text-clay"
      }`}
    >
      {label}
    </button>
  );
}

function Card({
  entry,
  onOpen,
  isSubscribed,
}: {
  entry: Correspondence;
  onOpen: () => void;
  isSubscribed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-start gap-2 bg-bone/90 px-5 py-5 text-left transition-base hover:bg-parchment"
    >
      <div className="flex w-full items-baseline justify-between">
        <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-clay">
          {entry.type}
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/50 group-hover:text-clay">
          {isSubscribed ? "open" : "preview"} →
        </span>
      </div>
      <span className="accent text-2xl text-ink">{entry.name}</span>
      <p className="font-serif text-sm italic text-ink/85">{entry.summary}</p>
    </button>
  );
}

function LockedBanner({ remaining }: { remaining: number }) {
  return (
    <div className="rounded-sm border border-clay/40 bg-clay/5 px-6 py-5">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
        {remaining}+ more in the full library
      </p>
      <p className="oracle-body mt-2 text-ink/85">
        Subscribers get every entry plus the Practice generator — each
        correspondence can be turned into a 5–10 minute ritual using that
        specific thing.
      </p>
      <Link
        href="/account"
        className="mt-4 inline-block font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-6 py-3 text-parchment transition-base hover:bg-clay/85"
      >
        Subscribe — £9 / month
      </Link>
    </div>
  );
}

function DetailPanel({
  entry,
  onClose,
  isSubscribed,
}: {
  entry: Correspondence;
  onClose: () => void;
  isSubscribed: boolean;
}) {
  const [practice, setPractice] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: LibraryPracticeResponse }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const generate = async () => {
    const birth = loadBirth();
    if (!birth) {
      setPractice({
        kind: "error",
        message: "Cast your chart first — visit Your roots.",
      });
      return;
    }
    setPractice({ kind: "loading" });
    try {
      const res = await fetch("/api/library/practice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          correspondenceId: entry.id,
          voice: birth.voice,
        }),
      });
      if (res.status === 402) {
        setPractice({
          kind: "error",
          message: "Subscribers only — see /account.",
        });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setPractice({
          kind: "error",
          message: body?.error ?? `Server responded ${res.status}`,
        });
        return;
      }
      const data = (await res.json()) as LibraryPracticeResponse;
      setPractice({ kind: "ok", data });
    } catch (err) {
      setPractice({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-8 md:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-bark/30 bg-bone p-6 shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-baseline justify-between">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
            {entry.type}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60 hover:text-clay"
          >
            close ✕
          </button>
        </header>

        <h2 className="accent mt-2 text-3xl text-ink md:text-4xl">
          {entry.name}
        </h2>
        <p className="font-accent mt-2 text-lg italic text-ink/85">
          {entry.summary}
        </p>

        <section className="mt-6">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Traditional uses
          </p>
          <ul className="mt-3 space-y-2">
            {entry.traditionalUses.map((u, i) => (
              <li
                key={i}
                className="font-serif text-base text-ink/90 before:mr-2 before:text-clay before:content-['•']"
              >
                {u}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Best for
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.bestFor.map((i) => (
              <span
                key={i}
                className="font-sans text-[10px] uppercase tracking-[0.25em] text-moss"
              >
                {i}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-sm border border-clay/40 bg-clay/5 p-5">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
            Practice with this
          </p>
          <p className="oracle-body mt-2 text-ink/90">
            {entry.practiceHint}
          </p>

          {isSubscribed && practice.kind === "idle" && (
            <button
              type="button"
              onClick={generate}
              className="mt-4 font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-5 py-2 text-parchment transition-base hover:bg-clay/85"
            >
              Generate a full practice
            </button>
          )}
          {!isSubscribed && (
            <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
              Subscribers can generate a tailored ritual using this entry.
            </p>
          )}

          {practice.kind === "loading" && (
            <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
              Generating…
            </p>
          )}
          {practice.kind === "error" && (
            <p className="mt-4 font-sans text-xs text-clay">
              {practice.message}
            </p>
          )}
          {practice.kind === "ok" && (
            <div className="mt-5 fade-up">
              <p className="accent text-xl text-ink">{practice.data.title}</p>
              <p className="oracle-body mt-2 text-ink/90">
                {practice.data.intentionLine}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
                    Gather
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {practice.data.gather.map((g, i) => (
                      <li
                        key={i}
                        className="font-serif text-sm text-ink/90"
                      >
                        — {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
                    Do
                  </p>
                  <ol className="mt-2 space-y-2">
                    {practice.data.steps.map((s, i) => (
                      <li key={i} className="font-serif text-sm text-ink/90">
                        <span className="font-sans text-[9px] uppercase tracking-wider text-bark/60">
                          {s.duration}
                        </span>
                        <br />
                        {s.action}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <p className="mt-4 font-serif text-sm italic text-ink/85">
                Then write: {practice.data.reflectionPrompt}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
