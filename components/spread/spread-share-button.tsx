"use client";

import { useState } from "react";
import type { Card } from "@/lib/deck";
import type { SpreadResponse, SpreadLayout } from "@/app/api/spread/route";

/*
  Share button for a completed three-card spread. Calls POST
  /api/spread/share, which is gated by the 'shared-spreads' feature
  flag (and that flag is paid-tier). The button copes with three
  failure modes:
    - 401: ask the user to sign in
    - 403: tell them this is a paid feature
    - anything else: surface the error

  On success we show the URL inline and offer a one-click copy.
*/

export function SpreadShareButton({
  cards,
  layout,
  question,
  payload,
}: {
  cards: [Card, Card, Card];
  layout: SpreadLayout;
  question?: string;
  payload: SpreadResponse;
}) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "done"; url: string; copied: boolean }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const create = async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/spread/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cards, layout, question, payload }),
      });
      if (res.status === 401) {
        setState({ kind: "error", message: "Sign in to share." });
        return;
      }
      if (res.status === 403) {
        setState({
          kind: "error",
          message: "Sharing is a paid feature. Upgrade to share readings.",
        });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setState({
          kind: "error",
          message: body?.error ?? "Could not create share link.",
        });
        return;
      }
      const body = (await res.json()) as { token: string; url: string };
      const absolute =
        typeof window !== "undefined"
          ? new URL(body.url, window.location.origin).toString()
          : body.url;
      setState({ kind: "done", url: absolute, copied: false });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setState({ kind: "done", url, copied: true });
    } catch {
      // Ignore — user can still copy by hand from the input.
    }
  };

  if (state.kind === "done") {
    return (
      <div className="rounded-sm border border-bark/30 bg-linen/40 p-4">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
          Share link
        </p>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={state.url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 border border-bark/30 bg-wax/50 px-3 py-2 font-mono text-xs text-ink"
          />
          <button
            type="button"
            onClick={() => copy(state.url)}
            className="border border-bark/30 bg-wax/60 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-ink hover:border-clay hover:text-clay"
          >
            {state.copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={create}
        disabled={state.kind === "loading"}
        className="border border-bark/30 bg-linen/60 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.25em] text-ink transition-colors hover:border-clay hover:text-clay disabled:opacity-50"
      >
        {state.kind === "loading" ? "Creating link…" : "Share this reading"}
      </button>
      {state.kind === "error" && (
        <p className="mt-2 font-sans text-xs text-clay">{state.message}</p>
      )}
    </div>
  );
}
