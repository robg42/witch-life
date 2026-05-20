"use client";

import { useState } from "react";
import { DECK, type Card } from "@/lib/deck";
import { CardArt } from "@/components/cards/card-art";

/*
  An interactive ribbon of cards from the 28-card deck. Default view
  shows eight selected cards face-up in a fanned arrangement; clicking
  a card brings it to the foreground and surfaces its description.
  A suit filter swaps the eight shown.
*/

type Suit = Card["suit"];

const SHOWCASE_PER_SUIT: Record<Suit, string[]> = {
  Root: ["Seed", "Mycelium", "Harvest"],
  Tide: ["Current", "Depth", "Thaw"],
  Blade: ["Threshold", "Flight", "Storm"],
  Ember: ["Spark", "Hearth", "Dawn"],
};

const SUITS: Suit[] = ["Root", "Tide", "Blade", "Ember"];

export function DeckRibbon() {
  const [suit, setSuit] = useState<Suit | "all">("all");
  const [focused, setFocused] = useState<Card | null>(null);

  const visible: Card[] =
    suit === "all"
      ? SUITS.flatMap(
          (s) =>
            SHOWCASE_PER_SUIT[s]
              .map((name) => DECK.find((c) => c.name === name))
              .filter((c): c is Card => Boolean(c)),
        )
      : DECK.filter((c) => c.suit === suit);

  return (
    <div>
      {/* Suit filter */}
      <div className="mb-10 flex flex-wrap items-baseline gap-3">
        <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
          The deck
        </span>
        <button
          type="button"
          onClick={() => setSuit("all")}
          className={`font-sans text-xs uppercase tracking-[0.25em] border px-3 py-1.5 transition-base ${
            suit === "all"
              ? "border-ochre text-parchment"
              : "border-moss/30 text-ash hover:text-parchment"
          }`}
        >
          All four suits
        </button>
        {SUITS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSuit(s)}
            className={`font-sans text-xs uppercase tracking-[0.25em] border px-3 py-1.5 transition-base ${
              suit === s
                ? "border-ochre text-parchment"
                : "border-moss/30 text-ash hover:text-parchment"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="-mx-2 flex flex-wrap justify-center gap-y-6">
        {visible.map((card) => {
          const isFocused = focused?.name === card.name;
          return (
            <button
              key={card.name}
              type="button"
              onClick={() => setFocused(isFocused ? null : card)}
              className={`relative -mx-3 transition-all duration-500 ease-out ${
                isFocused
                  ? "z-10 -translate-y-3 scale-110"
                  : "hover:-translate-y-2 hover:scale-[1.04]"
              }`}
              aria-pressed={isFocused}
              aria-label={`${card.name}, suit of ${card.suit}`}
            >
              <div
                className={`flex flex-col items-center gap-2 border bg-linen px-3 py-4 text-earth shadow-sm ${
                  isFocused ? "border-ochre" : "border-moss/50"
                }`}
                style={{ width: 132, height: 198 }}
              >
                <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-moss">
                  {card.suit}
                </span>
                <div className="my-1 text-moss">
                  <CardArt card={card} />
                </div>
                <span className="accent text-base text-earth">{card.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Focused card description */}
      <div className="mt-10 min-h-[80px] text-center">
        {focused ? (
          <div className="fade-up" key={focused.name}>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ochre">
              {focused.suit} · {focused.name}
            </p>
            <p className="oracle-body mt-2 mx-auto max-w-xl text-parchment/95">
              &ldquo;{focused.description}&rdquo;
            </p>
          </div>
        ) : (
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Tap a card to read its line
          </p>
        )}
      </div>

      <p className="mt-10 text-center font-sans text-xs uppercase tracking-[0.25em] text-ash">
        Twenty-eight cards · four suits of seven · drawn against your chart
      </p>
    </div>
  );
}
