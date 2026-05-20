/*
  The Verdant Oracle's 28-card botanical / elemental / animist deck.
  Four suits of seven. The names are intentionally archaic and concrete —
  no traditional tarot vocabulary, no Major / Minor split.

  The poetic description on each card is shown in the UI but never fed
  to the model verbatim; it's there for the reader, not for the oracle.
*/

import { julianDay } from "@/lib/astro";

export type Suit = "Root" | "Tide" | "Blade" | "Ember";

export interface Card {
  /** Stable identifier — also the artwork lookup key. */
  name: string;
  suit: Suit;
  /** One-sentence poetic line shown beside the artwork. */
  description: string;
}

export const DECK: readonly Card[] = [
  // ─── Root (earth) ───────────────────────────────────────────────────
  {
    name: "Seed",
    suit: "Root",
    description: "What is held tight in darkness before it is allowed to begin.",
  },
  {
    name: "Mycelium",
    suit: "Root",
    description: "The conversation no one above ground can hear.",
  },
  {
    name: "Stone",
    suit: "Root",
    description: "The patient refusal to be moved.",
  },
  {
    name: "Bark",
    suit: "Root",
    description: "What grows over the wound until the wound is also the tree.",
  },
  {
    name: "Burrow",
    suit: "Root",
    description: "A door cut into the earth for the body to rest behind.",
  },
  {
    name: "Decay",
    suit: "Root",
    description: "The slow generous undoing that feeds the next thing.",
  },
  {
    name: "Harvest",
    suit: "Root",
    description: "The hands open at last and the year is finally held.",
  },

  // ─── Tide (water) ───────────────────────────────────────────────────
  {
    name: "Current",
    suit: "Tide",
    description: "What carries you while you sleep.",
  },
  {
    name: "Depth",
    suit: "Tide",
    description: "Down past the part of the dark you know.",
  },
  {
    name: "Shore",
    suit: "Tide",
    description: "Where the water ends and the body has to make a decision.",
  },
  {
    name: "Mist",
    suit: "Tide",
    description: "The world made softer than you can take a knife to.",
  },
  {
    name: "Rain",
    suit: "Tide",
    description: "Permission, falling.",
  },
  {
    name: "Ice",
    suit: "Tide",
    description: "Feeling held so still it forgets how to move.",
  },
  {
    name: "Thaw",
    suit: "Tide",
    description: "Something frozen remembering it was once a river.",
  },

  // ─── Blade (air) ────────────────────────────────────────────────────
  {
    name: "Wind",
    suit: "Blade",
    description: "The thing you cannot see that is rearranging everything.",
  },
  {
    name: "Threshold",
    suit: "Blade",
    description: "The doorway you have already half walked through.",
  },
  {
    name: "Echo",
    suit: "Blade",
    description: "A truth that keeps coming back until you finally hear it.",
  },
  {
    name: "Smoke",
    suit: "Blade",
    description: "What is left when the fire has finished its sentence.",
  },
  {
    name: "Flight",
    suit: "Blade",
    description: "The body deciding to be brave above the ground.",
  },
  {
    name: "Silence",
    suit: "Blade",
    description: "The room after the right thing has finally been said.",
  },
  {
    name: "Storm",
    suit: "Blade",
    description: "Weather inside a person, which is also weather.",
  },

  // ─── Ember (fire) ───────────────────────────────────────────────────
  {
    name: "Spark",
    suit: "Ember",
    description: "The first yes, before the hands know what they are doing.",
  },
  {
    name: "Flame",
    suit: "Ember",
    description: "Wanting it, openly, and being seen wanting it.",
  },
  {
    name: "Ash",
    suit: "Ember",
    description: "Evidence that something was real and is now finished.",
  },
  {
    name: "Hearth",
    suit: "Ember",
    description: "The fire kept small on purpose, so it can keep being fed.",
  },
  {
    name: "Forge",
    suit: "Ember",
    description: "Heat used to make a thing that cannot be unmade.",
  },
  {
    name: "Char",
    suit: "Ember",
    description: "The body of what burned, still here, still useful.",
  },
  {
    name: "Dawn",
    suit: "Ember",
    description: "Returning. Quietly. Whether or not anyone is watching.",
  },
];

if (DECK.length !== 28) {
  throw new Error(`Deck must contain exactly 28 cards, has ${DECK.length}`);
}

/**
 * The daily seeded card. Same card for every reader on a given UTC day —
 * a collective anchor. Uses the Julian Day Number modulo 28 so the
 * sequence is deterministic across deployments.
 */
export function dailyCard(date: Date = new Date()): Card {
  const jd = Math.floor(julianDay(date));
  // jd can be negative for dates before 4713 BC; normalise to a positive
  // index so the modulo behaves as you'd expect.
  const index = ((jd % DECK.length) + DECK.length) % DECK.length;
  return DECK[index];
}

/**
 * A genuinely random card for on-demand pulls. Uses
 * `crypto.getRandomValues` when available (server + modern browsers),
 * falling back to Math.random in environments without it. The
 * fallback only matters for unit-test environments.
 */
export function randomCard(): Card {
  const buf = new Uint32Array(1);
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(buf);
    return DECK[buf[0] % DECK.length];
  }
  return DECK[Math.floor(Math.random() * DECK.length)];
}

/** Look up a card by exact name. Useful for tests and debug. */
export function cardByName(name: string): Card | undefined {
  return DECK.find((c) => c.name === name);
}
