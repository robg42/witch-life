import { getStreakSummary } from "@/lib/streaks";
import { hasFeature } from "@/lib/feature-flags-server";

/*
  Streak chip — small inline badge that surfaces the current and
  longest run of consecutive practice days. Hidden if the feature
  flag is off, or if the user has no practices yet (no value to show).

  This is a server component — it pulls from the DB on render. It's
  cheap (one indexed query, bounded by 60 days). If we ever want
  caching it can wrap in unstable_cache by user-id key.
*/

export async function StreakChip() {
  if (!(await hasFeature("streaks"))) return null;
  const s = await getStreakSummary();
  if (!s || s.totalInWindow === 0) return null;

  return (
    <div className="inline-flex items-center gap-3 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/60 px-3 py-2">
      <div className="flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tabular-nums text-[var(--c-vermilion)]">
          {s.current}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
          day{s.current === 1 ? "" : "s"}
        </span>
      </div>
      <div className="h-6 w-px bg-[var(--c-rule)]/60" aria-hidden />
      <div className="flex flex-col leading-tight">
        <span className="font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
          longest
        </span>
        <span className="font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums text-[var(--c-ink)]">
          {s.longest}
        </span>
      </div>
    </div>
  );
}
