import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";
import { VOICE_LABEL, VOICE_TAGLINE, type VoiceKey } from "@/lib/voices";
import { Moonflower } from "@/components/site/moonflower";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";

export const dynamic = "force-dynamic";

/*
  Sample lines for each oracle voice. These are not AI-generated — they
  are the brand's canonical demonstration of how each voice sounds, so
  the user can choose by ear before signing up. Updated by hand when
  the voices shift.
*/
const VOICE_SAMPLE: Record<VoiceKey, string> = {
  root:
    "Mycelium does not hurry. What is loosening underneath you was loosened by something patient, and it has been loosening for longer than you knew.",
  blade:
    "Stop pretending you do not already know the answer. You do. The hesitation is the question, not the situation. Say it.",
  tide:
    "The grief moves the way warm water moves — slowly, then all at once, and not where you expected. Let it find its level. Do not name it yet.",
};

export default function Home() {
  const now = new Date();
  const sky = getSkyState(now);
  const dateLong = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "in shadow"
      : "direct";

  return (
    <main className="min-h-screen bg-earth text-parchment overflow-hidden">
      {/* Tiny masthead */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 font-sans text-[10px] uppercase tracking-[0.3em] text-ash md:px-12">
        <span className="text-parchment/80">The Verdant Oracle</span>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline">MMXXVI</span>
          <LandingAuthActions />
        </div>
      </header>

      {/* Live cosmic readout strip */}
      <section className="mx-auto mt-4 max-w-6xl border-t border-b border-moss/40 px-6 py-5 md:px-12">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2 font-sans text-sm">
          <span className="text-xs uppercase tracking-[0.25em] text-ash">
            {dateLong}
          </span>
          <span className="flex items-baseline gap-2 text-parchment">
            <span className="text-2xl leading-none">{sky.moon.phaseSymbol}</span>
            <span>
              {sky.moon.phaseName} in {sky.moon.sign}
            </span>
          </span>
          <span className="text-parchment">
            Sun in {sky.sun.sign}{" "}
            <span className="text-ash">{SIGN_GLYPH[sky.sun.sign]}</span>
          </span>
          <span
            className={
              sky.planets.mercury.retrograde
                ? "text-ochre"
                : sky.planets.mercury.shadowPeriod
                  ? "text-sage"
                  : "text-parchment"
            }
          >
            Mercury {mercuryStatus}
          </span>
          <span className="ml-auto text-xs uppercase tracking-[0.25em] text-ash">
            New moon in {Math.round(sky.moon.daysToNewMoon)} days
          </span>
        </div>
      </section>

      {/* Hero — asymmetric: text left, moonflower right */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-24 pt-16 md:grid-cols-12 md:gap-16 md:px-12 md:pb-32 md:pt-24">
        <div className="md:col-span-7 lg:col-span-8">
          <p
            className="accent fade-up text-lg text-ochre"
            style={{ animationDelay: "120ms" }}
          >
            A reading of the sky as it is, daily.
          </p>

          <h1
            className="display fade-up mt-8 text-[2.75rem] leading-[1.05] tracking-[0.04em] md:text-6xl lg:text-7xl"
            style={{ animationDelay: "320ms" }}
          >
            What is moving,
            <br />
            <span className="text-ochre">what is still,</span>
            <br />
            what is building.
          </h1>

          <p
            className="oracle-body fade-up mt-10 max-w-xl text-parchment/90"
            style={{ animationDelay: "600ms" }}
          >
            The Verdant Oracle is not a horoscope. It is not a prediction. It
            reads the live state of the sky — sun, moon, planets — against the
            chart you arrived in, and tells you where to pour your energy, and
            where to consciously withdraw it.
          </p>

          <div
            className="fade-up mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-baseline"
            style={{ animationDelay: "820ms" }}
          >
            <Link
              href="/onboarding"
              className="group inline-flex items-baseline gap-3 border border-moss bg-moss/30 px-10 py-4 font-sans text-sm uppercase tracking-[0.25em] text-parchment transition-base hover:bg-moss/50"
            >
              <span>Begin the reading</span>
              <span aria-hidden className="transition-base group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/sign-in"
              className="font-sans text-xs uppercase tracking-[0.25em] text-sage transition-base hover:text-parchment"
            >
              Return to your chart
            </Link>
          </div>
        </div>

        {/* Botanical centerpiece */}
        <div
          className="hidden text-sage md:col-span-5 md:flex md:justify-center lg:col-span-4"
          style={{ animation: "vo-fade-up 1.6s 200ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <Moonflower />
        </div>
      </section>

      {/* Three voices */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-28">
        <header className="mb-14 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-sm tracking-[0.35em] text-parchment">
            Three voices
          </h2>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Choose how the oracle speaks to you
          </p>
        </header>

        <div className="grid gap-x-10 gap-y-14 md:grid-cols-3">
          {(["root", "blade", "tide"] as const).map((key, i) => (
            <article key={key} className="flex flex-col">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash">
                {String(i + 1).padStart(2, "0")} / 03
              </p>
              <h3 className="accent mt-2 text-3xl text-ochre">
                {VOICE_LABEL[key]}
              </h3>
              <p className="mt-3 font-sans text-xs uppercase tracking-[0.2em] text-ash">
                {VOICE_TAGLINE[key]}
              </p>
              <blockquote className="oracle-body mt-7 border-l border-moss/50 pl-5 text-parchment/90">
                &ldquo;{VOICE_SAMPLE[key]}&rdquo;
              </blockquote>
            </article>
          ))}
        </div>
      </section>

      {/* What you'll receive */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-24">
        <h2 className="display mb-10 text-sm tracking-[0.35em] text-parchment">
          Each day, you receive
        </h2>
        <ul className="grid gap-x-12 gap-y-8 font-serif text-lg leading-relaxed text-parchment/90 md:grid-cols-2">
          <li>
            <span className="accent block text-ochre text-2xl">
              The energetic weather
            </span>
            What is moving in the sky and how it meets your chart.
          </li>
          <li>
            <span className="accent block text-ochre text-2xl">
              Where to expand, where to withdraw
            </span>
            Direction, not advice. Where to pour energy, where to release.
          </li>
          <li>
            <span className="accent block text-ochre text-2xl">
              The day&rsquo;s symbol
            </span>
            A card from the deck, drawn collectively. Yours to read.
          </li>
          <li>
            <span className="accent block text-ochre text-2xl">
              The week, arcing
            </span>
            Seven days, named for their quality, not their content.
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-8 md:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4 font-sans text-[10px] uppercase tracking-[0.3em] text-ash">
          <span>The Verdant Oracle</span>
          <span>No prediction · only attention</span>
          <span>Built by hand · MMXXVI</span>
        </div>
      </footer>
    </main>
  );
}
