/*
  Feature flag registry. The source of truth for which capabilities
  exist in Witch Life and what they do. The matching database table
  (public.feature_flags) holds the runtime-toggleable state; this
  module holds the type-safe registry.

  How resolution works (most-specific wins):
    1. Per-user override (user_feature_overrides table) — explicit
       enable/disable from /admin.
    2. globally_enabled column on feature_flags — admin's "turn it
       on for everyone" master switch.
    3. defaultEnabled — what's hardcoded as the safe default.

  Tier:
    'free'  — anyone can have the flag turned on
    'paid'  — only subscribers can have it on (subscription check applies)
    'admin' — admin-only

  Adding a new feature:
    1. Add a key here with metadata.
    2. Migration 0003 inserts a row into feature_flags on deploy.
    3. Guard the feature with `hasFeature(userId, 'your-key')`.
    4. Toggle in /admin/flags or /admin/users/[id].
*/

export type FeatureTier = "free" | "paid" | "admin";

/*
  We type the registry's `key` as `string` here to avoid a circular
  reference (FeatureKey is derived from FEATURES, which uses
  FeatureDefinition). The actual key strings are narrowed by the
  `satisfies` clause on FEATURES below, so external callers still
  get the tight FeatureKey union when they access FEATURES[key].key.
*/
export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  tier: FeatureTier;
  defaultEnabled: boolean;
  /** Marketing copy shown when the feature is locked behind a paywall. */
  paywallBlurb?: string;
}

/*
  All currently known features. Keep in sync with the `insert into
  feature_flags` block of supabase/migrations/0003_*.sql.
*/
export const FEATURES = {
  streaks: {
    key: "streaks",
    name: "Practice streaks",
    description:
      "Show a streak counter on /practice for consecutive days of completed practice.",
    tier: "free",
    defaultEnabled: true,
  },
  "journal-export": {
    key: "journal-export",
    name: "Journal export",
    description:
      "Download the full journal as markdown. Useful for archives or moving between apps.",
    tier: "free",
    defaultEnabled: true,
  },
  "sky-alerts": {
    key: "sky-alerts",
    name: "Sky alerts",
    description:
      "Surface a banner on the leaf when a significant sky event (eclipse, station, new moon) is within 48 hours.",
    tier: "free",
    defaultEnabled: true,
  },
  "shared-spreads": {
    key: "shared-spreads",
    name: "Shared spreads",
    description:
      "Generate a public URL for a three-card spread so the reader can share it with someone.",
    tier: "paid",
    defaultEnabled: false,
    paywallBlurb:
      "Subscribers can generate a public link to any three-card spread.",
  },
  "voice-listen": {
    key: "voice-listen",
    name: "Hear the oracle",
    description:
      "Generate text-to-speech audio of today's practice. Requires a TTS provider (not configured by default).",
    tier: "paid",
    defaultEnabled: false,
    paywallBlurb: "Listen to today's practice in your chosen voice.",
  },
  "daily-email": {
    key: "daily-email",
    name: "Daily morning email",
    description:
      "Receive today's practice by email each morning. Requires an outbound email provider (not configured by default).",
    tier: "paid",
    defaultEnabled: false,
    paywallBlurb: "Get today's practice delivered to your inbox each morning.",
  },
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureKey = keyof typeof FEATURES;

export const FEATURE_LIST: ReadonlyArray<FeatureDefinition> = Object.values(
  FEATURES,
);

export function isFeatureKey(value: string): value is FeatureKey {
  return value in FEATURES;
}

export function featureDefinition(key: FeatureKey): FeatureDefinition {
  return FEATURES[key];
}
