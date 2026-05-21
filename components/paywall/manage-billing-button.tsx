"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Server responded ${res.status}`);
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open portal");
      setPending(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="font-sans text-xs uppercase tracking-[0.25em] border border-bark/30 bg-linen/60 px-6 py-3 text-ink transition-base hover:border-clay hover:text-clay disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening Stripe…" : "Manage billing"}
      </button>
      {error && <p className="mt-3 font-sans text-sm text-clay">{error}</p>}
    </div>
  );
}
