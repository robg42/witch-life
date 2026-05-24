import { DECK, type Card } from "@/lib/deck";

/*
  Channels — the Foreshore reinterpretation of the 28 cards.

  Each card becomes a numbered channel (00..27) with a single-word
  uppercase channel name derived from the card's name. The card's
  underlying data is unchanged; this is a presentation layer.

  We pre-compute a map at module load so all lookups are O(1).
*/

export interface Channel {
  /** 0-padded channel number, e.g. "04" */
  numberStr: string;
  /** 0..27 */
  number: number;
  /** Uppercase single-word channel name */
  name: string;
  /** The underlying card. Source of truth for the model. */
  card: Card;
}

/**
 * Re-map a card name to a punchier station channel name. Defaults
 * to the card's own name uppercased — most are already single
 * evocative words. We override a handful to make them feel more
 * radio-operator and less herbal.
 */
const NAME_OVERRIDES: Record<string, string> = {
  Mycelium: "UNDERGROUND",
  Hawthorn: "THRESHOLD",
  Threshold: "THRESHOLD",
  Saltwater: "BRINE",
  "New Moon": "DARK",
  "Full Moon": "HIGH",
  Decay: "ROT",
  Harvest: "INGATHER",
  Thaw: "RIVERMIND",
  Echo: "RECURRENCE",
};

function channelNameFor(card: Card): string {
  const override = NAME_OVERRIDES[card.name];
  if (override) return override;
  // Strip articles, take the most active word, uppercase.
  return card.name.toUpperCase().replace(/\s+/g, " ").trim();
}

export const CHANNELS: readonly Channel[] = DECK.map((card, i) => ({
  number: i,
  numberStr: String(i).padStart(2, "0"),
  name: channelNameFor(card),
  card,
}));

if (CHANNELS.length !== 28) {
  // Keeps the dial honest. If someone adds a 29th card, fail loudly.
  throw new Error(
    `Foreshore expects exactly 28 channels; got ${CHANNELS.length}.`,
  );
}

export function channelAt(n: number): Channel {
  // Defensive modulo — UI may pass uncapped numbers from key handlers.
  const safe = ((n % 28) + 28) % 28;
  return CHANNELS[safe];
}

/**
 * Find the channel that maps to a given underlying card name. Used
 * when the existing reading pipeline produces a daily card name and
 * we need to surface its channel.
 */
export function channelForCardName(name: string): Channel | null {
  return CHANNELS.find((c) => c.card.name === name) ?? null;
}
