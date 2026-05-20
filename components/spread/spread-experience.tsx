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
import { OracleSection } from "@/components/reading/oracle-section";
import { UpgradeCard } from "@/components/paywall/upgrade-card";
import { VOICE_LABEL } from "@/lib/voices";

/*
  Three-card spread experience.

  - Picks three cards on mount (deterministic per draw, no repeats).
  - Layout chooser: Situation / Action / Outcome (default) or
    Past / Present / Future.
  - Reader can flip each card individually; after all three are revealed
    the page fires /api/spread once and renders the synthesised reading.
  - 402 from the API means the reader isn't subscribed → soft gate.
*/

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

  // Spread reading state. Fires once all three flipped, with the question
  // that was active at that moment.
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
      <main className="flex min-h-screen items-center justify-center bg-earth">
        <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
          Shuffling…
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-earth text-parchment">
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-baseline justify-between">
          <Link
            href="/reading"
            className="font-sans text-xs uppercase tracking-[0.25em] text-ash transition-base hover:text-parchment"
          >
            ← Today&rsquo;s reading
          </Link>
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Voice: <span className="text-ochre">{VOICE_LABEL[state.birth.voice]}</span>
          </span>
        </header>

        <h1 className="display mt-10 text-3xl text-parchment md:text-4xl">
          A three-card spread
        </h1>
        <p className="oracle-body mt-3 text-parchment/85">
          Pick the shape. Ask a question if you have one. Turn each card.
          The oracle reads the three together.
        </p>

        <BotanicalDivider className="my-10" />

        {/* Layout toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
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
              className={`font-sans text-xs uppercase tracking-[0.25em] border px-4 py-2 transition-base ${
                layout === key
                  ? "border-ochre text-parchment"
                  : "border-moss/40 text-ash hover:text-parchment"
              }`}
            >
              {LAYOUT_LABELS[key].join(" / ")}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="mt-8 flex gap-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional question"
            className="flex-1 border-b border-moss bg-transparent px-1 py-2 font-serif text-lg text-parchment outline-none focus:border-ochre"
          />
          <button
            type="button"
            onClick={() => {
              setAppliedQuestion(question || undefined);
              drawAgain();
            }}
            className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-4 py-2 text-parchment transition-base hover:bg-moss/40"
          >
            Set
          </button>
        </div>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {state.cards.map((card, i) => (
            <div key={drawId + ":" + i} className="flex flex-col items-center">
              <span className="mb-3 font-sans text-[10px] uppercase tracking-[0.3em] text-ash">
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

        {/* Reading */}
        <div className="mt-12">
          {reading.kind === "loading" && (
            <div className="animate-pulse space-y-3 text-parchment/40">
              <div className="h-3 w-28 bg-moss/30" />
              <div className="h-4 w-full bg-moss/20" />
              <div className="h-4 w-10/12 bg-moss/20" />
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
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-ochre">
              The oracle could not respond · {reading.message}
            </p>
          )}
          {reading.kind === "ok" && (
            <>
              {reading.data.positionReadings.map((text, i) => (
                <OracleSection key={i} label={positions[i]}>
                  {text}
                </OracleSection>
              ))}
              <OracleSection label="Taken together" tone="protect">
                {reading.data.synthesis}
              </OracleSection>
            </>
          )}
        </div>

        {(allRevealed || reading.kind !== "idle") && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={drawAgain}
              className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-6 py-3 text-parchment transition-base hover:bg-moss/40"
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
