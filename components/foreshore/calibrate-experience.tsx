"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBirth, type BirthDetails } from "@/lib/birth-details";
import {
  DEFAULT_PHOSPHOR,
  loadOperator,
  saveOperator,
  type Phosphor,
} from "@/lib/foreshore/operator";
import type { VoiceKey } from "@/lib/voices";
import { CHANNELS } from "@/lib/foreshore/channels";
import { CRTScreen } from "./crt-screen";
import { TypeOn } from "./type-on";

/*
  Calibration — operator enrolment. Six sequential prompts inside
  the CRT. Each prompt waits on the operator before advancing.
  Once complete, we persist:
    - BirthDetails (date, hemisphere, voice) into localStorage so the
      existing broadsheet code can still read it
    - OperatorPrefs (callsign, phosphor) into localStorage under
      its own key

  The visual structure is deliberately tighter than the broadsheet
  onboarding. One prompt at a time. No multi-field forms. No
  surrounding chrome.
*/

type Phase =
  | "intro"
  | "callsign"
  | "fix"
  | "hemisphere"
  | "frequencies"
  | "voice"
  | "phosphor"
  | "complete";

const VOICE_OPTIONS: Array<{
  voice: VoiceKey;
  label: string;
  blurb: string;
}> = [
  { voice: "root", label: "FIELD", blurb: "Instrumental. Plain. Noun-verb-object." },
  { voice: "blade", label: "CIPHER", blurb: "Precise. Counts. Time intervals." },
  { voice: "tide", label: "LONG-WAVE", blurb: "Slow. Distant. Sea-edged." },
];

export function CalibrateExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");

  // Bookkeeping for the operator's answers as they accumulate.
  const [callsign, setCallsign] = useState("");
  const [date, setDate] = useState("");
  const [hemisphere, setHemisphere] = useState<"N" | "S">("N");
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [voice, setVoice] = useState<VoiceKey>("root");
  const [phosphor, setPhosphor] = useState<Phosphor>(DEFAULT_PHOSPHOR);

  // Apply the Foreshore theme to <html> as soon as we mount, so the
  // bezel and background colour the calibration too.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-foreshore", "");
    root.setAttribute("data-crt", phosphor);
    return () => {
      // No cleanup — the next page (the console) wants the same attr.
    };
  }, [phosphor]);

  // Prefill from any previously-saved operator preferences. We want
  // a re-run of calibration to land back where the operator was.
  useEffect(() => {
    const ops = loadOperator();
    if (ops.callsign) setCallsign(ops.callsign);
    if (ops.phosphor) setPhosphor(ops.phosphor);
  }, []);

  const advance = (next: Phase) => setPhase(next);

  const persist = () => {
    const birth: BirthDetails = {
      date,
      voice,
      hemisphere,
      intentions: [], // legacy field, kept empty for the Foreshore — operator picks channels instead
    };
    saveBirth(birth);
    saveOperator({
      callsign: callsign || undefined,
      phosphor,
      sound: false,
      dialChannel: frequencies[0] ?? 0,
    });
  };

  const onComplete = () => {
    persist();
    advance("complete");
    // Delay the redirect just enough to let the final TypeOn finish
    // its acknowledgement line.
    window.setTimeout(() => router.replace("/"), 2400);
  };

  return (
    <main className="grid min-h-screen place-items-center fs-housing px-5 py-8">
      <div className="w-full max-w-3xl">
        <CRTScreen waveform>
          {phase === "intro" && (
            <IntroPhase onContinue={() => advance("callsign")} />
          )}
          {phase === "callsign" && (
            <CallsignPhase
              value={callsign}
              onChange={setCallsign}
              onContinue={() => advance("fix")}
            />
          )}
          {phase === "fix" && (
            <FixPhase
              value={date}
              onChange={setDate}
              onContinue={() => advance("hemisphere")}
            />
          )}
          {phase === "hemisphere" && (
            <HemispherePhase
              value={hemisphere}
              onChange={setHemisphere}
              onContinue={() => advance("frequencies")}
            />
          )}
          {phase === "frequencies" && (
            <FrequenciesPhase
              value={frequencies}
              onChange={setFrequencies}
              onContinue={() => advance("voice")}
            />
          )}
          {phase === "voice" && (
            <VoicePhase
              value={voice}
              onChange={setVoice}
              onContinue={() => advance("phosphor")}
            />
          )}
          {phase === "phosphor" && (
            <PhosphorPhase
              value={phosphor}
              onChange={setPhosphor}
              onContinue={onComplete}
            />
          )}
          {phase === "complete" && (
            <CompletePhase callsign={callsign || "OPERATOR"} />
          )}
        </CRTScreen>
        <p className="mt-4 fs-engraved text-center">
          STATION 28 · REMOTE OPERATOR INTAKE
        </p>
      </div>
    </main>
  );
}

/* ─── Phase components ─────────────────────────────────────────────── */

function PhaseHeading({ children }: { children: React.ReactNode }) {
  return <p className="fs-stencil mb-5">{children}</p>;
}

function PhosphorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="fs-mono text-lg leading-relaxed text-[var(--fs-phosphor)] fs-phosphor max-w-2xl">
      {children}
    </p>
  );
}

function IntroPhase({ onContinue }: { onContinue: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <PhaseHeading>SYSTEM POWER</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="STATION 28 ACKNOWLEDGES. CALIBRATION REQUIRED BEFORE A SIGNAL CAN BE ASSIGNED TO THIS TERMINAL."
          speedMs={28}
          onDone={() => setDone(true)}
        />
      </PhosphorText>
      <div className="pt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!done}
          className="fs-switch"
        >
          ▷ BEGIN INTAKE
        </button>
      </div>
    </div>
  );
}

function CallsignPhase({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (s: string) => void;
  onContinue: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const valid = value.trim().length >= 2 && value.trim().length <= 24;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <PhaseHeading>STEP 1 OF 6 · ENTER CALLSIGN</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="HOW SHALL THE STATION ADDRESS YOU? TWO TO TWENTY-FOUR CHARACTERS. NO LOGIN NAME, NO REAL NAME REQUIRED — A LABEL ONLY."
          speedMs={26}
        />
      </PhosphorText>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\s+/g, " "))}
        maxLength={24}
        className="mt-6 w-full border-x-0 border-y border-[var(--fs-rule-strong)] bg-transparent px-0 py-2 fs-mono text-2xl tracking-[0.2em] text-[var(--fs-phosphor)] fs-phosphor placeholder:text-[var(--fs-phosphor-dim)] focus:border-[var(--fs-brass-glint)] focus:outline-none"
        placeholder="_"
        aria-label="Callsign"
      />
      <div className="pt-8">
        <button
          type="submit"
          disabled={!valid}
          className="fs-switch"
        >
          ▷ ACKNOWLEDGED
        </button>
      </div>
    </form>
  );
}

function FixPhase({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (s: string) => void;
  onContinue: () => void;
}) {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <PhaseHeading>STEP 2 OF 6 · COORDINATE FIX</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="WHEN WERE YOU FIRST RECEIVED? THE STATION USES THIS AS YOUR LONG ANCHOR — TO CALIBRATE TRANSMISSIONS AGAINST THE SKY YOU WERE BORN UNDER."
          speedMs={26}
        />
      </PhosphorText>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        className="mt-6 w-full border border-[var(--fs-rule-strong)] bg-[var(--fs-housing-3)] px-3 py-2 fs-mono text-xl text-[var(--fs-phosphor)] fs-phosphor focus:border-[var(--fs-brass-glint)] focus:outline-none"
        aria-label="Date of birth"
      />
      <div className="pt-8 flex gap-2">
        <button type="submit" disabled={!valid} className="fs-switch">
          ▷ FIX RECORDED
        </button>
      </div>
    </form>
  );
}

function HemispherePhase({
  value,
  onChange,
  onContinue,
}: {
  value: "N" | "S";
  onChange: (v: "N" | "S") => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <PhaseHeading>STEP 3 OF 6 · HEMISPHERE</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="WHICH SIDE OF THE EQUATOR DO YOU OPERATE FROM? THIS BIASES THE SEASONAL READOUT — THE FORESHORE'S TIDE IS OFFSET FROM YOURS BY SIX MONTHS."
          speedMs={26}
        />
      </PhosphorText>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("N")}
          aria-pressed={value === "N"}
          className="fs-switch py-6"
        >
          <span className="block text-lg">N — NORTHERN</span>
          <span className="fs-engraved block mt-1">summer in june</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("S")}
          aria-pressed={value === "S"}
          className="fs-switch py-6"
        >
          <span className="block text-lg">S — SOUTHERN</span>
          <span className="fs-engraved block mt-1">summer in december</span>
        </button>
      </div>
      <div className="pt-8">
        <button type="button" onClick={onContinue} className="fs-switch">
          ▷ HEMISPHERE LOGGED
        </button>
      </div>
    </div>
  );
}

function FrequenciesPhase({
  value,
  onChange,
  onContinue,
}: {
  value: number[];
  onChange: (v: number[]) => void;
  onContinue: () => void;
}) {
  const toggle = (ch: number) => {
    if (value.includes(ch)) {
      onChange(value.filter((n) => n !== ch));
    } else if (value.length < 3) {
      onChange([...value, ch].sort((a, b) => a - b));
    }
  };
  const ok = value.length >= 1 && value.length <= 3;
  return (
    <div>
      <PhaseHeading>STEP 4 OF 6 · NATIVE FREQUENCIES</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="SELECT ONE TO THREE CHANNELS YOU FEEL NATIVE TO. THESE BIAS WHICH SIGNALS THE STATION ACQUIRES MOST READILY ON YOUR BEHALF."
          speedMs={26}
        />
      </PhosphorText>
      <div className="mt-5 grid max-h-[16rem] grid-cols-3 gap-1 overflow-y-auto border border-[var(--fs-rule)] bg-[var(--fs-housing-3)] p-2 sm:grid-cols-4">
        {CHANNELS.map((c) => {
          const active = value.includes(c.number);
          const exhausted = !active && value.length >= 3;
          return (
            <button
              type="button"
              key={c.number}
              onClick={() => toggle(c.number)}
              disabled={exhausted}
              aria-pressed={active}
              className={
                "border border-[var(--fs-rule)] px-2 py-2 text-left fs-mono text-[0.7rem] uppercase tracking-[0.16em] " +
                (active
                  ? "bg-[var(--fs-brass)] text-[var(--fs-housing)]"
                  : "bg-[var(--fs-housing-2)] text-[var(--fs-ivory-dim)] hover:bg-[var(--fs-housing)] hover:text-[var(--fs-ivory)] disabled:opacity-30")
              }
            >
              <span className="block text-[0.6rem]">CH {c.numberStr}</span>
              <span className="block">{c.name}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 fs-engraved">
        SELECTED · {value.map((n) => String(n).padStart(2, "0")).join(" / ") || "—"}
      </div>
      <div className="pt-6">
        <button
          type="button"
          onClick={onContinue}
          disabled={!ok}
          className="fs-switch"
        >
          ▷ PRESETS LOGGED
        </button>
      </div>
    </div>
  );
}

function VoicePhase({
  value,
  onChange,
  onContinue,
}: {
  value: VoiceKey;
  onChange: (v: VoiceKey) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <PhaseHeading>STEP 5 OF 6 · OPERATOR VOICE</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="WHICH REGISTER DO YOU PREFER THE STATION SPEAK IN WHEN A SIGNAL ARRIVES?"
          speedMs={26}
        />
      </PhosphorText>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {VOICE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.voice}
            onClick={() => onChange(opt.voice)}
            aria-pressed={value === opt.voice}
            className="fs-switch py-5 text-left"
          >
            <span className="block text-lg">{opt.label}</span>
            <span className="fs-engraved block mt-1">{opt.blurb}</span>
          </button>
        ))}
      </div>
      <div className="pt-8">
        <button type="button" onClick={onContinue} className="fs-switch">
          ▷ VOICE SET
        </button>
      </div>
    </div>
  );
}

function PhosphorPhase({
  value,
  onChange,
  onContinue,
}: {
  value: Phosphor;
  onChange: (v: Phosphor) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <PhaseHeading>STEP 6 OF 6 · CRT PHOSPHOR</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text="CHOOSE A CHANNEL COLOUR. AMBER IS THE STATION'S WARM DEFAULT. GREEN IS COLDER AND READS LIKE A LABORATORY MONITOR."
          speedMs={26}
        />
      </PhosphorText>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("amber")}
          aria-pressed={value === "amber"}
          className="fs-switch py-6"
        >
          <span className="block text-lg" style={{ color: "#ffc25f", textShadow: "0 0 6px rgba(255,194,95,0.55)" }}>
            AMBER
          </span>
          <span className="fs-engraved block mt-1">warm · default</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("green")}
          aria-pressed={value === "green"}
          className="fs-switch py-6"
        >
          <span className="block text-lg" style={{ color: "#3fff92", textShadow: "0 0 6px rgba(63,255,146,0.55)" }}>
            GREEN
          </span>
          <span className="fs-engraved block mt-1">cold · lab</span>
        </button>
      </div>
      <div className="pt-8">
        <button type="button" onClick={onContinue} className="fs-switch">
          ▷ COMMIT CALIBRATION
        </button>
      </div>
    </div>
  );
}

function CompletePhase({ callsign }: { callsign: string }) {
  const upper = callsign.toUpperCase();
  return (
    <div className="space-y-6">
      <PhaseHeading>CALIBRATION COMPLETE</PhaseHeading>
      <PhosphorText>
        <TypeOn
          text={`WELCOME, OPERATOR ${upper}. THE STATION ACKNOWLEDGES. OPENING CONSOLE···`}
          speedMs={38}
        />
      </PhosphorText>
    </div>
  );
}
