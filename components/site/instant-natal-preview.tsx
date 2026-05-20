"use client";

import { useState } from "react";
import Link from "next/link";
import {
  computeNatalChart,
  type NatalChart,
} from "@/lib/astro";
import { SIGN_GLYPH, PLANET_NAME, PLANET_GLYPH, PLANET_ORDER } from "@/lib/zodiac";

/*
  A "see your sky" mini chart caster. Enter a birth date, get an instant
  preview of where your sun, moon, and the rest of the visible planets
  fall. No sign-in, no commitment — runs entirely client-side on the
  pure astro engine.

  Rising sign is gated behind birth time + place, so we omit it here
  and gesture toward the full onboarding flow.
*/

export function InstantNatalPreview() {
  const [date, setDate] = useState("");
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Pick a date first.");
      return;
    }
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) {
      setError("That date didn't parse — try the picker?");
      return;
    }
    // Noon UTC keeps everything stable for sign-level placement.
    const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    setChart(computeNatalChart({ date: utcNoon }));
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-baseline gap-4"
      >
        <label className="flex flex-col gap-2">
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Born on
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-b border-moss bg-transparent px-1 py-2 font-serif text-lg text-parchment outline-none focus:border-ochre"
          />
        </label>
        <button
          type="submit"
          className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/30 px-6 py-3 text-parchment transition-base hover:bg-moss/50"
        >
          Show me
        </button>
      </form>

      {error && (
        <p className="mt-4 font-sans text-sm text-ochre">{error}</p>
      )}

      {chart && (
        <div className="fade-up mt-10">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Your visible sky at noon UTC on that day
          </p>
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
            {PLANET_ORDER.map((p) => (
              <div key={p} className="flex items-baseline gap-3">
                <span className="text-lg text-sage" title={PLANET_NAME[p]}>
                  {PLANET_GLYPH[p]}
                </span>
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-ash">
                    {PLANET_NAME[p]}
                  </span>
                  <span className="font-serif text-base text-parchment">
                    {chart[p]} {SIGN_GLYPH[chart[p]]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="oracle-body mt-8 max-w-xl text-parchment/85">
            This is the surface. The rising sign, the houses, the conversation
            between these placements — that&rsquo;s the reading.
          </p>

          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-baseline gap-3 border border-moss bg-moss/30 px-8 py-3 font-sans text-xs uppercase tracking-[0.25em] text-parchment transition-base hover:bg-moss/50"
          >
            Cast the full chart <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
