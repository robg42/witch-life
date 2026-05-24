"use client";

import { useEffect, useState } from "react";
import { anomalyTone } from "@/lib/foreshore/sound";
import type { SkyAlert } from "@/lib/sky-alerts";

/*
  Anomaly badge — appears in the top-right of the CRT when one or
  more sky-alerts are active. Click to view detail. Pulses softly
  and (if sound is on) plays the rising anomaly tone once on first
  appearance.

  Reuses lib/sky-alerts (the broadsheet sky-alerts logic) for
  detection but renders with station vocabulary: "ANOMALY DETECTED"
  rather than "loud sky."
*/

export function AnomalyBadge({
  alerts,
  soundOn,
  onOpen,
}: {
  alerts: SkyAlert[];
  soundOn: boolean;
  onOpen: () => void;
}) {
  const [seen, setSeen] = useState(false);

  // Play the rising tone once on first appearance.
  useEffect(() => {
    if (alerts.length === 0 || seen) return;
    setSeen(true);
    if (soundOn) {
      try {
        anomalyTone();
      } catch {
        // ignore
      }
    }
  }, [alerts.length, seen, soundOn]);

  if (alerts.length === 0) return null;

  const primary = alerts[0];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group absolute right-4 top-4 z-[4] flex items-center gap-2 border border-[var(--fs-alarm)] bg-[var(--fs-housing)] px-2 py-1 fs-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--fs-alarm)] transition-colors hover:bg-[var(--fs-alarm)]/15"
      aria-label="Anomaly detected — click to investigate"
    >
      <span
        className="block h-[7px] w-[7px] rounded-full"
        style={{
          background: "var(--fs-alarm)",
          boxShadow: "0 0 8px var(--fs-alarm-glow)",
          animation: "fs-led-pulse 1.8s ease-in-out infinite",
        }}
      />
      <span>
        ANOMALY · {primary.title.toUpperCase()}
        {alerts.length > 1 && (
          <span className="ml-2 text-[var(--fs-alarm-glow)]">
            +{alerts.length - 1}
          </span>
        )}
      </span>
    </button>
  );
}
