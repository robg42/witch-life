/*
  Almanac copy — the seasonal / agricultural / witch-calendar text that
  replaces zodiac language across the surface of Witch Life.

  The library is intentionally hemisphere-aware. Default is Northern.
  Returns short, concrete prose — "wild garlic flowering, hawthorn in
  bloom" — not horoscope abstractions.
*/

import type { Season } from "@/lib/astro";

interface AlmanacEntry {
  /** Short season name, e.g. "late spring", "deep autumn" */
  season: string;
  /** Nearest cross-quarter or solstice, e.g. "approaching Beltane" */
  marker: string;
  /** A line about what's actually happening on the land. */
  land: string;
}

/*
  Wheel of the Year cross-quarters and solstices, with dates and the
  surrounding span we describe.
*/
const NORTHERN_BY_MONTH: AlmanacEntry[] = [
  // January
  {
    season: "deep winter",
    marker: "approaching Imbolc",
    land: "frost in the morning, the seeds still dreaming.",
  },
  // February — Imbolc 1 Feb
  {
    season: "winter turning",
    marker: "Imbolc, the first stirring",
    land: "snowdrops up, lambing weather, the light returning a minute a day.",
  },
  // March
  {
    season: "the threshold of spring",
    marker: "approaching the spring equinox",
    land: "blackthorn flowering, daffodils, the soil waking under the hand.",
  },
  // April
  {
    season: "spring",
    marker: "the equinox passed",
    land: "wild garlic in the woods, primrose, the swallows starting to return.",
  },
  // May — Beltane 1 May
  {
    season: "late spring",
    marker: "Beltane, the green threshold",
    land: "hawthorn in bloom, bluebells, cow parsley along the verges.",
  },
  // June
  {
    season: "early summer",
    marker: "approaching the summer solstice",
    land: "elderflower, foxglove, the long evenings beginning.",
  },
  // July — Litha behind us, Lammas ahead
  {
    season: "high summer",
    marker: "the solstice past, Lammas ahead",
    land: "meadowsweet, the first grain ripening, the bees in the lime.",
  },
  // August — Lammas 1 Aug
  {
    season: "summer turning",
    marker: "Lammas, the first harvest",
    land: "blackberries reddening, the wheat being cut, swallows gathering on wires.",
  },
  // September
  {
    season: "early autumn",
    marker: "approaching the autumn equinox",
    land: "rosehips, sloes, the light shifting amber by mid-afternoon.",
  },
  // October — Mabon behind us, Samhain ahead
  {
    season: "deep autumn",
    marker: "approaching Samhain",
    land: "leaves turning and falling, mushrooms in the leaf litter, the year letting go.",
  },
  // November — Samhain just past
  {
    season: "autumn turning",
    marker: "Samhain, the dead between us",
    land: "the woods bare, the soil black with rot, the year underneath now.",
  },
  // December — Yule
  {
    season: "midwinter",
    marker: "Yule, the longest night",
    land: "holly and ivy, the sun at its lowest, the world holding still.",
  },
];

const SOUTHERN_BY_MONTH: AlmanacEntry[] = [
  // Southern hemisphere — offset by six months.
  NORTHERN_BY_MONTH[6], // Jan ↔ Jul
  NORTHERN_BY_MONTH[7],
  NORTHERN_BY_MONTH[8],
  NORTHERN_BY_MONTH[9],
  NORTHERN_BY_MONTH[10],
  NORTHERN_BY_MONTH[11],
  NORTHERN_BY_MONTH[0],
  NORTHERN_BY_MONTH[1],
  NORTHERN_BY_MONTH[2],
  NORTHERN_BY_MONTH[3],
  NORTHERN_BY_MONTH[4],
  NORTHERN_BY_MONTH[5],
];

/** Coarse-grain season name (matches the astro engine's Season type) */
export function plainSeason(s: Season): string {
  switch (s) {
    case "spring":
      return "spring";
    case "summer":
      return "summer";
    case "autumn":
      return "autumn";
    case "winter":
      return "winter";
  }
}

/**
 * The almanac entry for a given date and hemisphere. Defaults to
 * Northern. Used on the hub Today panel.
 */
export function almanacFor(
  date: Date,
  opts: { hemisphere?: "N" | "S" } = {},
): AlmanacEntry {
  const month = date.getUTCMonth();
  const table = opts.hemisphere === "S" ? SOUTHERN_BY_MONTH : NORTHERN_BY_MONTH;
  return table[month];
}
