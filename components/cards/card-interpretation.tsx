"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/deck";
import type { NatalChart, SkyState } from "@/lib/astro";
import type { VoiceKey } from "@/lib/voices";
import type { CardResponse } from "@/app/api/card/route";
import { OracleSection } from "@/components/reading/oracle-section";

/*
  Fetches the oracle's reading of a specific card against today's sky and
  the reader's natal chart. The fetch is keyed on the card name so a new
  card revealed on /draw replaces the prior interpretation cleanly.
*/

interface Props {
  card: Card | null;
  sky: SkyState;
  natal: NatalChart;
  voice: VoiceKey;
}

export function CardInterpretation({ card, sky, natal, voice }: Props) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; reading: string }
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
      body: JSON.stringify({ card, sky, natal, voice }),
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
        setState({ kind: "ok", reading: data.cardReading });
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
  }, [card, sky, natal, voice]);

  if (!card || state.kind === "idle") return null;

  return (
    <div className="mt-6 w-full max-w-xl">
      {state.kind === "loading" && (
        <div className="animate-pulse space-y-2 text-bark/40">
          <div className="h-3 w-28 bg-bark/20" />
          <div className="h-4 w-full bg-bark/15" />
          <div className="h-4 w-10/12 bg-bark/15" />
        </div>
      )}
      {state.kind === "error" && (
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-clay">
          The oracle could not interpret this card · {state.message}
        </p>
      )}
      {state.kind === "ok" && (
        <OracleSection label={`On the ${card.name}`}>
          {state.reading}
        </OracleSection>
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
