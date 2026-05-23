/*
  The eight sabbats of the wheel of the year. Each entry has the
  traditional meaning, a home practice (the subscriber-gated content),
  and reflection prompts. Hemisphere-aware: the sabbats happen six
  months apart depending which half of the year you live in.

  The fixed dates (Imbolc, Beltane, Lammas, Samhain) are calendar
  observances. The solstices/equinoxes (Yule, Ostara, Litha, Mabon)
  vary by ±1 day year-to-year; we hardcode reasonable approximate
  dates and accept the rounding for almanac use.
*/

export type SabbatKey =
  | "imbolc"
  | "ostara"
  | "beltane"
  | "litha"
  | "lammas"
  | "mabon"
  | "samhain"
  | "yule";

export interface Sabbat {
  key: SabbatKey;
  /** Northern hemisphere name; secondary southern name in southernAlt. */
  name: string;
  northernDate: { month: number; day: number };
  southernDate: { month: number; day: number };
  /** One-line opener, shown in cards/listing. */
  tagline: string;
  /** Free-tier visible — 1 paragraph context. */
  traditionalMeaning: string;
  /** Subscriber-only — 2-3 paragraphs of practical home practice. */
  homePractice: string;
  /** Subscriber-only — reflection questions to take to the journal. */
  reflectionPrompts: string[];
  /** Suggested correspondence IDs (from lib/correspondences.ts). */
  correspondenceIds: string[];
}

export const SABBATS: readonly Sabbat[] = [
  {
    key: "imbolc",
    name: "Imbolc",
    northernDate: { month: 2, day: 1 },
    southernDate: { month: 8, day: 1 },
    tagline: "The first stirring.",
    traditionalMeaning:
      "Imbolc, the cross-quarter between winter solstice and spring equinox, marks the moment the year begins to turn beneath the soil. Sheep begin to lamb; the snowdrops break. It is the festival of Brigid — goddess and saint of fire, smithing, poetry, midwifery — and of the returning light. Nothing visible is yet flowering; the practice is to notice the first stirring under the cold.",
    homePractice:
      "Make a small Brigid's cross from any long-stemmed plant — reeds, straw, dried grass, even paper strips. Hang it above your door for the year. Light a single candle and leave it burning while you do one small piece of work you have been putting off: a letter, a clean kitchen surface, a sharp pencil. Imbolc is the festival of small competent beginnings, not grand resolutions.\n\nIf you are a writer or maker, dedicate the candle to a piece of work you want to make this year. Speak its title aloud. Imbolc is Brigid's day, and Brigid keeps the forge — the work you commit to today is what she will tend on your behalf.\n\nLeave milk or cream on the doorstep at dusk as an offering. The cat will probably drink it; this is fine.",
    reflectionPrompts: [
      "What in me is stirring under the cold, that I have not yet named?",
      "What small competent thing can I do this week toward a year I want?",
      "Whom would I most like to be by next Imbolc?",
    ],
    correspondenceIds: ["candle", "white", "rosemary", "monday"],
  },
  {
    key: "ostara",
    name: "Ostara",
    northernDate: { month: 3, day: 20 },
    southernDate: { month: 9, day: 22 },
    tagline: "The light returns to centre.",
    traditionalMeaning:
      "The spring equinox: light and dark in balance, with light tipping over to dominance. Named after Eostre or Ostara, the dawn-goddess whose hare and egg gave the modern Easter its iconography. Ostara is the festival of return — the planet's tilt has decided in favour of growing. The blackthorn and primrose are out.",
    homePractice:
      "Get up early, while it is still dark. Make tea. Watch the actual dawn happen from a window or, better, from outside. This is not symbolic — the festival is the witnessing of light overtaking dark, and the body knows it differently when you have been awake for it.\n\nDecorate an egg (paint, dye with onion skins, draw on it in marker, write on it). Put it on a windowsill where the morning light will catch it. The egg holds what you are growing this season — name it on the shell, in a single word.\n\nPlant something. Anything. A seed in a paper cup of soil, a herb on the windowsill, a clipping in water. The act is what matters, not the survival of the plant.",
    reflectionPrompts: [
      "What is balanced in my life right now, and what is tipping?",
      "What am I ready to begin actually growing, not just considering?",
      "Where am I keeping things in the dark that want to come into the light?",
    ],
    correspondenceIds: ["water-bowl", "dandelion", "green", "wednesday"],
  },
  {
    key: "beltane",
    name: "Beltane",
    northernDate: { month: 5, day: 1 },
    southernDate: { month: 11, day: 1 },
    tagline: "The green threshold.",
    traditionalMeaning:
      "Beltane, the cross-quarter between the spring equinox and the summer solstice, is the festival of summer's arrival, fire, fertility, and the wedding of the green world. The hawthorn — the May tree — is in flower. Traditionally, cattle were driven between two fires to cleanse them before the summer's grazing.",
    homePractice:
      "Find a hawthorn tree in bloom and stand under it for ten minutes. If you can't find hawthorn, find any flowering tree — apple, blackthorn, lilac. Notice the bees if there are any. Beltane is a sensory festival; the practice is to be present to the riot of growing things.\n\nWeave or braid something — a flower crown, a friendship bracelet, a plait of your own hair. Beltane is the festival of unions and weavings; the act of plaiting is itself the practice.\n\nLight a small fire (a candle or stove flame counts) and pass any object through the smoke that you are taking into summer — keys, a phone, a wallet, the body's threshold. Speak what you want to take with you and what you want to leave behind in the same breath.",
    reflectionPrompts: [
      "What pleasure am I cutting myself off from this season?",
      "Who or what is in flower in my life right now? Am I tending to it?",
      "What threshold am I about to walk through?",
    ],
    correspondenceIds: ["hawthorn", "rose", "red", "fire"],
  },
  {
    key: "litha",
    name: "Litha",
    northernDate: { month: 6, day: 21 },
    southernDate: { month: 12, day: 21 },
    tagline: "The longest day.",
    traditionalMeaning:
      "The summer solstice. The sun reaches its highest declination; the longest day of the year. The festival of the king-sun and the herb-gatherers — many of the strongest healing plants (St John's wort, elder, mugwort, vervain) reach their peak potency on or around this day.",
    homePractice:
      "Be outside at the actual solstice moment if you can know when it is. If not, be outside at noon. Notice the height of the sun and where your shadow falls. The solstice is the festival of light at its fullest; the body remembers it without being told.\n\nGather any herb you can find — even a dandelion or a leaf of mint — and dry it. Solstice-gathered plants are traditionally the strongest. They will keep through the winter.\n\nStay up to see the sunset. This is a longer practice than it sounds. Litha is the day of fullness, but it is also the turning point — from here the days shorten. The witnessing of the sun's withdrawal is part of the practice.",
    reflectionPrompts: [
      "What is at its peak in my life right now, that I should notice while it is here?",
      "What am I being asked to receive, and have I let myself?",
      "What in me is already preparing for the dark half of the year?",
    ],
    correspondenceIds: ["gold", "mugwort", "sunday", "fire"],
  },
  {
    key: "lammas",
    name: "Lammas",
    northernDate: { month: 8, day: 1 },
    southernDate: { month: 2, day: 1 },
    tagline: "The first harvest.",
    traditionalMeaning:
      "Lammas — \"loaf-mass\" — is the festival of the first grain harvest. Named also Lughnasadh, after the god Lugh whose foster mother died in clearing the land for agriculture. It is the first of three harvests in the wheel of the year (followed by Mabon and Samhain), and the festival of acknowledging what has come ripe.",
    homePractice:
      "Bake bread. Or, if you cannot bake, eat bread with intention — toast made slowly with butter, a loaf bought from a bakery and eaten warm. Lammas is the loaf-festival; you cannot do it without bread.\n\nWalk somewhere that is in active harvest — a farm, an allotment, a garden, a hedgerow with blackberries. Look at what is being cut, gathered, taken in. Lammas is the recognition that summer is making things ready to end.\n\nMake a list of three things in your life that have come to fruit this year — not what you hoped for, what has actually happened. Acknowledge each one out loud or in writing.",
    reflectionPrompts: [
      "What have I actually grown this year, not just intended to grow?",
      "What am I taking in, and how do I want to use it?",
      "What is being cut so something else can be brought in?",
    ],
    correspondenceIds: ["honey", "thursday", "dandelion", "green"],
  },
  {
    key: "mabon",
    name: "Mabon",
    northernDate: { month: 9, day: 22 },
    southernDate: { month: 3, day: 20 },
    tagline: "The balance tips toward dark.",
    traditionalMeaning:
      "The autumn equinox. Light and dark in equal measure again, but now tipping toward the dark. The second harvest — fruit, late vegetables, the gold in the hedgerows. The witch's thanksgiving. Named in modern paganism after the Welsh god Mabon ap Modron; the festival is older than the name.",
    homePractice:
      "Walk somewhere with trees and look at the turning leaves. Find five colours — gold, ember, rust, brown, the last green — and bring back one leaf of each. Press them in a book.\n\nMake a meal from autumn foods: apples, root vegetables, mushrooms, late tomatoes, the last of the soft fruit. Cook slowly. Mabon is a slow festival; the practice is the cooking and the eating, not just having eaten.\n\nWrite down three things you are grateful for, and three things you are letting go of as the year tips toward dark. Burn the second list, or compost it.",
    reflectionPrompts: [
      "What am I genuinely grateful for, as the dark half begins?",
      "What weight am I carrying into the dark that I do not need to carry?",
      "What balance is tipping in my life, and is it tipping the way I want?",
    ],
    correspondenceIds: ["elder", "obsidian", "saturday", "earth"],
  },
  {
    key: "samhain",
    name: "Samhain",
    northernDate: { month: 10, day: 31 },
    southernDate: { month: 5, day: 1 },
    tagline: "The dead between us.",
    traditionalMeaning:
      "Samhain — Halloween — is the festival of the third and final harvest, the slaughter of livestock that would not survive the winter, and the night when the veil between the living and the dead is at its thinnest. The witch's new year. Everything that does not survive into winter is now released. The dead are nearer than usual.",
    homePractice:
      "Set a place at the table for someone who has died — a relative, a friend, an ancestor you never met. Light a candle. Speak their name out loud. You do not need to believe in anything for this to work.\n\nClean out one part of your home — a drawer, a cupboard, a corner of the floor. Samhain is a clearing festival; the work is the literal letting-go of what is no longer needed.\n\nWalk in the dark. Without your phone. Notice what your night-eyes can see that your day-eyes cannot. The veil is thin; the dark is full of more than usual.",
    reflectionPrompts: [
      "Who from my dead do I most need to speak to tonight?",
      "What in my life has died this year, and have I let it be dead?",
      "What does the dark know that the light does not?",
    ],
    correspondenceIds: ["black", "obsidian", "mugwort", "samhain"],
  },
  {
    key: "yule",
    name: "Yule",
    northernDate: { month: 12, day: 21 },
    southernDate: { month: 6, day: 21 },
    tagline: "The longest night.",
    traditionalMeaning:
      "The winter solstice. The longest night, the shortest day, the moment the year turns and the light begins to return. The Holly King is killed, the Oak King is reborn. Yule is the original midwinter festival — Christmas is its later overlay. The practice is to be awake for the return.",
    homePractice:
      "Stay up through some part of the longest night. Light real candles in real darkness. Witness the depth of the dark before you witness the dawn. You do not have to make it to morning; an hour of deliberate night will do.\n\nBring a green branch into the house — holly, ivy, evergreen, pine. Yule is the festival of the green things that do not die in winter. The branch is a promise that the dark is not the end.\n\nMake a list of what you want the returning sun to grow in you over the coming year. Burn the list in a candle flame, or put it under your pillow. The dark is for the seed; the light coming back is for the growing.",
    reflectionPrompts: [
      "What of mine is in the deepest dark right now, that I am trusting will return?",
      "What seed am I asking the returning sun to grow in me this coming year?",
      "What was this year of darkness for, and what did it teach me?",
    ],
    correspondenceIds: ["candle", "juniper", "sunday", "white"],
  },
] as const;

// ─── Date computation ──────────────────────────────────────────────────

export function sabbatDate(s: Sabbat, year: number, hemisphere: "N" | "S"): Date {
  const d = hemisphere === "N" ? s.northernDate : s.southernDate;
  return new Date(Date.UTC(year, d.month - 1, d.day));
}

/** The next upcoming sabbat for a given date and hemisphere. */
export function upcomingSabbat(
  now: Date = new Date(),
  hemisphere: "N" | "S" = "N",
): { sabbat: Sabbat; date: Date; daysUntil: number } {
  const year = now.getUTCFullYear();
  const candidates = SABBATS.flatMap((s) => [
    { sabbat: s, date: sabbatDate(s, year, hemisphere) },
    { sabbat: s, date: sabbatDate(s, year + 1, hemisphere) },
  ]).filter(({ date }) => date.getTime() >= now.getTime());

  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = candidates[0];
  const daysUntil = Math.ceil(
    (next.date.getTime() - now.getTime()) / 86_400_000,
  );
  return { sabbat: next.sabbat, date: next.date, daysUntil };
}

/** Whether `now` is within the ±3 day window of a sabbat. */
export function inSabbatWindow(
  now: Date = new Date(),
  hemisphere: "N" | "S" = "N",
  windowDays = 3,
): Sabbat | null {
  const year = now.getUTCFullYear();
  for (const s of SABBATS) {
    const d = sabbatDate(s, year, hemisphere);
    const diff = Math.abs(d.getTime() - now.getTime()) / 86_400_000;
    if (diff <= windowDays) return s;
  }
  return null;
}

export function sabbatByKey(key: string): Sabbat | undefined {
  return SABBATS.find((s) => s.key === key);
}
