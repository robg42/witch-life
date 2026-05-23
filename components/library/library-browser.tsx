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
import { Stamp } from "@/components/broadsheet";

/*
  The Library browser as a printed index card with filters at top, a
  ruled grid of entries below, and a broadsheet-style detail dialog
  for any entry.
*/

interface Props {
  isSubscribed: boolean;
}

type Filter =
  | { kind: "all" }
  | { kind: "type"; type: CorrespondenceType }
  | { kind: "intention"; intention: IntentionKey };

export function LibraryBrowser({ isSubscribed }: Props) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Correspondence | null>(null);

  const all = useMemo<Correspondence[]>(() => {
    const source = isSubscribed ? CORRESPONDENCES : PREVIEW_CORRESPONDENCES;
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
      {/* Search row */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder="rosemary, courage, a candle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="broadsheet-input"
          />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter({ kind: "all" });
            }}
            className="btn-ink"
          >
            Clear
          </button>
        </div>

        {/* Filters — type and intention rows, separated */}
        <div className="grid grid-cols-1 gap-4 rule-t pt-4">
          <FilterRow label="By type">
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
          </FilterRow>
          <FilterRow label="By intention">
            {INTENTIONS.map((i) => (
              <Chip
                key={i.key}
                active={
                  filter.kind === "intention" && filter.intention === i.key
                }
                onClick={() =>
                  setFilter({ kind: "intention", intention: i.key })
                }
                label={i.label}
                tone="sage"
              />
            ))}
          </FilterRow>
        </div>
      </div>

      {/* Result count + heading */}
      <div className="rule-t rule-b py-3 flex items-baseline justify-between almanac">
        <span>
          {all.length} {all.length === 1 ? "entry" : "entries"}
        </span>
        <span>The index</span>
      </div>

      {/* Results — ruled grid */}
      <div className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="italic-accent text-base text-ink/70">
          Nothing matches that yet. Try a different word.
        </p>
      )}

      {!isSubscribed && (
        <LockedBanner
          remaining={CORRESPONDENCES.length - PREVIEW_CORRESPONDENCES.length}
        />
      )}

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

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="almanac w-24 shrink-0">{label}</span>
      <div className="flex flex-wrap items-baseline gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  tone = "vermilion",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: "vermilion" | "sage";
}) {
  const activeBorderCls =
    tone === "sage" ? "border-sage text-sage bg-sage/5" : "border-vermilion text-vermilion bg-vermilion/5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[10px] uppercase tracking-[0.2em] border-[1.5px] px-3 py-1.5 transition-base ${
        active
          ? activeBorderCls
          : "border-rule text-ink/70 hover:border-vermilion hover:text-vermilion"
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
      className="group relative flex flex-col items-start gap-2 bg-paper px-5 py-5 text-left transition-base hover:bg-paper-3"
    >
      <div className="flex w-full items-baseline justify-between almanac">
        <span className="text-vermilion">{entry.type}</span>
        <span className="text-ink/50 group-hover:text-vermilion">
          {isSubscribed ? "Open" : "Preview"} →
        </span>
      </div>
      <h3 className="display-italic text-3xl text-ink leading-none mt-1">
        {entry.name}
      </h3>
      <p className="italic-accent text-base text-ink/80 leading-snug">
        {entry.summary}
      </p>
    </button>
  );
}

function LockedBanner({ remaining }: { remaining: number }) {
  return (
    <div className="border-[2px] border-vermilion bg-vermilion/5 px-6 py-5 vermilion-shadow">
      <Stamp tone="vermilion">For subscribers</Stamp>
      <p className="oracle-body mt-3 text-ink/90 max-w-2xl">
        {remaining}+ more entries in the full library. Subscribers also get
        the &ldquo;Practice with this&rdquo; generator — each correspondence
        can be turned into a tailored five-to-ten minute ritual.
      </p>
      <Link href="/account" className="btn-vermilion mt-5 no-underline">
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
        message: "Cast your chart first — visit Your practice.",
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-6 md:items-center md:py-12"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border-[2px] border-ink bg-paper-3 ink-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Detail header */}
        <header className="rule-b sticky top-0 bg-paper-3 px-6 py-3 flex items-baseline justify-between almanac z-10">
          <span className="text-vermilion">{entry.type}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/60 hover:text-vermilion"
          >
            close ✕
          </button>
        </header>

        <div className="px-6 py-7 md:px-10 md:py-10">
          <h2 className="display text-[clamp(3rem,7vw,5rem)] leading-[0.85]">
            {entry.name}
          </h2>
          <p className="display-italic mt-3 text-xl text-ink/85 md:text-2xl">
            {entry.summary}
          </p>

          <section className="rule-t mt-8 pt-4">
            <p className="almanac">Traditional uses</p>
            <ul className="mt-3 space-y-2">
              {entry.traditionalUses.map((u, i) => (
                <li
                  key={i}
                  className="font-serif text-lg text-ink/95 grid grid-cols-[2rem_1fr] items-baseline gap-3"
                >
                  <span className="font-mono text-vermilion text-sm">—</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rule-t mt-6 pt-4">
            <p className="almanac">Best for</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {entry.bestFor.map((i) => (
                <Stamp key={i} tone="sage">
                  {i}
                </Stamp>
              ))}
            </div>
          </section>

          <section className="mt-8 border-[2px] border-vermilion bg-vermilion/5 px-6 py-5">
            <div className="flex items-baseline justify-between almanac">
              <Stamp tone="vermilion">Practice with this</Stamp>
              <span className="text-ink/50">5–10 min</span>
            </div>
            <p className="oracle-body mt-3 text-ink/90 italic-accent">
              {entry.practiceHint}
            </p>

            {isSubscribed && practice.kind === "idle" && (
              <button
                type="button"
                onClick={generate}
                className="btn-vermilion mt-5 no-underline"
              >
                Generate a full practice <span>→</span>
              </button>
            )}
            {!isSubscribed && (
              <p className="almanac mt-4 text-ink/60">
                Subscribers can generate a tailored ritual using this entry.
              </p>
            )}

            {practice.kind === "loading" && (
              <p className="almanac mt-5">Generating…</p>
            )}
            {practice.kind === "error" && (
              <p className="mt-5 font-mono text-sm text-vermilion">
                {practice.message}
              </p>
            )}
            {practice.kind === "ok" && (
              <div className="mt-6 fade-up">
                <h3 className="display text-2xl text-ink">
                  {practice.data.title}
                </h3>
                <p className="oracle-body mt-2 text-ink/90">
                  {practice.data.intentionLine}
                </p>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="almanac text-vermilion">Gather</p>
                    <ul className="mt-2 space-y-1.5">
                      {practice.data.gather.map((g, i) => (
                        <li
                          key={i}
                          className="font-serif text-base text-ink/95 grid grid-cols-[1.5rem_1fr] gap-2"
                        >
                          <span className="font-mono text-sm text-vermilion">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="almanac text-vermilion">Do</p>
                    <ol className="mt-2 space-y-3">
                      {practice.data.steps.map((s, i) => (
                        <li
                          key={i}
                          className="font-serif text-base text-ink/95"
                        >
                          <span className="font-mono text-xs uppercase tracking-[0.15em] text-vermilion">
                            {s.duration}
                          </span>
                          <br />
                          {s.action}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <p className="rule-t mt-6 pt-4 italic-accent text-base text-ink/85">
                  <span className="almanac mr-3">Then write</span>
                  {practice.data.reflectionPrompt}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
