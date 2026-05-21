"use client";

import { useState } from "react";
import type { Card } from "@/lib/deck";
import { CardArt } from "@/components/cards/card-art";

/*
  The 3D-flipping card surface. Sits on the cream herbarium surface —
  the back is a deep bark with sage ink, the front is brighter
  parchment with the botanical illustration in moss.
*/
interface TarotCardProps {
  card: Card;
  initiallyFlipped?: boolean;
  onFlip?: (card: Card) => void;
  label?: string;
}

export function TarotCard({
  card,
  initiallyFlipped = false,
  onFlip,
  label,
}: TarotCardProps) {
  const [flipped, setFlipped] = useState(initiallyFlipped);

  const reveal = () => {
    if (flipped) return;
    setFlipped(true);
    onFlip?.(card);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={reveal}
        aria-label={
          flipped ? `Card revealed: ${card.name}` : "Reveal the card"
        }
        className="group relative h-72 w-48 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-clay"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <Back />
          <Front card={card} />
        </div>
      </button>
      {label !== "" && (
        <span className="mt-4 font-sans text-[11px] uppercase tracking-[0.25em] text-bark/70">
          {label ?? (flipped ? "drawn" : "tap to draw")}
        </span>
      )}
    </div>
  );
}

function Back() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center border border-bark bg-bark text-bone shadow-md"
      style={{ backfaceVisibility: "hidden" }}
    >
      <svg
        viewBox="0 0 120 180"
        width="120"
        height="180"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        aria-hidden
      >
        <rect x="6" y="6" width="108" height="168" />
        <circle cx="60" cy="90" r="22" />
        <path d="M60 68 L60 112" />
        <path d="M60 78 C 50 78, 44 74, 40 68" />
        <path d="M60 78 C 70 78, 76 74, 80 68" />
        <path d="M60 96 C 48 96, 40 90, 36 82" />
        <path d="M60 96 C 72 96, 80 90, 84 82" />
        <path d="M60 110 C 52 110, 46 106, 42 100" />
        <path d="M60 110 C 68 110, 74 106, 78 100" />
      </svg>
    </div>
  );
}

function Front({ card }: { card: Card }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-between gap-2 border border-bark/40 bg-parchment p-5 text-ink shadow-md"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
        {card.suit}
      </span>
      <div className="text-moss">
        <CardArt card={card} />
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="accent text-2xl text-ink">{card.name}</span>
        <p className="mt-1 font-serif text-xs italic leading-snug text-bark/80">
          {card.description}
        </p>
      </div>
    </div>
  );
}
