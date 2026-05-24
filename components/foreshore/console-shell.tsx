"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  computeNatalChart,
  getSkyState,
} from "@/lib/astro";
import {
  birthToUtcDate,
  loadBirth,
  type BirthDetails,
} from "@/lib/birth-details";
import {
  DEFAULT_PHOSPHOR,
  loadOperator,
  saveOperator,
  type OperatorPrefs,
} from "@/lib/foreshore/operator";
import { CHANNELS, channelAt } from "@/lib/foreshore/channels";
import {
  unlockAudio,
  startHum,
  stopHum,
  clack,
  staticWash,
  acquire,
  click,
} from "@/lib/foreshore/sound";
import { computeSkyAlerts, type SkyAlert } from "@/lib/sky-alerts";
import { CRTScreen } from "./crt-screen";
import { TypeOn } from "./type-on";
import { AtmosphericStrip } from "./atmospheric-strip";
import { Dial } from "./dial";
import { LogInput } from "./log-input";
import { TapeView } from "./tape-view";
import { AnomalyBadge } from "./anomaly-badge";
import { AnomalyPanel } from "./anomaly-panel";

/*
  Console shell — the entire Foreshore product UI is rendered inside
  this one component. It is the operator's room.

  The shell is a state machine over what the CRT currently shows:
    STANDBY                 — idle, default
    CHANNEL_CARD            — the operator has tuned to a channel; channel
                              card shown, "transmit" available
    TRANSMISSION_INCOMING   — transmission is typing out
    TRANSMISSION_COMPLETE   — transmission finished, can log it or hold
    TAPE_PLAYBACK           — scrolling archive (built in Phase C)
    LOG_ENTRY               — capture input open (Phase C)
    OPERATOR_FILE           — dossier (Phase G)
    LETTER_OPEN             — paper-mode letter view (Phase H)

  Phase A scope: STANDBY + CHANNEL_CARD + the two transmission states.
  Subsequent phases plug in.
*/

type PanelState =
  | { kind: "standby" }
  | { kind: "channel"; channel: number }
  | { kind: "transmitting"; channel: number; text: string }
  | { kind: "received"; channel: number; text: string }
  | { kind: "log"; channel: number }
  | { kind: "tape"; channel: number }
  | { kind: "filed"; channel: number; text: string }
  | { kind: "anomaly"; channel: number; alerts: SkyAlert[] }
  | { kind: "error"; channel: number; message: string };

export function ConsoleShell() {
  const router = useRouter();
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [operator, setOperator] = useState<OperatorPrefs>({});
  const [panel, setPanel] = useState<PanelState>({ kind: "standby" });
  const [glitching, setGlitching] = useState(false);

  // Boot: load birth + operator from local storage. If birth is
  // missing, route to /calibrate (the new enrolment, built in Phase D).
  // During Phase A — before /calibrate exists — fall through to a
  // gentle empty state instead of breaking.
  useEffect(() => {
    const b = loadBirth();
    setBirth(b);
    setOperator({ phosphor: DEFAULT_PHOSPHOR, sound: false, ...loadOperator() });
  }, []);

  // When the operator's phosphor preference changes, mirror it onto
  // the <html> data attribute so the CSS theme switches.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-foreshore", "");
    root.setAttribute("data-crt", operator.phosphor ?? DEFAULT_PHOSPHOR);
    return () => {
      // Don't remove on unmount — staying on the console; the cleanup
      // would fire only if we re-mount the shell, which is fine.
    };
  }, [operator.phosphor]);

  // Sound: start / stop the ambient hum when sound preference flips.
  useEffect(() => {
    if (operator.sound) {
      startHum();
    } else {
      stopHum();
    }
    return () => {
      // Don't stop on unmount — the hum is owned by the page-long
      // singleton context; stopHum is only called when the operator
      // explicitly mutes.
    };
  }, [operator.sound]);

  const setSound = useCallback(async (next: boolean) => {
    if (next) await unlockAudio();
    setOperator((prev) => {
      const merged = { ...prev, sound: next };
      saveOperator({ sound: next });
      return merged;
    });
  }, []);

  // Derive astronomical state once per session — same as the broadsheet
  // does. Cheap (pure TS engine).
  const computed = useMemo(() => {
    if (!birth) return null;
    const now = new Date();
    const sky = getSkyState(now, { lat: birth.lat });
    const natal = computeNatalChart({
      date: birthToUtcDate(birth),
      lat: birth.lat,
      lng: birth.lng,
    });
    return { sky, natal, alerts: computeSkyAlerts(sky, now) };
  }, [birth]);

  const channel = panel.kind === "standby" ? 0 : panel.channel;
  const currentChannel = channelAt(channel);

  const onTune = useCallback((next: number) => {
    if (operator.sound) click();
    setPanel({ kind: "channel", channel: next });
  }, [operator.sound]);

  const onSettle = useCallback(() => {
    if (operator.sound) staticWash();
  }, [operator.sound]);

  const onTransmit = useCallback(async () => {
    if (!birth || !computed) return;
    if (panel.kind !== "channel") return;
    const ch = channelAt(panel.channel);

    if (operator.sound) {
      clack();
      window.setTimeout(() => acquire(), 350);
    }

    // Trigger a brief glitch as the signal "arrives".
    setGlitching(true);
    window.setTimeout(() => setGlitching(false), 1300);

    setPanel({ kind: "transmitting", channel: panel.channel, text: "" });

    try {
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sky: computed.sky,
          natal: computed.natal,
          voice: birth.voice,
          intentions: birth.intentions,
          channel: {
            number: ch.number,
            name: ch.name,
            card: ch.card,
          },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setPanel({
          kind: "error",
          channel: panel.channel,
          message: body?.error ?? "SIGNAL LOST",
        });
        return;
      }
      const data = (await res.json()) as { transmission: string };
      setPanel({
        kind: "transmitting",
        channel: panel.channel,
        text: data.transmission,
      });
    } catch (e) {
      setPanel({
        kind: "error",
        channel: panel.channel,
        message: e instanceof Error ? e.message.toUpperCase() : "CARRIER LOST",
      });
    }
  }, [birth, computed, panel]);

  // If birth is missing once load completes, push to calibrate.
  // (Calibrate exists in Phase D; until then, the legacy /onboarding
  // page is the fallback for unconfigured users.)
  if (birth === null && typeof window !== "undefined") {
    // Use a one-shot redirect from inside an effect to avoid SSR mismatch.
    return <ConsoleBoot onRouteToOnboarding={() => router.replace("/calibrate")} />;
  }

  if (!birth || !computed) {
    return <ConsoleBoot />;
  }

  return (
    <div className="min-h-screen fs-housing">
      {/* Top brass rail with engraved label */}
      <header className="border-b border-[var(--fs-rule-strong)] px-5 py-2 text-center">
        <h1 className="fs-stencil-strong">
          STATION 28 · REMOTE RECEIVING OUTPOST
        </h1>
      </header>

      <AtmosphericStrip
        sky={computed.sky}
        callsign={operator.callsign ?? null}
        channelNumber={currentChannel.number}
        channelName={currentChannel.name}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[1fr_18rem] md:gap-8 md:px-8 md:py-8">
        {/* CRT — universal output */}
        <section className="relative">
          {computed.alerts.length > 0 && panel.kind !== "anomaly" && (
            <AnomalyBadge
              alerts={computed.alerts}
              soundOn={!!operator.sound}
              onOpen={() =>
                setPanel({
                  kind: "anomaly",
                  channel,
                  alerts: computed.alerts,
                })
              }
            />
          )}
          <CRTScreen glitch={glitching}>
            <CRTContents
              panel={panel}
              channel={currentChannel}
              onOpenLog={() => setPanel({ kind: "log", channel })}
              onClose={() => setPanel({ kind: "channel", channel })}
              onFiled={(text) => setPanel({ kind: "filed", channel, text })}
              onTransmissionTypedOut={(text) => {
                // After the type-out finishes we transition the panel to
                // `received` so the operator gets the LOG / ACK affordance.
                if (
                  panel.kind === "transmitting" &&
                  panel.text === text &&
                  panel.channel === channel
                ) {
                  setPanel({ kind: "received", channel, text });
                }
              }}
              soundOn={!!operator.sound}
            />
          </CRTScreen>

          {/* Control row below the CRT */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ConsoleSwitch
              label="◯ DIAL"
              aria-pressed={panel.kind === "channel" || panel.kind === "transmitting"}
              onClick={() => setPanel({ kind: "channel", channel })}
              title="Tune a channel"
            >
              tuned
            </ConsoleSwitch>
            <ConsoleSwitch
              label="▭ TAPE"
              aria-pressed={panel.kind === "tape"}
              onClick={() => setPanel({ kind: "tape", channel })}
              title="Open the archive"
            >
              archive
            </ConsoleSwitch>
            <ConsoleSwitch
              label="▢ LOG"
              aria-pressed={panel.kind === "log"}
              onClick={() => setPanel({ kind: "log", channel })}
              title="File a capture"
            >
              capture
            </ConsoleSwitch>
            <ConsoleSwitch label="⌧ FILE" disabled title="Available Phase G">
              dossier
            </ConsoleSwitch>
          </div>
        </section>

        {/* Right column: the dial + TRANSMIT button */}
        <aside className="flex flex-col items-center gap-6 border border-[var(--fs-rule)] bg-[var(--fs-housing-2)] px-5 py-7">
          <Dial
            value={channel}
            onChange={onTune}
            onSettle={onSettle}
            labelFor={(n) => channelAt(n).name}
          />

          <button
            type="button"
            onClick={onTransmit}
            disabled={
              panel.kind === "transmitting" ||
              !computed ||
              !birth
            }
            className="fs-switch w-full disabled:opacity-50"
            aria-pressed={panel.kind === "transmitting"}
          >
            {panel.kind === "transmitting" ? "RECEIVING…" : "▷ TRANSMIT"}
          </button>

          <ul className="w-full space-y-1 fs-engraved">
            <li className="flex justify-between">
              <span>VOICE</span>
              <span className="text-[var(--fs-ivory)]">
                {birth.voice === "root"
                  ? "FIELD"
                  : birth.voice === "blade"
                    ? "CIPHER"
                    : "LONG-WAVE"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>PHOSPHOR</span>
              <span className="text-[var(--fs-ivory)] uppercase">
                {operator.phosphor ?? DEFAULT_PHOSPHOR}
              </span>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => void setSound(!operator.sound)}
            aria-pressed={!!operator.sound}
            className="fs-switch w-full"
          >
            ⏼ AUDIO · {operator.sound ? "ON" : "OFF"}
          </button>
        </aside>
      </main>

      <footer className="border-t border-[var(--fs-rule-strong)] px-5 py-2 text-center">
        <p className="fs-engraved">
          A station for receiving signals from a place that may or may not be there.
        </p>
      </footer>
    </div>
  );
}

/* ─── CRT contents — dispatch on panel state ──────────────────────── */

function CRTContents({
  panel,
  channel,
  onOpenLog,
  onClose,
  onFiled,
  onTransmissionTypedOut,
  soundOn,
}: {
  panel: PanelState;
  channel: ReturnType<typeof channelAt>;
  onOpenLog: () => void;
  onClose: () => void;
  onFiled: (text: string) => void;
  onTransmissionTypedOut: (text: string) => void;
  soundOn: boolean;
}) {
  if (panel.kind === "standby") {
    return (
      <div className="space-y-6">
        <p className="fs-stencil">STANDBY · PRIMARY CARRIER NOMINAL</p>
        <p className="text-sm leading-relaxed text-[var(--fs-phosphor-dim)] max-w-2xl fs-phosphor">
          <TypeOn
            text="ATMOSPHERICS HOLDING. NO INCOMING. TURN THE DIAL TO PRIME A CHANNEL, THEN PRESS TRANSMIT."
            speedMs={28}
            keepCursor
          />
        </p>
        <div className="pt-10">
          <p className="fs-stencil text-[var(--fs-ivory-dim)]">
            CH 00 · {CHANNELS[0].name}
          </p>
          <p className="mt-2 fs-mono text-[var(--fs-phosphor)] fs-phosphor">
            — IDLE —
          </p>
        </div>
      </div>
    );
  }

  if (panel.kind === "channel") {
    return (
      <div className="space-y-6">
        <p className="fs-stencil">
          CH {String(channel.number).padStart(2, "0")} · CHANNEL PRIMED
        </p>
        <div className="space-y-2">
          <h2 className="fs-mono text-3xl text-[var(--fs-phosphor)] fs-phosphor tracking-[0.12em]">
            {channel.name}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--fs-phosphor-dim)] max-w-2xl fs-phosphor">
            <TypeOn
              text={`FREQUENCY PROFILE — ${channel.card.description.toUpperCase()}`}
              speedMs={26}
              keepCursor={false}
            />
          </p>
        </div>
        <p className="fs-stencil pt-6 text-[var(--fs-ivory-dim)]">
          PRESS ▷ TRANSMIT TO REQUEST A SIGNAL ON THIS CHANNEL.
        </p>
      </div>
    );
  }

  if (panel.kind === "transmitting") {
    return (
      <div className="space-y-6">
        <p className="fs-stencil">
          SIGNAL ACQUIRED · CH {String(channel.number).padStart(2, "0")}
        </p>
        {panel.text ? (
          <p className="fs-mono text-xl leading-[1.6] text-[var(--fs-phosphor)] fs-phosphor max-w-2xl">
            <TypeOn
              text={panel.text}
              speedMs={36}
              keepCursor
              tick={soundOn ? click : undefined}
              onDone={() => onTransmissionTypedOut(panel.text)}
            />
          </p>
        ) : (
          <p className="fs-mono text-sm text-[var(--fs-phosphor-dim)] fs-phosphor">
            <TypeOn text="TUNING···" speedMs={120} keepCursor />
          </p>
        )}
      </div>
    );
  }

  if (panel.kind === "received") {
    return (
      <div className="space-y-6">
        <p className="fs-stencil">END OF TRANSMISSION</p>
        <p className="fs-mono text-xl leading-[1.6] text-[var(--fs-phosphor)] fs-phosphor max-w-2xl">
          {panel.text}
        </p>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onOpenLog} className="fs-switch">
            LOG THIS
          </button>
          <button type="button" onClick={onClose} className="fs-switch">
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    );
  }

  if (panel.kind === "log") {
    return (
      <LogInput
        onClose={onClose}
        onFiled={({ text }) => onFiled(text)}
        channelHint={`CH ${String(channel.number).padStart(2, "0")} · ${channel.name}`}
      />
    );
  }

  if (panel.kind === "tape") {
    return <TapeView onClose={onClose} />;
  }

  if (panel.kind === "anomaly") {
    return <AnomalyPanel alerts={panel.alerts} onClose={onClose} />;
  }

  if (panel.kind === "filed") {
    return (
      <div className="space-y-5">
        <p className="fs-stencil">CAPTURE FILED · TAPE ADVANCED</p>
        <p className="fs-mono text-base leading-[1.6] text-[var(--fs-phosphor)] fs-phosphor max-w-2xl">
          “{panel.text}”
        </p>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onOpenLog} className="fs-switch">
            FILE ANOTHER
          </button>
          <button type="button" onClick={onClose} className="fs-switch">
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="space-y-4">
      <p className="fs-stencil text-[var(--fs-alarm)]">
        SIGNAL FAULT · CH {String(channel.number).padStart(2, "0")}
      </p>
      <p className="fs-mono text-base text-[var(--fs-alarm)] max-w-2xl">
        {panel.message}
      </p>
      <button type="button" onClick={onClose} className="fs-switch">
        ACKNOWLEDGE
      </button>
    </div>
  );
}

/* ─── Small console switch ────────────────────────────────────────── */

function ConsoleSwitch({
  label,
  children,
  ...props
}: { label: string; children?: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="fs-switch flex flex-col items-start gap-1 py-3 disabled:opacity-50"
      {...props}
    >
      <span>{label}</span>
      {children && (
        <span className="fs-engraved text-[0.5rem] tracking-[0.32em]">
          {children}
        </span>
      )}
    </button>
  );
}

/* ─── Boot state ──────────────────────────────────────────────────── */

function ConsoleBoot({
  onRouteToOnboarding,
}: {
  onRouteToOnboarding?: () => void;
}) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-foreshore", "");
      document.documentElement.setAttribute("data-crt", DEFAULT_PHOSPHOR);
    }
    if (onRouteToOnboarding) {
      const t = window.setTimeout(onRouteToOnboarding, 1400);
      return () => window.clearTimeout(t);
    }
  }, [onRouteToOnboarding]);

  return (
    <main className="grid min-h-screen place-items-center fs-housing">
      <div className="w-full max-w-2xl p-10">
        <CRTScreen waveform={false}>
          <p className="fs-stencil mb-6">SYSTEM POWER</p>
          <p className="fs-mono text-xl text-[var(--fs-phosphor)] fs-phosphor leading-relaxed">
            <TypeOn
              text="STATION 28 BOOTING···"
              speedMs={80}
              keepCursor
            />
          </p>
          <p className="fs-stencil mt-10 text-[var(--fs-ivory-dim)]">
            CARRIER WARMING · PHOSPHOR ALIGNING · WAITING ON OPERATOR FIX
          </p>
        </CRTScreen>
      </div>
    </main>
  );
}
