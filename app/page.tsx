import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import { SkyWheel } from "@/components/site/sky-wheel";

export const dynamic = "force-dynamic";

/*
  The landing is the foyer — a single visible screen with the sky
  wheel at its centre and four doors below. No marketing scroll, no
  feature list. Everything else lives behind a door.
*/
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Masthead */}
        <header className="flex items-baseline justify-between gap-6 font-sans text-[10px] uppercase tracking-[0.3em] text-ash">
          <span className="text-parchment/80">The Verdant Oracle</span>
          <span className="hidden md:inline">{dateLong}</span>
          <LandingAuthActions />
        </header>

        {/* One-line cosmic readout */}
        <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 font-sans text-[11px] uppercase tracking-[0.25em] text-ash">
          <span className="flex items-baseline gap-2">
            <span className="text-lg text-parchment leading-none">
              {sky.moon.phaseSymbol}
            </span>
            <span className="text-parchment/90">
              {sky.moon.phaseName} in {sky.moon.sign}
            </span>
          </span>
          <span className="text-ash/60">·</span>
          <span className="text-parchment/90">
            Sun in {sky.sun.sign}{" "}
            <span className="text-ash">{SIGN_GLYPH[sky.sun.sign]}</span>
          </span>
          <span className="text-ash/60">·</span>
          <span
            className={
              sky.planets.mercury.retrograde
                ? "text-ochre"
                : sky.planets.mercury.shadowPeriod
                  ? "text-sage"
                  : "text-parchment/90"
            }
          >
            Mercury {mercuryStatus}
          </span>
          <span className="text-ash/60">·</span>
          <span>New moon in {Math.round(sky.moon.daysToNewMoon)} days</span>
        </div>

        {/* Centerpiece */}
        <section className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="glow-warm w-full max-w-[460px]">
            <SkyWheel sky={sky} />
          </div>

          <p
            className="fade-up mt-12 max-w-2xl text-center font-accent text-2xl italic leading-snug text-parchment/90 md:text-3xl"
            style={{ animationDelay: "300ms" }}
          >
            What is moving,{" "}
            <span className="text-ochre">what is still,</span> what is building.
          </p>
        </section>

        {/* Four doors */}
        <nav
          aria-label="The chapters of the oracle"
          className="fade-up grid grid-cols-2 gap-px bg-moss/40 md:grid-cols-4"
          style={{ animationDelay: "600ms" }}
        >
          <Door
            n="01"
            glyph="☉"
            label="The reading"
            sub="Today, in your voice"
            href="/reading"
          />
          <Door
            n="02"
            glyph="✦"
            label="The card"
            sub="A single pull"
            href="/draw"
          />
          <Door
            n="03"
            glyph="✎"
            label="The journal"
            sub="Set down what's moving"
            href="/journal"
          />
          <Door
            n="04"
            glyph="⊕"
            label="Your chart"
            sub="The sky you arrived in"
            href="/onboarding"
          />
        </nav>

        {/* Quiet footer */}
        <footer className="mt-6 flex flex-wrap items-baseline justify-between gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-ash/80">
          <span>MMXXVI</span>
          <span className="hidden sm:inline">No prediction · only attention</span>
          <span>Built by hand</span>
        </footer>
      </div>
    </main>
  );
}

function Door({
  n,
  glyph,
  label,
  sub,
  href,
}: {
  n: string;
  glyph: string;
  label: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 bg-earth/95 px-6 py-7 transition-base hover:bg-bark/60"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-ochre">
          {n}
        </span>
        <span
          aria-hidden
          className="font-sans text-base text-ash transition-base group-hover:translate-x-1 group-hover:text-ochre"
        >
          →
        </span>
      </div>
      <span
        aria-hidden
        className="font-serif text-3xl leading-none text-sage transition-base group-hover:text-ochre"
      >
        {glyph}
      </span>
      <h3 className="accent text-2xl text-parchment">{label}</h3>
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-ash">
        {sub}
      </p>
    </Link>
  );
}
