"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
  type SkyState,
} from "@/lib/astro";
import { birthToUtcDate, loadBirth, type BirthDetails } from "@/lib/birth-details";
import { randomCard, type Card } from "@/lib/deck";
import { TarotCard } from "@/components/cards/tarot-card";
import { CardInterpretation } from "@/components/cards/card-interpretation";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { VOICE_LABEL } from "@/lib/voices";

/*
  On-demand single-card pull. Separate from the daily seeded card on
  /reading — every visit here is a fresh draw against today's sky.

  Free-tier rate limiting (one pull per day) is intentionally deferred to
  Phase 6 when Supabase-authenticated traffic exists to throttle against.
*/

export function OnDemandDraw() {
  const router = useRouter();
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [revealedCard, setRevealedCard] = useState<Card | null>(null);
  const [drawId, setDrawId] = useState(0);

  useEffect(() => {
    const b = loadBirth();
    if (!b) {
      router.replace("/onboarding");
      return;
    }
    setBirth(b);
    setPendingCard(randomCard());
  }, [router]);

  const { sky, natal } = useMemo<{
    sky: SkyState | null;
    natal: NatalChart | null;
  }>(() => {
    if (!birth) return { sky: null, natal: null };
    const now = new Date();
    return {
      sky: getSkyState(now, { lat: birth.lat }),
      natal: computeNatalChart({
        date: birthToUtcDate(birth),
        lat: birth.lat,
        lng: birth.lng,
      }),
    };
  }, [birth]);

  const drawAnother = () => {
    setRevealedCard(null);
    setPendingCard(randomCard());
    setDrawId((n) => n + 1);
  };

  if (!birth || !pendingCard || !sky || !natal) {
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
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-baseline justify-between">
          <Link
            href="/reading"
            className="font-sans text-xs uppercase tracking-[0.25em] text-ash transition-base hover:text-parchment"
          >
            ← Today&rsquo;s reading
          </Link>
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Voice: <span className="text-ochre">{VOICE_LABEL[birth.voice]}</span>
          </span>
        </header>

        <h1 className="display mt-10 text-3xl text-parchment md:text-4xl">
          A card, just for you
        </h1>
        <p className="oracle-body mt-3 text-parchment/85">
          Different from the daily symbol. Pulled fresh against your chart
          and the sky as it is right now.
        </p>

        <BotanicalDivider className="my-10" />

        <div className="flex flex-col items-center">
          <TarotCard
            key={drawId}
            card={pendingCard}
            onFlip={(c) => setRevealedCard(c)}
            label={revealedCard ? "drawn" : "tap to draw"}
          />

          <CardInterpretation
            card={revealedCard}
            sky={sky}
            natal={natal}
            voice={birth.voice}
          />

          {revealedCard && (
            <button
              type="button"
              onClick={drawAnother}
              className="mt-10 font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-6 py-3 text-parchment transition-base hover:bg-moss/40"
            >
              Draw another
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
