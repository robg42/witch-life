import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import { TodaysSky } from "@/components/site/todays-sky";

export const dynamic = "force-dynamic";

/*
  Hub for signed-in visitors. Unauthenticated → /sign-in. The hub uses
  the cream herbarium surface — same as the entry portal — with four
  numbered doors and the live sky wheel at centre.
*/
export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }

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
    <main className="relative min-h-screen overflow-hidden text-ink">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Masthead */}
        <header className="flex items-baseline justify-between gap-6 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
          <span className="text-ink">The Verdant Oracle</span>
          <span className="hidden md:inline">{dateLong}</span>
          <LandingAuthActions />
        </header>

        {/* One-line cosmic readout */}
        <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 font-sans text-[11px] uppercase tracking-[0.25em] text-bark/70">
          <span className="flex items-baseline gap-2">
            <span className="text-lg text-ink leading-none">
              {sky.moon.phaseSymbol}
            </span>
            <span className="text-ink/90">
              {sky.moon.phaseName} in {sky.moon.sign}
            </span>
          </span>
          <span className="text-bark/40">·</span>
          <span className="text-ink/90">
            Sun in {sky.sun.sign}{" "}
            <span className="text-bark/70">{SIGN_GLYPH[sky.sun.sign]}</span>
          </span>
          <span className="text-bark/40">·</span>
          <span
            className={
              sky.planets.mercury.retrograde
                ? "text-clay"
                : sky.planets.mercury.shadowPeriod
                  ? "text-moss"
                  : "text-ink/90"
            }
          >
            Mercury {mercuryStatus}
          </span>
          <span className="text-bark/40">·</span>
          <span>New moon in {Math.round(sky.moon.daysToNewMoon)} days</span>
        </div>

        {/* Centerpiece — almanac-style sky readout */}
        <section className="fade-up flex flex-1 flex-col items-center justify-center py-12" style={{ animationDelay: "150ms" }}>
          <TodaysSky sky={sky} />

          <p
            className="fade-up mt-14 max-w-2xl text-center font-accent text-2xl italic leading-snug text-ink/85 md:text-3xl"
            style={{ animationDelay: "500ms" }}
          >
            What is moving,{" "}
            <span className="text-clay">what is still,</span> what is building.
          </p>
        </section>

        {/* Four doors */}
        <nav
          aria-label="The chapters of the oracle"
          className="fade-up grid grid-cols-2 gap-px bg-bark/25 md:grid-cols-4"
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
        <footer className="mt-6 flex flex-wrap items-baseline justify-between gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
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
      className="group relative flex flex-col gap-3 bg-bone/95 px-6 py-7 transition-base hover:bg-linen/80"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
          {n}
        </span>
        <span
          aria-hidden
          className="font-sans text-base text-bark/60 transition-base group-hover:translate-x-1 group-hover:text-clay"
        >
          →
        </span>
      </div>
      <span
        aria-hidden
        className="font-serif text-3xl leading-none text-moss transition-base group-hover:text-clay"
      >
        {glyph}
      </span>
      <h3 className="accent text-2xl text-ink">{label}</h3>
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
        {sub}
      </p>
    </Link>
  );
}
