import { supabaseAdmin } from "@/lib/supabase/server";
import { isSubscribed } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import {
  FEATURES,
  featureDefinition,
  type FeatureKey,
  type FeatureDefinition,
} from "@/lib/features";

/*
  Server-side feature flag resolution. ALL gating goes through here so
  the rules stay consistent.

  Resolution order (most-specific wins):
    1. user_feature_overrides row → explicit on/off, full stop.
    2. feature_flags.globally_enabled = true → on for everyone in tier.
    3. FEATURES[key].defaultEnabled → hardcoded default.

  Tier rules:
    'free'  → anyone may have it on
    'paid'  → must have active subscription
    'admin' → must be admin

  Caching: per-request memoisation via a WeakMap on the request would
  be ideal, but Next.js server components don't share that lightly.
  Each call hits the DB. The relevant tables are tiny (<100 rows) so
  this is fine; if it ever bites we can add Vercel's `unstable_cache`.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/feature-flags-server must not be imported in client code");
}

interface FlagRow {
  key: string;
  globally_enabled: boolean;
  tier: string;
}

interface OverrideRow {
  flag_key: string;
  enabled: boolean;
}

/**
 * Resolve a single feature flag for the current authenticated user.
 * Returns false for unauthenticated visitors except for free-tier
 * features that are defaultEnabled (so the leaf still shows sky
 * alerts to an anonymous reader, for example).
 */
export async function hasFeature(key: FeatureKey): Promise<boolean> {
  const def: FeatureDefinition = featureDefinition(key);
  const { userId } = await auth();

  // Unauthenticated: only the hardcoded default applies, and only for
  // free-tier features (paid/admin features always require auth).
  if (!userId) {
    return def.tier === "free" && def.defaultEnabled;
  }

  const sb = supabaseAdmin();
  const [flagRes, overrideRes, userRes] = await Promise.all([
    sb.from("feature_flags").select("globally_enabled, tier").eq("key", key).maybeSingle(),
    (async () => {
      const { data: userRow } = await sb
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .maybeSingle();
      if (!userRow) return { data: null };
      return sb
        .from("user_feature_overrides")
        .select("enabled")
        .eq("user_id", (userRow as { id: string }).id)
        .eq("flag_key", key)
        .maybeSingle();
    })(),
    sb.from("users").select("is_admin").eq("clerk_id", userId).maybeSingle(),
  ]);

  const override = (overrideRes.data as OverrideRow | null)?.enabled;
  const flag = flagRes.data as FlagRow | null;
  const isUserAdmin = (userRes.data as { is_admin: boolean } | null)?.is_admin ?? false;

  // Resolve raw on/off before tier gating.
  let on: boolean;
  if (override !== undefined) on = override;
  else if (flag?.globally_enabled) on = true;
  else on = def.defaultEnabled;

  if (!on) return false;

  // Tier gating.
  if (def.tier === "admin") return isUserAdmin;
  if (def.tier === "paid") return isUserAdmin || (await isSubscribed());
  return true; // free
}

/**
 * Resolve all flags at once. Used by /admin and by anywhere that
 * needs to decide layout based on multiple features (the leaf
 * decides whether to render the sky-alert banner + streak chip
 * + journal-export button in one go).
 */
export async function resolveAllFeatures(): Promise<
  Record<FeatureKey, boolean>
> {
  const keys = Object.keys(FEATURES) as FeatureKey[];
  const results = await Promise.all(keys.map((k) => hasFeature(k)));
  const out = {} as Record<FeatureKey, boolean>;
  keys.forEach((k, i) => {
    out[k] = results[i];
  });
  return out;
}

/**
 * Throw if the current user doesn't have the named feature. Used at
 * the top of API routes that gate behind a flag.
 */
export async function requireFeature(key: FeatureKey): Promise<void> {
  if (!(await hasFeature(key))) {
    const def = featureDefinition(key);
    throw new FeatureRequiredError(key, def.tier);
  }
}

export class FeatureRequiredError extends Error {
  constructor(
    public readonly key: FeatureKey,
    public readonly tier: string,
  ) {
    super(`Feature '${key}' is not enabled for this user (tier: ${tier})`);
    this.name = "FeatureRequiredError";
  }
}
