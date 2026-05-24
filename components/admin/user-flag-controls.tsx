"use client";

import { useState, useTransition } from "react";
import { setUserFlagOverride } from "@/app/admin/actions";
import type { FeatureKey } from "@/lib/features";

/*
  Per-user, per-flag override switch. Three states:
    on      — force the flag on for this user, regardless of global
    off     — force off
    inherit — fall back to global flag → defaultEnabled
*/

type Choice = "on" | "off" | "inherit";

function currentChoice(current: boolean | null): Choice {
  if (current === true) return "on";
  if (current === false) return "off";
  return "inherit";
}

export function UserFlagControls({
  userId,
  flagKey,
  current,
}: {
  userId: string;
  flagKey: FeatureKey;
  current: boolean | null;
}) {
  const [choice, setChoice] = useState<Choice>(currentChoice(current));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = (next: Choice) => {
    setError(null);
    const prev = choice;
    setChoice(next);
    startTransition(async () => {
      try {
        await setUserFlagOverride({ userId, flagKey, state: next });
      } catch (e) {
        setChoice(prev);
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const choices: Array<{ key: Choice; label: string }> = [
    { key: "on", label: "On" },
    { key: "off", label: "Off" },
    { key: "inherit", label: "Inherit" },
  ];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex border border-[var(--c-rule)] bg-[var(--c-paper)]">
        {choices.map((c) => {
          const active = c.key === choice;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => apply(c.key)}
              disabled={pending}
              className={
                "px-3 py-1 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] transition-colors " +
                (active
                  ? "bg-[var(--c-ink)] text-[var(--c-paper-3)]"
                  : "text-[var(--c-ash)] hover:bg-[var(--c-paper-3)] hover:text-[var(--c-ink)]")
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--c-vermilion)]">
          {error}
        </p>
      )}
    </div>
  );
}
