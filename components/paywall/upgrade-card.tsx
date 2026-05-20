"use client";

import { useState } from "react";

/*
  Soft-gate component. Names the locked feature, explains what it unlocks,
  and provides a single CTA. Never hard-blocks without explanation.
*/

interface UpgradeCardProps {
  title: string;
  body: string;
  ctaLabel: string;
  mode: "subscription" | "report";
  /** For subscription: 'monthly' | 'yearly'. For report: ReportType. */
  argument: string;
  /** Optional smaller secondary CTA (e.g. "or yearly £79"). */
  secondaryLabel?: string;
  secondaryArgument?: string;
}

export function UpgradeCard({
  title,
  body,
  ctaLabel,
  mode,
  argument,
  secondaryLabel,
  secondaryArgument,
}: UpgradeCardProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (arg: string) => {
    setPending(arg);
    setError(null);
    try {
      const payload =
        mode === "subscription"
          ? { mode: "subscription", plan: arg }
          : { mode: "report", report: arg };
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Server responded ${res.status}`);
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setPending(null);
    }
  };

  return (
    <div className="hairline rounded-md bg-bark/40 px-6 py-6">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ochre">
        For subscribers
      </p>
      <h3 className="accent mt-2 text-2xl text-parchment">{title}</h3>
      <p className="oracle-body mt-2 text-parchment/85">{body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => buy(argument)}
          disabled={pending !== null}
          className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/30 px-6 py-3 text-parchment transition-base hover:bg-moss/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === argument ? "Opening Stripe…" : ctaLabel}
        </button>
        {secondaryLabel && secondaryArgument && (
          <button
            type="button"
            onClick={() => buy(secondaryArgument)}
            disabled={pending !== null}
            className="font-sans text-xs uppercase tracking-[0.25em] text-sage transition-base hover:text-parchment disabled:opacity-60"
          >
            {pending === secondaryArgument ? "Opening Stripe…" : secondaryLabel}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-4 font-sans text-sm text-ochre">{error}</p>
      )}
    </div>
  );
}
