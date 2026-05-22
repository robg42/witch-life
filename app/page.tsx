import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSkyState } from "@/lib/astro";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import { TodayPanel } from "@/components/site/today-panel";
import { HerbariumStrip } from "@/components/site/herbarium-strip";
import {
  SeedlingGlyph,
  PressedLeafGlyph,
  FeatherGlyph,
  MyceliumGlyph,
} from "@/components/site/door-glyphs";

export const dynamic = "force-dynamic";

/*
  Hub. Almanac-style not astrology-style: lead with the date and what's
  happening on the land, not zodiac placements. Four doors as the hero,
  each illustrated with a botanical specimen. A vertical herbarium
  strip alongside on wider viewports gives the page depth.
*/
export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }

  const now = new Date();
  const sky = getSkyState(now);

  return (
    <main className="relative min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Masthead */}
        <header className="flex items-baseline justify-between gap-6 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
          <span className="text-ink font-medium">Witch Life</span>
          <LandingAuthActions />
        </header>

        {/* Today panel — almanac, not horoscope */}
        <div className="fade-up mt-6">
          <TodayPanel sky={sky} />
        </div>

        {/* Hub body — herbarium strip + doors side by side on desktop */}
        <div
          className="fade-up mt-8 flex flex-1 gap-6 md:mt-10 md:gap-10"
          style={{ animationDelay: "200ms", minHeight: "55vh" }}
        >
          {/* Herbarium strip — decorative botanical column, desktop only */}
          <aside
            aria-hidden
            className="hidden shrink-0 md:block"
            style={{ width: 80 }}
          >
            <HerbariumStrip className="h-full w-full" />
          </aside>

          {/* Four doors */}
          <nav
            aria-label="The chapters of Witch Life"
            className="grid flex-1 grid-cols-1 gap-px overflow-hidden rounded-sm bg-bark/30 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
          >
            <Door
              n="01"
              label="The reading"
              sub="Today's growing edge"
              preview="What the day is loosening, what it is building. Read against your chart, in your voice."
              href="/reading"
              glyph={<SeedlingGlyph />}
            />
            <Door
              n="02"
              label="The card"
              sub="A single specimen"
              preview="Twenty-eight botanical cards. Pull one. The oracle reads it through your chart."
              href="/draw"
              glyph={<PressedLeafGlyph />}
            />
            <Door
              n="03"
              label="The journal"
              sub="What's moving through you"
              preview="Set down what landed. The oracle reads your entries before it speaks again."
              href="/journal"
              glyph={<FeatherGlyph />}
            />
            <Door
              n="04"
              label="Your roots"
              sub="The system that holds you"
              preview="Birth details, voice preference, the network the readings grow from."
              href="/onboarding"
              glyph={<MyceliumGlyph />}
            />
          </nav>
        </div>

        {/* Editorial colophon — small, italic, the brand line */}
        <footer className="mt-8 flex flex-wrap items-baseline justify-between gap-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
          <span>Witch Life · MMXXVI</span>
          <span className="accent normal-case tracking-normal italic text-xs text-bark/80">
            What is moving, what is still, what is building.
          </span>
          <span className="hidden sm:inline">No prediction · only attention</span>
        </footer>
      </div>
    </main>
  );
}

interface DoorProps {
  n: string;
  label: string;
  sub: string;
  preview: string;
  href: string;
  glyph: React.ReactNode;
}

function Door({ n, label, sub, preview, href, glyph }: DoorProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between gap-6 bg-bone/95 px-6 py-8 transition-base hover:bg-parchment focus-visible:bg-parchment focus-visible:outline-none md:px-7 md:py-9"
    >
      {/* Top: number + arrow */}
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-clay">
          {n}
        </span>
        <span
          aria-hidden
          className="font-sans text-xl text-bark/40 transition-all duration-500 group-hover:translate-x-1 group-hover:text-clay"
        >
          →
        </span>
      </div>

      {/* Middle: botanical glyph. Tones to clay on hover. */}
      <div
        aria-hidden
        className="flex flex-1 items-center justify-center text-moss transition-all duration-700 group-hover:scale-[1.06] group-hover:text-clay"
      >
        {glyph}
      </div>

      {/* Bottom: label, sub, hover-revealed preview */}
      <div>
        <h3 className="accent text-2xl text-ink md:text-3xl">{label}</h3>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
          {sub}
        </p>
        <p className="mt-3 max-h-0 overflow-hidden font-serif text-sm italic text-bark/85 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
          {preview}
        </p>
      </div>
    </Link>
  );
}
