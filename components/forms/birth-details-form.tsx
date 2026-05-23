"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBirth, type BirthDetails } from "@/lib/birth-details";
import { VOICE_LABEL, VOICE_TAGLINE, type VoiceKey } from "@/lib/voices";
import {
  INTENTIONS,
  type IntentionKey,
  isIntentionKey,
} from "@/lib/intentions";

const VOICE_KEYS: VoiceKey[] = ["root", "blade", "tide"];

type Step = 1 | 2 | 3;

interface Props {
  initial?: BirthDetails;
  redirectTo?: string;
}

/*
  Onboarding as ritual: a three-step paced form, not a single dense
  field set. Each step fade-ups in, the user commits, and the next
  panel appears. Submit after step 3.

    Step 1 — Your day in the year (birth date + optional time + hemisphere)
    Step 2 — Your intentions (1-3 from a menu of 10)
    Step 3 — Your voice (Root / Blade / Tide)
*/
export function BirthDetailsForm({ initial, redirectTo = "/reading" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [hemisphere, setHemisphere] = useState<"N" | "S">(
    initial?.hemisphere ?? guessHemisphere(),
  );

  // Step 2
  const [intentions, setIntentions] = useState<IntentionKey[]>(
    (initial?.intentions ?? []).filter(isIntentionKey),
  );

  // Step 3
  const [voice, setVoice] = useState<VoiceKey>(initial?.voice ?? "root");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const advance = () => {
    setError(null);
    if (step === 1) {
      if (!date) {
        setError("A birth date is needed before the chart can be cast.");
        return;
      }
      const numLat = lat ? Number(lat) : undefined;
      const numLng = lng ? Number(lng) : undefined;
      if (lat && (Number.isNaN(numLat!) || numLat! < -90 || numLat! > 90)) {
        setError("Latitude must be a number between -90 and 90.");
        return;
      }
      if (lng && (Number.isNaN(numLng!) || numLng! < -180 || numLng! > 180)) {
        setError("Longitude must be a number between -180 and 180.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (intentions.length === 0) {
        setError("Pick at least one intention.");
        return;
      }
      if (intentions.length > 3) {
        setError("Pick at most three intentions.");
        return;
      }
      setStep(3);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    saveBirth({
      date,
      time: time || undefined,
      city: city || undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      voice,
      hemisphere,
      intentions: intentions.slice(),
    });
    router.push(redirectTo);
  };

  const toggleIntention = (key: IntentionKey) => {
    setIntentions((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length >= 3
          ? prev
          : [...prev, key],
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <StepIndicator step={step} />

      {step === 1 && (
        <div key="step-1" className="flex flex-col gap-8 fade-up">
          <header>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
              One of three
            </p>
            <h2 className="display mt-2 text-2xl text-ink md:text-3xl">
              Your day in the year
            </h2>
            <p className="oracle-body mt-3 text-ink/80 max-w-prose">
              The moment you arrived on the land. Date is enough to start.
              Time and place unlock more — but only if you have them.
            </p>
          </header>

          <Field label="Birth date" htmlFor="birth-date">
            <input
              id="birth-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none focus:border-clay"
            />
          </Field>

          <Field
            label="Birth time"
            hint="Optional. Required for rising sign."
            htmlFor="birth-time"
          >
            <input
              id="birth-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none focus:border-clay"
            />
          </Field>

          <Field
            label="Birth city"
            hint="Optional. Free text — for context."
            htmlFor="birth-city"
          >
            <input
              id="birth-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Glasgow"
              className="border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/40 focus:border-clay"
            />
          </Field>

          <Field
            label="Coordinates"
            hint="Optional. Required for rising sign."
            htmlFor="birth-lat"
          >
            <div className="flex gap-4">
              <input
                id="birth-lat"
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="latitude"
                className="w-32 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/40 focus:border-clay"
              />
              <input
                id="birth-lng"
                type="text"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="longitude"
                className="w-32 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/40 focus:border-clay"
              />
            </div>
          </Field>

          <Field
            label="Where you live now"
            hint="Sets your almanac to the right half of the year."
            htmlFor="hemisphere"
          >
            <div className="flex gap-3" id="hemisphere">
              {(["N", "S"] as const).map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHemisphere(h)}
                  className={`font-sans text-xs uppercase tracking-[0.25em] border px-5 py-3 transition-base ${
                    hemisphere === h
                      ? "border-clay bg-clay/10 text-ink"
                      : "border-bark/30 text-bark/70 hover:border-clay hover:text-clay"
                  }`}
                >
                  {h === "N" ? "Northern" : "Southern"} hemisphere
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div key="step-2" className="flex flex-col gap-6 fade-up">
          <header>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
              Two of three
            </p>
            <h2 className="display mt-2 text-2xl text-ink md:text-3xl">
              Your intentions
            </h2>
            <p className="oracle-body mt-3 text-ink/80 max-w-prose">
              Pick one to three. The daily practice will be shaped to serve
              them. You can change these any time.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INTENTIONS.map((intent) => {
              const selected = intentions.includes(intent.key);
              return (
                <button
                  key={intent.key}
                  type="button"
                  onClick={() => toggleIntention(intent.key)}
                  className={`text-left rounded-sm border px-5 py-4 transition-base ${
                    selected
                      ? "border-clay bg-clay/10"
                      : "border-bark/25 bg-bone/40 hover:border-clay/60 hover:bg-bone/60"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="accent text-xl text-ink">
                      {intent.label}
                    </span>
                    <span
                      aria-hidden
                      className={`font-sans text-[10px] uppercase tracking-[0.2em] ${
                        selected ? "text-clay" : "text-bark/40"
                      }`}
                    >
                      {selected ? "chosen" : ""}
                    </span>
                  </div>
                  <p className="mt-2 font-serif text-sm italic text-ink/80">
                    {intent.description}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
            {intentions.length} of 3 selected
          </p>
        </div>
      )}

      {step === 3 && (
        <div key="step-3" className="flex flex-col gap-6 fade-up">
          <header>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
              Three of three
            </p>
            <h2 className="display mt-2 text-2xl text-ink md:text-3xl">
              Your voice
            </h2>
            <p className="oracle-body mt-3 text-ink/80 max-w-prose">
              The voice the oracle will speak in. Choose by ear.
            </p>
          </header>

          <div className="flex flex-col gap-3">
            {VOICE_KEYS.map((key) => (
              <label
                key={key}
                className={`flex cursor-pointer items-baseline gap-4 border-l-2 px-4 py-3 transition-base ${
                  voice === key
                    ? "border-clay bg-clay/10"
                    : "border-bark/25 hover:bg-clay/5"
                }`}
              >
                <input
                  type="radio"
                  name="voice"
                  value={key}
                  checked={voice === key}
                  onChange={() => setVoice(key)}
                  className="sr-only"
                />
                <span className="accent text-lg text-clay">
                  {VOICE_LABEL[key]}
                </span>
                <span className="font-serif text-base text-ink/85">
                  {VOICE_TAGLINE[key]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="font-sans text-sm text-clay">{error}</p>}

      <div className="flex items-baseline gap-5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(((step - 1) as Step) || 1)}
            className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
          >
            ← Back
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            onClick={advance}
            className="font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-8 py-3 text-parchment transition-base hover:bg-clay/85"
          >
            Continue →
          </button>
        )}
        {step === 3 && (
          <button
            type="submit"
            disabled={submitting}
            className="font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-8 py-3 text-parchment transition-base hover:bg-clay/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Casting…" : "Begin"}
          </button>
        )}
      </div>
    </form>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-baseline gap-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={
            s === step
              ? "text-clay font-medium"
              : s < step
                ? "text-bark/70 line-through decoration-bark/30"
                : "text-bark/40"
          }
        >
          {String(s).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={htmlFor}
        className="mb-1 font-sans text-xs uppercase tracking-[0.25em] text-bark/70"
      >
        {label}
      </label>
      {hint && (
        <p className="mb-2 font-serif text-sm italic text-bark/70">{hint}</p>
      )}
      {children}
    </div>
  );
}

function guessHemisphere(): "N" | "S" {
  if (typeof window === "undefined") return "N";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Crude heuristic: timezones containing these zones live in the
    // southern hemisphere by latitude majority.
    const south = [
      "Argentina",
      "Brazil",
      "Sao_Paulo",
      "Chile",
      "Lima",
      "Bogota",
      "Sydney",
      "Melbourne",
      "Auckland",
      "Wellington",
      "Pacific/Auckland",
      "Johannesburg",
      "Africa/Johannesburg",
      "Pacific/Fiji",
      "Pacific/Tahiti",
    ];
    return south.some((s) => tz?.includes(s)) ? "S" : "N";
  } catch {
    return "N";
  }
}
