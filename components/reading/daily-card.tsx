"use client";

import { useState } from "react";

/*
  Daily symbol — the face-down card on the reading page. The real deck of
  28 botanical / elemental cards lands in Phase 4; this is a clean
  placeholder with the 3D flip mechanic already wired in. When Phase 4
  fills in the deck, only the front/back faces and the AI call on flip
  need to change.
*/

interface DailyCardProps {
  cardName?: string;
  cardSuit?: string;
  cardDescription?: string;
  onFlip?: () => void;
}

export function DailyCard({
  cardName = "—",
  cardSuit,
  cardDescription,
  onFlip,
}: DailyCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    onFlip?.();
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleFlip}
        aria-label={flipped ? `Card revealed: ${cardName}` : "Reveal today's card"}
        className="group relative h-72 w-48 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ochre"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center border border-moss bg-bark"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardBackArt />
          </div>
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between gap-4 border border-moss bg-linen p-6 text-earth"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-moss">
              {cardSuit ?? "—"}
            </span>
            <span className="accent text-2xl text-earth">{cardName}</span>
            <p className="font-serif text-sm leading-relaxed text-earth/80">
              {cardDescription ?? ""}
            </p>
          </div>
        </div>
      </button>
      <span className="mt-4 font-sans text-[11px] uppercase tracking-[0.25em] text-ash">
        {flipped ? "drawn" : "tap to draw"}
      </span>
    </div>
  );
}

function CardBackArt() {
  return (
    <svg
      viewBox="0 0 120 180"
      width="120"
      height="180"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      className="text-sage"
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
  );
}
