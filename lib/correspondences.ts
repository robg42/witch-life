/*
  Correspondences — the searchable reference at the heart of the
  Library. Each entry is a real thing (a plant, a colour, a day of
  the week, a stone, a moon phase, an element) tagged with the
  intentions it traditionally serves.

  Used by:
    - /library page (search by intention, type, or name)
    - /api/library/practice route (generate a practice using a
      specific correspondence)
*/

import type { IntentionKey } from "@/lib/intentions";

export type CorrespondenceType =
  | "herb"
  | "colour"
  | "day"
  | "phase"
  | "element"
  | "stone"
  | "object";

export interface Correspondence {
  id: string;
  type: CorrespondenceType;
  name: string;
  /** Single-sentence summary shown beside the name in the Library. */
  summary: string;
  /** Traditional uses across folk practice. Concise, concrete. */
  traditionalUses: string[];
  /** Intentions this correspondence is well-matched to. */
  bestFor: IntentionKey[];
  /** A one-sentence seed the practice generator uses to scaffold a ritual. */
  practiceHint: string;
}

export const CORRESPONDENCES: readonly Correspondence[] = [
  // ─── Herbs ─────────────────────────────────────────────────────────────
  {
    id: "rosemary",
    type: "herb",
    name: "Rosemary",
    summary: "Memory, clarity, the cutting edge of attention.",
    traditionalUses: [
      "burned to clear stagnant air",
      "carried for protection on a journey",
      "steeped in baths for clear thinking",
    ],
    bestFor: ["clarity", "focus", "courage"],
    practiceHint:
      "Crush a sprig between your palms and inhale before the practice begins.",
  },
  {
    id: "lavender",
    type: "herb",
    name: "Lavender",
    summary: "Calming, sleep, the soft edge of a hard day.",
    traditionalUses: [
      "tucked under the pillow for rest",
      "steeped in tea before bed",
      "burned to soften grief",
    ],
    bestFor: ["rest", "healing", "grief"],
    practiceHint:
      "Tuck a sprig of lavender (or a drop of oil on a cloth) into your collar.",
  },
  {
    id: "sage",
    type: "herb",
    name: "Sage",
    summary: "Cleansing, the resetting of a room.",
    traditionalUses: [
      "burned to clear a stale room",
      "carried during difficult conversations",
      "steeped in cleansing baths",
    ],
    bestFor: ["clarity", "renewal", "boundaries"],
    practiceHint:
      "Walk through your home with a smouldering sage leaf, paying attention to corners.",
  },
  {
    id: "mugwort",
    type: "herb",
    name: "Mugwort",
    summary: "Dreams, the lifted veil between worlds.",
    traditionalUses: [
      "placed under the pillow for vivid dreams",
      "drunk weakly to deepen meditation",
      "burned at the threshold",
    ],
    bestFor: ["presence", "clarity", "grief"],
    practiceHint:
      "Set a small bundle of mugwort beside the bed and write down the first dream.",
  },
  {
    id: "yarrow",
    type: "herb",
    name: "Yarrow",
    summary: "Courage, stanching the wound.",
    traditionalUses: [
      "carried for courage before a confrontation",
      "pressed onto a cut as a poultice",
      "burned at funerals",
    ],
    bestFor: ["courage", "healing", "boundaries"],
    practiceHint:
      "Hold a stem of yarrow (or any flower) for two minutes before doing the hard thing.",
  },
  {
    id: "nettle",
    type: "herb",
    name: "Nettle",
    summary: "Strengthening, the iron returning.",
    traditionalUses: [
      "steeped in tea for blood and bone",
      "carried to lend stamina",
      "hung at the door against ill-will",
    ],
    bestFor: ["healing", "renewal", "boundaries"],
    practiceHint:
      "Brew a strong nettle tea (or any green tea) and drink the whole cup slowly.",
  },
  {
    id: "chamomile",
    type: "herb",
    name: "Chamomile",
    summary: "Soft money, easy sleep, gentle endings.",
    traditionalUses: [
      "scattered to attract steady abundance",
      "steeped before sleep",
      "drunk for a settled stomach",
    ],
    bestFor: ["rest", "healing", "renewal"],
    practiceHint:
      "Brew a cup of chamomile tea and drink it with no phone in the room.",
  },
  {
    id: "rose",
    type: "herb",
    name: "Rose",
    summary: "Love that knows its own shape; tenderness with a thorn.",
    traditionalUses: [
      "petals scattered for self-love",
      "thorns hung for protection of the heart",
      "burned for grief",
    ],
    bestFor: ["healing", "grief", "presence"],
    practiceHint:
      "Float a single rose petal (or any flower) in a bowl of warm water and watch it.",
  },
  {
    id: "thyme",
    type: "herb",
    name: "Thyme",
    summary: "Courage, the small bright thing.",
    traditionalUses: [
      "carried into battle by Greek soldiers",
      "steeped against winter colds",
      "burned at thresholds",
    ],
    bestFor: ["courage", "focus", "renewal"],
    practiceHint:
      "Pinch a sprig of thyme between fingers and breathe its smell three times.",
  },
  {
    id: "mint",
    type: "herb",
    name: "Mint",
    summary: "Brightening, the green snap awake.",
    traditionalUses: [
      "chewed for clear speech",
      "rubbed on coins for steady flow of money",
      "drunk in tea for clarity",
    ],
    bestFor: ["clarity", "focus", "renewal"],
    practiceHint:
      "Chew a fresh mint leaf slowly. Notice when the brightness peaks.",
  },
  {
    id: "hawthorn",
    type: "herb",
    name: "Hawthorn",
    summary: "The heart, the threshold, the in-between.",
    traditionalUses: [
      "branches hung above the door at Beltane",
      "berries eaten for the heart",
      "the tree of liminality",
    ],
    bestFor: ["renewal", "presence", "healing"],
    practiceHint:
      "Stand at any threshold (doorway, garden gate) and notice what side you are on.",
  },
  {
    id: "elder",
    type: "herb",
    name: "Elder",
    summary: "The crone tree, the gentle wisdom of late years.",
    traditionalUses: [
      "berries steeped against fevers",
      "wood never burned, out of respect for the elder mother",
      "flowers gathered at the solstice",
    ],
    bestFor: ["grief", "rest", "renewal"],
    practiceHint:
      "Sit with someone older than you (in person or in memory) for five minutes.",
  },
  {
    id: "dandelion",
    type: "herb",
    name: "Dandelion",
    summary: "Stubbornness, the sun in difficult ground.",
    traditionalUses: [
      "leaves eaten for spring strength",
      "blown to make a wish",
      "roots dug for the patient body",
    ],
    bestFor: ["courage", "renewal", "fertility"],
    practiceHint:
      "Find a dandelion (or any weed growing in a crack) and look at it for a minute.",
  },
  {
    id: "juniper",
    type: "herb",
    name: "Juniper",
    summary: "Cleansing smoke, the cold edge of clarity.",
    traditionalUses: [
      "burned to clear a room of illness",
      "berries drunk for digestion",
      "branches carried for protection",
    ],
    bestFor: ["clarity", "boundaries", "renewal"],
    practiceHint:
      "Burn juniper (or any incense) at the door for one minute. Then step out and back in.",
  },
  {
    id: "garlic",
    type: "herb",
    name: "Garlic",
    summary: "Protection, the bulb at the threshold.",
    traditionalUses: [
      "hung at the door to keep out ill-will",
      "eaten raw against illness",
      "rubbed on tools to claim them",
    ],
    bestFor: ["boundaries", "courage", "healing"],
    practiceHint:
      "Hang or place a clove of garlic at the entrance to your home.",
  },

  // ─── Colours ──────────────────────────────────────────────────────────
  {
    id: "black",
    type: "colour",
    name: "Black",
    summary: "Returning to the dark; what holds.",
    traditionalUses: [
      "worn for mourning",
      "absorbs and contains",
      "the colour of rich soil",
    ],
    bestFor: ["grief", "rest", "boundaries"],
    practiceHint:
      "Put on something black for the practice. Sit in the darkest room of your home.",
  },
  {
    id: "white",
    type: "colour",
    name: "White",
    summary: "Beginning, the page before the ink.",
    traditionalUses: [
      "burned candles for clean starts",
      "worn at handfastings",
      "the colour of milk and bone",
    ],
    bestFor: ["renewal", "clarity", "fertility"],
    practiceHint:
      "Light a white candle. Write one sentence on a blank page.",
  },
  {
    id: "red",
    type: "colour",
    name: "Red",
    summary: "The living blood; courage, desire, fight.",
    traditionalUses: [
      "tied at the wrist for vitality",
      "the colour of warmth and warning",
      "carried against the evil eye",
    ],
    bestFor: ["courage", "fertility", "presence"],
    practiceHint: "Wear or carry something red for the duration of the practice.",
  },
  {
    id: "green",
    type: "colour",
    name: "Green",
    summary: "Growth, the living world, the moss patience.",
    traditionalUses: [
      "the colour of growing things",
      "for fertility and steady money",
      "the cloak of the year",
    ],
    bestFor: ["fertility", "healing", "renewal"],
    practiceHint:
      "Find a living green thing (a plant, a leaf, moss) and look at it for two minutes.",
  },
  {
    id: "gold",
    type: "colour",
    name: "Gold",
    summary: "The sun-warm, the dignified self.",
    traditionalUses: [
      "ringed for fidelity",
      "the colour of sovereignty",
      "burned in candles for visibility",
    ],
    bestFor: ["courage", "presence", "renewal"],
    practiceHint:
      "Hold any gold-coloured object (a coin, a ring, a leaf in autumn) in your palm.",
  },

  // ─── Days ─────────────────────────────────────────────────────────────
  {
    id: "monday",
    type: "day",
    name: "Monday",
    summary: "The moon's day. Reflection, dreams, the body's needs.",
    traditionalUses: [
      "for rest and recovery",
      "for divination and inward work",
      "for nourishing food",
    ],
    bestFor: ["rest", "healing", "presence"],
    practiceHint:
      "Take a long bath, or wash your face slowly with cold water before bed.",
  },
  {
    id: "tuesday",
    type: "day",
    name: "Tuesday",
    summary: "Mars's day. Action, courage, the cut.",
    traditionalUses: [
      "for difficult conversations",
      "for breaking ground on a project",
      "for assertion and defence",
    ],
    bestFor: ["courage", "focus", "boundaries"],
    practiceHint:
      "Write the email you have been avoiding. Send it before you read it back.",
  },
  {
    id: "wednesday",
    type: "day",
    name: "Wednesday",
    summary: "Mercury's day. Words, travel, letters.",
    traditionalUses: [
      "for writing and speaking",
      "for short journeys",
      "for clearing communication",
    ],
    bestFor: ["clarity", "focus", "renewal"],
    practiceHint: "Write a letter (to anyone, including yourself) by hand.",
  },
  {
    id: "thursday",
    type: "day",
    name: "Thursday",
    summary: "Jupiter's day. Expansion, generosity, opening.",
    traditionalUses: [
      "for asking for what you need",
      "for hospitality",
      "for the larger view",
    ],
    bestFor: ["renewal", "fertility", "courage"],
    practiceHint:
      "Invite one person to do one small thing with you this week. Today.",
  },
  {
    id: "friday",
    type: "day",
    name: "Friday",
    summary: "Venus's day. Pleasure, love, beauty, repair.",
    traditionalUses: [
      "for self-tending",
      "for mending what has been frayed",
      "for sensual attention",
    ],
    bestFor: ["healing", "presence", "fertility"],
    practiceHint:
      "Tend to one thing in your home with care for ten minutes. Slowly.",
  },
  {
    id: "saturday",
    type: "day",
    name: "Saturday",
    summary: "Saturn's day. Endings, boundaries, structure.",
    traditionalUses: [
      "for clearing what no longer serves",
      "for setting down a burden",
      "for binding and limiting",
    ],
    bestFor: ["boundaries", "grief", "rest"],
    practiceHint: "Throw out, give away, or burn one thing you no longer want.",
  },
  {
    id: "sunday",
    type: "day",
    name: "Sunday",
    summary: "The sun's day. Vitality, visibility, the central thing.",
    traditionalUses: [
      "for showing up fully",
      "for honour and recognition",
      "for the body in the light",
    ],
    bestFor: ["courage", "presence", "renewal"],
    practiceHint: "Stand in direct sunlight (or by the window) for five minutes.",
  },

  // ─── Moon phases ──────────────────────────────────────────────────────
  {
    id: "new-moon",
    type: "phase",
    name: "New moon",
    summary: "The dark before. Setting the seed.",
    traditionalUses: [
      "for naming what you want to begin",
      "for the smallest first step",
      "for rest before the cycle starts",
    ],
    bestFor: ["renewal", "fertility", "clarity"],
    practiceHint:
      "Write one sentence about what you want to begin. Fold the paper. Keep it.",
  },
  {
    id: "waxing-moon",
    type: "phase",
    name: "Waxing moon",
    summary: "Building. Pouring energy in.",
    traditionalUses: [
      "for projects gaining momentum",
      "for asking for what you need",
      "for putting on weight, growing roots",
    ],
    bestFor: ["focus", "fertility", "courage"],
    practiceHint: "Add one specific thing to your week that builds what you want.",
  },
  {
    id: "full-moon",
    type: "phase",
    name: "Full moon",
    summary: "Full visibility. What has come into being.",
    traditionalUses: [
      "for harvest and gratitude",
      "for ritual high points",
      "for facing what you cannot ignore",
    ],
    bestFor: ["presence", "clarity", "courage"],
    practiceHint:
      "Stand outside (or by a window) under the moon for two minutes. Eyes open.",
  },
  {
    id: "waning-moon",
    type: "phase",
    name: "Waning moon",
    summary: "Releasing. What is being shed.",
    traditionalUses: [
      "for endings and clearings",
      "for forgiveness",
      "for compost",
    ],
    bestFor: ["grief", "rest", "boundaries"],
    practiceHint:
      "Write down one thing you are ready to release. Burn the paper, or tear it.",
  },

  // ─── Elements ─────────────────────────────────────────────────────────
  {
    id: "earth",
    type: "element",
    name: "Earth",
    summary: "Stability, body, the slow material.",
    traditionalUses: [
      "for grounding",
      "for steady work",
      "for honouring the dead",
    ],
    bestFor: ["rest", "presence", "boundaries"],
    practiceHint:
      "Press your bare feet against the ground (or floor) for three minutes.",
  },
  {
    id: "water",
    type: "element",
    name: "Water",
    summary: "Feeling, dream, the soft change.",
    traditionalUses: ["for emotion", "for cleansing", "for dreaming"],
    bestFor: ["healing", "grief", "presence"],
    practiceHint:
      "Fill a glass with cold water. Hold it against your forehead for a minute.",
  },
  {
    id: "air",
    type: "element",
    name: "Air",
    summary: "Thought, speech, the moving thing.",
    traditionalUses: ["for clarity", "for letters", "for new ideas"],
    bestFor: ["clarity", "focus", "courage"],
    practiceHint:
      "Open a window. Let the air change in the room. Stand in the draught.",
  },
  {
    id: "fire",
    type: "element",
    name: "Fire",
    summary: "Will, courage, the burning thing.",
    traditionalUses: ["for transformation", "for clearing", "for desire"],
    bestFor: ["courage", "renewal", "focus"],
    practiceHint:
      "Light a candle. Watch the flame for two minutes without looking away.",
  },

  // ─── Stones ───────────────────────────────────────────────────────────
  {
    id: "amethyst",
    type: "stone",
    name: "Amethyst",
    summary: "Steadiness, the cooled head.",
    traditionalUses: [
      "carried against drunkenness and rashness",
      "kept by the bed for clear dreams",
      "in the hand for calm",
    ],
    bestFor: ["clarity", "rest", "boundaries"],
    practiceHint:
      "Hold any small stone in your closed left hand for the full practice.",
  },
  {
    id: "rose-quartz",
    type: "stone",
    name: "Rose quartz",
    summary: "The soft heart, gentle return.",
    traditionalUses: [
      "kept against the heart",
      "in a glass of water beside the bed",
      "given to the grieving",
    ],
    bestFor: ["healing", "grief", "presence"],
    practiceHint:
      "Place a small object (stone, ring, pebble) on your sternum and breathe under it.",
  },
  {
    id: "obsidian",
    type: "stone",
    name: "Obsidian",
    summary: "The black mirror; what you do not want to look at.",
    traditionalUses: [
      "scryed for hard truths",
      "carried for grounding after shock",
      "set at thresholds",
    ],
    bestFor: ["boundaries", "grief", "clarity"],
    practiceHint:
      "Look into any dark reflective surface (phone screen off, dark glass) for two minutes.",
  },
  {
    id: "clear-quartz",
    type: "stone",
    name: "Clear quartz",
    summary: "Amplifier, the carrier of light.",
    traditionalUses: [
      "held to sharpen any intention",
      "in window-light",
      "passed across the body to clear",
    ],
    bestFor: ["clarity", "focus", "renewal"],
    practiceHint:
      "Hold any clear glass or stone up to the light and look through it for a minute.",
  },

  // ─── Objects ──────────────────────────────────────────────────────────
  {
    id: "candle",
    type: "object",
    name: "A candle",
    summary: "The first witch's tool. Attention, vow, the steady flame.",
    traditionalUses: [
      "lit to begin and end practice",
      "burned with intention",
      "kept against fear",
    ],
    bestFor: ["focus", "presence", "courage"],
    practiceHint:
      "Light one candle. Speak one sentence out loud. Sit with the flame for two minutes.",
  },
  {
    id: "salt",
    type: "object",
    name: "Salt",
    summary: "The boundary, the keeper.",
    traditionalUses: [
      "scattered at the threshold",
      "added to bathwater",
      "thrown over the shoulder",
    ],
    bestFor: ["boundaries", "renewal", "courage"],
    practiceHint:
      "Sprinkle a pinch of salt at your front door (inside and out).",
  },
  {
    id: "water-bowl",
    type: "object",
    name: "A bowl of water",
    summary: "The simplest scrying tool; the soft mirror.",
    traditionalUses: [
      "for reflection and divination",
      "blessed and set at the centre",
      "for washing hands at the start of work",
    ],
    bestFor: ["clarity", "presence", "healing"],
    practiceHint:
      "Fill a bowl with cold water. Dip both hands. Hold them there for a minute.",
  },
  {
    id: "mirror",
    type: "object",
    name: "A mirror",
    summary: "Self-seeing. The hardest tool.",
    traditionalUses: [
      "looked into to know what is true",
      "covered after a death",
      "kept against the evil eye",
    ],
    bestFor: ["presence", "courage", "boundaries"],
    practiceHint:
      "Sit in front of a mirror. Look into your own eyes for two minutes. Without speaking.",
  },
  {
    id: "key",
    type: "object",
    name: "A key",
    summary: "Threshold authority. The opening and the closing.",
    traditionalUses: [
      "hung at the door to keep the home",
      "given as a token of trust",
      "buried with the dead",
    ],
    bestFor: ["boundaries", "courage", "renewal"],
    practiceHint:
      "Carry one key in your pocket today. Touch it whenever you need a boundary.",
  },
  {
    id: "honey",
    type: "object",
    name: "Honey",
    summary: "Sweetness, slow time, the offering.",
    traditionalUses: [
      "left as an offering for the spirits of place",
      "added to bargains and bindings",
      "drunk in tea against bitterness",
    ],
    bestFor: ["healing", "fertility", "presence"],
    practiceHint:
      "Eat one spoonful of honey slowly with no other food. Notice when the sweet fades.",
  },
  {
    id: "thread",
    type: "object",
    name: "Red thread",
    summary: "Binding, protection, the line drawn.",
    traditionalUses: [
      "tied at the wrist for protection",
      "wound around a candle to bind a working",
      "given to a newborn",
    ],
    bestFor: ["boundaries", "courage", "healing"],
    practiceHint:
      "Tie a piece of red thread (or any string) around your wrist for the practice.",
  },
  {
    id: "feather",
    type: "object",
    name: "A feather",
    summary: "Air made visible, the falling thing.",
    traditionalUses: [
      "kept as a token of attention",
      "burned in difficult times",
      "swept across the body to clear",
    ],
    bestFor: ["clarity", "renewal", "presence"],
    practiceHint:
      "Find any feather (or use a soft cloth). Brush it lightly across your face once.",
  },
] as const;

// ─── Lookup helpers ─────────────────────────────────────────────────────

export function correspondenceById(id: string): Correspondence | undefined {
  return CORRESPONDENCES.find((c) => c.id === id);
}

export function correspondencesByType(
  type: CorrespondenceType,
): Correspondence[] {
  return CORRESPONDENCES.filter((c) => c.type === type);
}

export function correspondencesForIntention(
  intention: IntentionKey,
): Correspondence[] {
  return CORRESPONDENCES.filter((c) => c.bestFor.includes(intention));
}

/** Free-tier preview: first six entries across types. Stable order. */
export const PREVIEW_CORRESPONDENCES: readonly Correspondence[] = [
  correspondenceById("rosemary")!,
  correspondenceById("candle")!,
  correspondenceById("waning-moon")!,
  correspondenceById("salt")!,
  correspondenceById("rose")!,
  correspondenceById("fire")!,
];

export const CORRESPONDENCE_TYPES: readonly {
  type: CorrespondenceType;
  label: string;
}[] = [
  { type: "herb", label: "Herbs" },
  { type: "stone", label: "Stones" },
  { type: "colour", label: "Colours" },
  { type: "day", label: "Days" },
  { type: "phase", label: "Phases" },
  { type: "element", label: "Elements" },
  { type: "object", label: "Objects" },
] as const;
