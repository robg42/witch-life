import { supabaseAdmin } from "@/lib/supabase/server";
import {
  FEATURES,
  featureDefinition,
  type FeatureKey,
} from "@/lib/features";
import { SectionTitle, Pill } from "@/components/admin/primitives";
import { GlobalFlagToggle } from "@/components/admin/global-flag-toggle";

/*
  /admin/flags — global on/off for every registered feature. The
  hardcoded defaults from FEATURES[key].defaultEnabled apply when the
  global toggle is off and there's no per-user override. Per-user
  overrides win over everything.
*/

export const dynamic = "force-dynamic";

interface FlagRow {
  key: string;
  globally_enabled: boolean;
  tier: string;
}

export default async function AdminFlagsPage() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("feature_flags")
    .select("key, globally_enabled, tier");
  const rows = (data ?? []) as FlagRow[];
  const map = new Map(rows.map((r) => [r.key, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--c-ink)]">
          Feature flags
        </h1>
        <p className="mt-1 font-[family-name:var(--font-serif)] italic text-[var(--c-ash)]">
          Resolution order: user override → global flag → hardcoded default.
        </p>
      </div>

      <SectionTitle>Registered features</SectionTitle>
      <ul className="space-y-3">
        {(Object.keys(FEATURES) as FeatureKey[]).map((key) => {
          const def = featureDefinition(key);
          const row = map.get(key);
          const globallyEnabled = row?.globally_enabled ?? false;
          return (
            <li
              key={key}
              className="border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--c-ink)]">
                      {def.name}
                    </h3>
                    <Pill tone={def.tier === "paid" ? "good" : "muted"}>
                      {def.tier}
                    </Pill>
                    {def.defaultEnabled && <Pill>default on</Pill>}
                    <code className="font-[family-name:var(--font-mono)] text-[0.65rem] text-[var(--c-ash)]">
                      {def.key}
                    </code>
                  </div>
                  <p className="mt-1 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]">
                    {def.description}
                  </p>
                  {def.paywallBlurb && (
                    <p className="mt-1 font-[family-name:var(--font-serif)] text-xs italic text-[var(--c-ash)]">
                      Paywall blurb: {def.paywallBlurb}
                    </p>
                  )}
                </div>
                <GlobalFlagToggle flagKey={key} current={globallyEnabled} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
