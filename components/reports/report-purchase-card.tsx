"use client";

import { useState } from "react";
import type { ReportType } from "@/lib/reports";

interface Props {
  type: ReportType;
  title: string;
  blurb: string;
  priceGBP: number;
  available: boolean;
  unavailableReason?: string;
}

export function ReportPurchaseCard({
  type,
  title,
  blurb,
  priceGBP,
  available,
  unavailableReason,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "report", report: type }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Server responded ${res.status}`);
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setPending(false);
    }
  };

  return (
    <div className="hairline rounded-md bg-bark/30 px-5 py-5">
      <h3 className="accent text-xl text-parchment">{title}</h3>
      <p className="oracle-body mt-2 text-parchment/85">{blurb}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="font-serif text-base text-ochre">
          £{priceGBP}
        </span>
        {available ? (
          <button
            type="button"
            onClick={buy}
            disabled={pending}
            className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-5 py-2 text-parchment transition-base hover:bg-moss/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Opening Stripe…" : "Purchase"}
          </button>
        ) : (
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-ash">
            Not currently relevant
          </span>
        )}
      </div>
      {!available && unavailableReason && (
        <p className="mt-2 font-serif text-sm italic text-ash">
          {unavailableReason}
        </p>
      )}
      {error && <p className="mt-3 font-sans text-sm text-ochre">{error}</p>}
    </div>
  );
}
