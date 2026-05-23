"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
  type SkyState,
} from "@/lib/astro";
import {
  birthToUtcDate,
  loadBirth,
  type BirthDetails,
} from "@/lib/birth-details";
import { drawThree, type Card } from "@/lib/deck";
import type { SpreadLayout, SpreadResponse } from "@/app/api/spread/route";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { TarotCard } from "@/components/cards/tarot-card";
import { UpgradeCard } from "@/components/paywall/upgrade-card";
import { VOICE_LABEL } from "@/lib/voices";

const LAYOUT_LABELS: Record<SpreadLayout, [string, string, string]> = {
  sao: ["Situation", "Action", "Outcome"],
  ppf: ["Past", "Present", "Future"],
};

interface State {
  birth: BirthDetails;
  sky: SkyState;
  natal: NatalChart;
  cards: [Card, Card, Card];
}

export function SpreadExperience() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [layout, setLayout] = useState<SpreadLayout>("sao");
  const [question, setQuestion] = useState("");
  const [appliedQuestion, setAppliedQuestion] = useState<string | undefined>();
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [drawId, setDrawId] = useState(0);

  useEffect(() => {
    const b = loadBirth();
    if (!b) {
      router.replace("/onboarding");
      return;
    }
    const now = new Date();
    setState({
      birth: b,
      sky: getSkyState(now, { lat: b.lat }),
      natal: computeNatalChart({
        date: birthToUtcDate(b),
        lat: b.lat,
        lng: b.lng,
      }),
      cards: drawThree(),
    });
  }, [router, drawId]);

  const positions = LAYOUT_LABELS[layout];

  const allRevealed = revealed.every(Boolean);

  const [reading, setReading] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: SpreadResponse }
    | { kind: "paywall" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (!state || !allRevealed) return;
    let cancelled = false;
    setReading({ kind: "loading" });
    fetch("/api/spread", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cards: state.cards,
        layout,
        sky: state.sky,
        natal: state.natal,
        voice: state.birth.voice,
        question: appliedQuestion,
      }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 402) {
          setReading({ kind: "paywall" });
          return;
        }
        if (!res.ok) {
          const body = await safeJson(res);
          setReading({
            kind: "error",
            message: body?.error ?? `Server responded ${res.status}`,
          });
          return;
        }
        const data = (await res.json()) as SpreadResponse;
        setReading({ kind: "ok", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReading({
          kind: "error",
          message: err instanceof Error ? err.message : "Network error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [allRevealed, state, layout, appliedQuestion]);

  const drawAgain = () => {
    setRevealed([false, false, false]);
    setReading({ kind: "idle" });
    setDrawId((n) => n + 1);
  };

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
          Shuffling…
        </span>
      </main>
    );
  }

  const tabBase =
    "font-sans text-xs uppercase tracking-[0.25em] border px-4 py-2 transition-base";

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
          >
            ← Witch Life
          </Link>
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Voice: <span className="text-clay">{VOICE_LABEL[state.birth.voice]}</span>
          </span>
        </header>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mt-10">
          A spread
        </p>
        <h1 className="display mt-3 text-3xl text-ink md:text-5xl">
          A three-card spread
        </h1>
        <p className="oracle-body mt-4 text-ink/85">
          Pick the shape. Ask a question if you have one. Turn each card.
          The oracle reads the three together.
        </p>

        <BotanicalDivider className="my-10" />

        <div className="flex flex-wrap items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Shape
          </span>
          {(["sao", "ppf"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setLayout(key);
                drawAgain();
              }}
              className={`${tabBase} ${
                layout === key
                  ? "border-clay bg-clay/10 text-ink"
                  : "border-bark/30 text-bark/70 hover:border-clay hover:text-ink"
              }`}
            >
              {LAYOUT_LABELS[key].join(" / ")}
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional question"
            className="flex-1 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/40 focus:border-clay"
          />
          <button
            type="button"
            onClick={() => {
              setAppliedQuestion(question || undefined);
              drawAgain();
            }}
            className="font-sans text-xs uppercase tracking-[0.25em] border border-bark/30 bg-linen/60 px-4 py-2 text-ink transition-base hover:border-clay hover:text-clay"
          >
            Set
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {state.cards.map((card, i) => (
            <div key={drawId + ":" + i} className="flex flex-col items-center">
              <span className="mb-3 font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
                {positions[i]}
              </span>
              <TarotCard
                card={card}
                onFlip={() =>
                  setRevealed((prev) => {
                    const next = [...prev];
                    next[i] = true;
                    return next;
                  })
                }
                label=""
              />
            </div>
          ))}
        </div>

        <div className="mt-12">
          {reading.kind === "loading" && (
            <div className="animate-pulse space-y-3 text-bark/40">
              <div className="h-3 w-28 bg-bark/20" />
              <div className="h-4 w-full bg-bark/15" />
              <div className="h-4 w-10/12 bg-bark/15" />
            </div>
          )}
          {reading.kind === "paywall" && (
            <UpgradeCard
              title="The three-card spread is for subscribers"
              body="Daily readings stay free. The spread, journal-aware oracle, and saved history come with a £9 / month or £79 / year subscription."
              ctaLabel="Subscribe — £9 / month"
              mode="subscription"
              argument="monthly"
              secondaryLabel="or £79 / year"
              secondaryArgument="yearly"
            />
          )}
          {reading.kind === "error" && (
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-clay">
              The oracle could not respond · {reading.message}
            </p>
          )}
          {reading.kind === "ok" && (
            <div className="fade-up">
              {reading.data.positions.map((pos, i) => (
                <div
                  key={i}
                  className="mt-10 first:mt-0 border-l border-clay/30 pl-5"
                >
                  <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
                    {positions[i]}
                  </p>
                  <p className="oracle-body mt-3 text-ink/95">
                    {pos.interpretation}
                  </p>
                  <div className="mt-4 rounded-sm border border-bark/25 bg-linen/40 p-4">
                    <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-moss">
                      What to do
                    </p>
                    <p className="oracle-body mt-2 text-ink/95">{pos.action}</p>
                  </div>
                </div>
              ))}

              <div className="mt-14 rounded-sm border border-clay/40 bg-clay/5 p-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
                  This week
                </p>
                <p className="oracle-body mt-3 text-ink/95">
                  {reading.data.weekPractice.intention}
                </p>
                <ol className="mt-5 space-y-3">
                  {reading.data.weekPractice.steps.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-baseline gap-4 border-t border-bark/20 pt-3"
                    >
                      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70 w-24 shrink-0">
                        {s.day}
                      </span>
                      <span className="font-serif text-base text-ink/95">
                        {s.action}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {(allRevealed || reading.kind !== "idle") && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={drawAgain}
              className="font-sans text-xs uppercase tracking-[0.25em] border border-bark/30 bg-linen/60 px-6 py-3 text-ink transition-base hover:border-clay hover:text-clay"
            >
              Draw another spread
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
