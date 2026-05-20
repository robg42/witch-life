"use client";

import { useState } from "react";
import { VOICE_LABEL, VOICE_TAGLINE, type VoiceKey } from "@/lib/voices";

/*
  Interactive voice picker. Three tabs — Root / Blade / Tide — that swap
  a sample reading panel below them. Lets the visitor choose by ear
  before committing to a voice in onboarding.

  Samples are hand-written demonstrations, not AI-generated, so the
  showcase quality is consistent across visits.
*/

const SAMPLE: Record<VoiceKey, string> = {
  root:
    "Mycelium does not hurry. What is loosening underneath you was loosened by something patient, and it has been loosening for longer than you knew. The visible part — the green, the bloom, the face you take to work — is not where the year happens. The year happens lower down. Trust the soil. The soil is doing the slow accounting you keep trying to do with your mind.",
  blade:
    "Stop pretending you do not already know the answer. You do. The hesitation is the question, not the situation. Say it out loud. Write the email. Make the call. The body has been holding the sentence for three weeks and the body is tired. You will not feel ready. Being ready is not the bar. Being honest is the bar.",
  tide:
    "The current beneath you is heavier than you think. It has been pulling for weeks. You have been calling it tiredness; it is grief. Let the water in. Sit at the shore of it. Do not name what is happening yet — naming it will close it. Let it move. Where the heaviness pulls, the next thing lives. The water knows. The water has always known.",
};

export function VoiceSampler() {
  const [active, setActive] = useState<VoiceKey>("root");
  const voices: VoiceKey[] = ["root", "blade", "tide"];

  return (
    <div>
      {/* Tab strip */}
      <div role="tablist" className="flex flex-wrap items-baseline gap-2">
        {voices.map((key, i) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(key)}
              className={`group flex items-baseline gap-3 border px-5 py-3 transition-base ${
                isActive
                  ? "border-ochre bg-ochre/10 text-parchment"
                  : "border-moss/30 text-ash hover:border-moss hover:text-parchment"
              }`}
            >
              <span className="font-sans text-[10px] uppercase tracking-[0.25em]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`accent text-2xl transition-base ${
                  isActive ? "text-ochre" : "text-sage group-hover:text-parchment"
                }`}
              >
                {VOICE_LABEL[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sample panel */}
      <div
        role="tabpanel"
        key={active}
        className="fade-up mt-10 border-l border-ochre/60 pl-8"
      >
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
          {VOICE_TAGLINE[active]}
        </p>
        <p className="oracle-body mt-4 max-w-2xl text-parchment/95">
          &ldquo;{SAMPLE[active]}&rdquo;
        </p>
      </div>
    </div>
  );
}
