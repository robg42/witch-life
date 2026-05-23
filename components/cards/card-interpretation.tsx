"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/deck";
import type { NatalChart, SkyState } from "@/lib/astro";
import type { VoiceKey } from "@/lib/voices";
import type { CardResponse } from "@/app/api/card/route";

/*
  Fetches and renders the action-shaped card reading: a one-sentence
  interpretation followed by a single paragraph telling the reader what
  to do with this card today.
*/

interface Props {
  card: Card | null;
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
  seasonalContext?: string;
}

export function CardInterpretation({
  card,
  sky,
  natal,
  voice,
  seasonalContext,
}: Props) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; data: CardResponse }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (!card) {
      setState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    fetch("/api/card", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ card, sky, natal, voice, seasonalContext }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = await safeJson(res);
          setState({
            kind: "error",
            message: body?.error ?? `Server responded ${res.status}`,
          });
          return;
        }
        const data = (await res.json()) as CardResponse;
        setState({ kind: "ok", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Network error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [card, sky, natal, voice, seasonalContext]);

  if (!card || state.kind === "idle") return null;

  return (
    <div className="mt-6 w-full max-w-xl">
      {state.kind === "loading" && (
        <div className="animate-pulse space-y-2 text-bark/40">
          <div className="h-3 w-32 bg-bark/20" />
          <div className="h-4 w-full bg-bark/15" />
          <div className="h-4 w-10/12 bg-bark/15" />
          <div className="h-4 w-9/12 bg-bark/15" />
        </div>
      )}
      {state.kind === "error" && (
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-clay">
          The oracle could not interpret this card · {state.message}
        </p>
      )}
      {state.kind === "ok" && (
        <div className="fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
            The {card.name}
          </p>
          <p className="oracle-body mt-3 text-ink/95">
            {state.data.interpretation}
          </p>
          <div className="mt-6 rounded-sm border border-clay/40 bg-clay/5 p-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
              What to do
            </p>
            <p className="oracle-body mt-2 text-ink/95">{state.data.action}</p>
          </div>
        </div>
      )}
    </div>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
