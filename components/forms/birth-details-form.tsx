"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBirth, type BirthDetails } from "@/lib/birth-details";
import { VOICE_LABEL, VOICE_TAGLINE, type VoiceKey } from "@/lib/voices";

const VOICE_KEYS: VoiceKey[] = ["root", "blade", "tide"];

export function BirthDetailsForm({
  initial,
  redirectTo = "/reading",
}: {
  initial?: BirthDetails;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [voice, setVoice] = useState<VoiceKey>(initial?.voice ?? "root");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setSubmitting(true);
    saveBirth({
      date,
      time: time || undefined,
      city: city || undefined,
      lat: numLat,
      lng: numLng,
      voice,
    });
    router.push(redirectTo);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <Field label="Birth date" htmlFor="birth-date">
        <input
          id="birth-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="border-b border-bark bg-transparent px-1 py-2 font-serif text-lg text-wax outline-none focus:border-clay"
        />
      </Field>

      <Field
        label="Birth time"
        hint="Optional. Without this, your rising sign cannot be cast."
        htmlFor="birth-time"
      >
        <input
          id="birth-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border-b border-bark bg-transparent px-1 py-2 font-serif text-lg text-wax outline-none focus:border-clay"
        />
      </Field>

      <Field
        label="Birth city"
        hint="Optional. Free text — we use it for context only."
        htmlFor="birth-city"
      >
        <input
          id="birth-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Glasgow"
          className="border-b border-bark bg-transparent px-1 py-2 font-serif text-lg text-wax outline-none placeholder:text-ash/60 focus:border-clay"
        />
      </Field>

      <Field
        label="Coordinates"
        hint="Optional. Required for rising sign. Look up your birth city on a map and type the decimal latitude and longitude."
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
            className="w-32 border-b border-bark bg-transparent px-1 py-2 font-serif text-lg text-wax outline-none placeholder:text-ash/60 focus:border-clay"
          />
          <input
            id="birth-lng"
            type="text"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="longitude"
            className="w-32 border-b border-bark bg-transparent px-1 py-2 font-serif text-lg text-wax outline-none placeholder:text-ash/60 focus:border-clay"
          />
        </div>
      </Field>

      <fieldset>
        <legend className="mb-3 font-sans text-xs uppercase tracking-[0.25em] text-ash">
          Choose your voice
        </legend>
        <div className="flex flex-col gap-2">
          {VOICE_KEYS.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-baseline gap-4 border-l-2 ${
                voice === key ? "border-clay bg-clay/5" : "border-bark/60"
              } px-4 py-3 transition-base hover:bg-clay/5`}
            >
              <input
                type="radio"
                name="voice"
                value={key}
                checked={voice === key}
                onChange={() => setVoice(key)}
                className="sr-only"
              />
              <span className="accent text-lg text-clay">{VOICE_LABEL[key]}</span>
              <span className="font-serif text-base text-wax/85">
                {VOICE_TAGLINE[key]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="font-sans text-sm text-clay">{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="font-sans text-sm uppercase tracking-[0.25em] border border-clay bg-clay px-8 py-3 text-parchment transition-base hover:bg-clay/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Casting…" : "Cast the chart"}
        </button>
      </div>
    </form>
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
        className="mb-1 font-sans text-xs uppercase tracking-[0.25em] text-ash"
      >
        {label}
      </label>
      {hint && (
        <p className="mb-2 font-serif text-sm italic text-ash">{hint}</p>
      )}
      {children}
    </div>
  );
}
