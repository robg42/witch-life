"use client";

import { useState, useTransition } from "react";
import { setGlobalFlag } from "@/app/admin/actions";
import type { FeatureKey } from "@/lib/features";

/*
  Two-state toggle for the global flag. The hardcoded default still
  applies when this is off — toggling here only changes the
  globally_enabled column.
*/

export function GlobalFlagToggle({
  flagKey,
  current,
}: {
  flagKey: FeatureKey;
  current: boolean;
}) {
  const [on, setOn] = useState(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    setError(null);
    const next = !on;
    setOn(next);
    startTransition(async () => {
      try {
        await setGlobalFlag({ flagKey, globallyEnabled: next });
      } catch (e) {
        setOn(!next);
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          "relative h-7 w-14 border border-[var(--c-rule)] transition-colors " +
          (on ? "bg-[var(--c-vermilion)]" : "bg-[var(--c-paper)]")
        }
        aria-label={`Toggle ${flagKey}`}
        aria-pressed={on}
      >
        <span
          className={
            "absolute top-[2px] h-5 w-5 border border-[var(--c-rule)] bg-[var(--c-paper-3)] transition-transform " +
            (on ? "translate-x-7" : "translate-x-[2px]")
          }
        />
      </button>
      <span className="font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
        {on ? "global on" : "global off"}
      </span>
      {error && (
        <p className="font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--c-vermilion)]">
          {error}
        </p>
      )}
    </div>
  );
}
