/*
  Intentions — the practical orientations a reader chooses at onboarding
  and can edit later. Used by the daily practice generator to shape
  what each day's ritual actually serves. Used by the Library to match
  correspondences to what the reader has asked for.

  Ten options. The list is deliberately concrete and witch-shaped (not
  "self-actualisation", not "abundance"). It maps to real things a
  person might be trying to do with their attention.
*/

export type IntentionKey =
  | "clarity"
  | "courage"
  | "rest"
  | "healing"
  | "focus"
  | "presence"
  | "grief"
  | "fertility"
  | "boundaries"
  | "renewal";

export interface Intention {
  key: IntentionKey;
  label: string;
  description: string;
}

export const INTENTIONS: readonly Intention[] = [
  {
    key: "clarity",
    label: "Clarity",
    description: "To see what is actually in front of you.",
  },
  {
    key: "courage",
    label: "Courage",
    description: "To do the hard, honest thing.",
  },
  {
    key: "rest",
    label: "Rest",
    description: "To stop running. To let the body slow.",
  },
  {
    key: "healing",
    label: "Healing",
    description: "To tend to what is sore — body, heart, history.",
  },
  {
    key: "focus",
    label: "Focus",
    description: "To pour attention into one thing instead of many.",
  },
  {
    key: "presence",
    label: "Presence",
    description: "To be where you actually are.",
  },
  {
    key: "grief",
    label: "Grief",
    description: "To let what's gone be gone, slowly.",
  },
  {
    key: "fertility",
    label: "Fertility",
    description:
      "What you are growing — a body, a project, a relationship, a self.",
  },
  {
    key: "boundaries",
    label: "Boundaries",
    description: "To name the edges of you and keep them.",
  },
  {
    key: "renewal",
    label: "Renewal",
    description: "To begin again, on the other side of something.",
  },
] as const;

export const INTENTION_KEYS: IntentionKey[] = INTENTIONS.map((i) => i.key);

export function isIntentionKey(value: string): value is IntentionKey {
  return INTENTION_KEYS.includes(value as IntentionKey);
}

export function intentionLabel(key: string): string | null {
  const found = INTENTIONS.find((i) => i.key === key);
  return found?.label ?? null;
}
