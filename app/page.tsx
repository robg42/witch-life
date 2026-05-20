import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import { SkyWheel } from "@/components/site/sky-wheel";
import { VoiceSampler } from "@/components/site/voice-sampler";
import { DeckRibbon } from "@/components/site/deck-ribbon";
import { InstantNatalPreview } from "@/components/site/instant-natal-preview";

export const dynamic = "force-dynamic";

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
      {/* Masthead */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 font-sans text-[10px] uppercase tracking-[0.3em] text-ash md:px-12">
        <span className="text-parchment/80">The Verdant Oracle</span>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline">MMXXVI</span>
          <LandingAuthActions />
        </div>
      </header>

      {/* Cosmic readout strip */}
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

      {/* Hero: sky wheel + tagline */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-12 md:px-12 md:pb-32 md:pt-24">
        <div className="md:col-span-5 md:order-2">
          <SkyWheel sky={sky} />
        </div>
        <div className="md:col-span-7 md:order-1">
          <p
            className="accent fade-up text-lg text-ochre"
            style={{ animationDelay: "120ms" }}
          >
            A reading of the sky as it is, daily.
          </p>
          <h1
            className="display fade-up mt-8 text-[2.5rem] leading-[1.05] tracking-[0.04em] md:text-6xl lg:text-7xl"
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
            Not a horoscope. Not a prediction. The Verdant Oracle reads the
            live state of the sky — sun, moon, planets — against the chart
            you arrived in, and tells you where to pour your energy, and
            where to consciously release it.
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
      </section>

      {/* Section: voice sampler */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-28">
        <header className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-sm tracking-[0.35em] text-parchment">
            Hear the oracle
          </h2>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Three voices · choose by ear
          </p>
        </header>
        <VoiceSampler />
      </section>

      {/* Section: deck ribbon */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-28">
        <header className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-sm tracking-[0.35em] text-parchment">
            The deck
          </h2>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            Twenty-eight cards · tap to read
          </p>
        </header>
        <DeckRibbon />
      </section>

      {/* Section: instant chart caster */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-28">
        <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="display text-sm tracking-[0.35em] text-parchment">
            See your sky
          </h2>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash">
            A preview · no sign-up
          </p>
        </header>
        <p className="oracle-body mb-10 max-w-2xl text-parchment/85">
          Put in the day you arrived. The oracle will show you where the
          visible planets sat that day. The full chart — rising sign,
          houses, the conversation between placements — waits behind the
          door.
        </p>
        <InstantNatalPreview />
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl border-t border-moss/40 px-6 py-20 md:px-12 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl leading-tight text-parchment md:text-5xl">
              Today is waiting<br />
              to be read.
            </h2>
          </div>
          <div>
            <p className="oracle-body text-parchment/90">
              The free reading begins the moment you save your birth details.
              No card needed. No conditions. Just the sky and your chart and
              the oracle&rsquo;s voice, every morning.
            </p>
            <Link
              href="/onboarding"
              className="mt-8 inline-flex items-baseline gap-3 border border-moss bg-moss/30 px-10 py-4 font-sans text-sm uppercase tracking-[0.25em] text-parchment transition-base hover:bg-moss/50"
            >
              Begin the reading <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
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
