/*
  Glyphs and metadata for the twelve zodiac signs and the seven traditional
  planets the oracle works with. Anything the UI needs to render a planet
  or a sign lives here.
*/

import type { Sign } from "@/lib/astro";

export const SIGN_GLYPH: Record<Sign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export const SIGN_ELEMENT: Record<Sign, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn";

export const PLANET_GLYPH: Record<PlanetKey, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
};

export const PLANET_NAME: Record<PlanetKey, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

/** Order planets are displayed in the natal strip (luminaries first). */
export const PLANET_ORDER: PlanetKey[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];
