import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSkyState } from "@/lib/astro";
import { SIGN_GLYPH, PLANET_GLYPH } from "@/lib/zodiac";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import { SkyStrip } from "@/components/site/sky-strip";

export const dynamic = "force-dynamic";

/*
  Hub for signed-in visitors. Unauthenticated → /sign-in.

  Structure: this is a *tool* page, not a brochure. The four doors are
  the hero. Above them sits a single live sky strip — informational,
  glanceable, takes one line. The moon-illustration centrepiece that
  was dominating this page has been retired here in favour of the
  data being subordinate to the action.
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

  return (
    <main className="relative min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Masthead */}
        <header className="flex items-baseline justify-between gap-6 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
          <span className="text-ink font-medium">Witch Life</span>
          <span className="hidden md:inline">{dateLong}</span>
          <LandingAuthActions />
        </header>

        {/* Live sky strip — single horizontal line, all the day's data */}
        <div className="fade-up mt-6">
          <SkyStrip sky={sky} />
        </div>

        {/* HERO — the four doors. Above the fold on any normal viewport. */}
        <nav
          aria-label="The chapters of Witch Life"
          className="fade-up mt-8 grid flex-1 grid-cols-1 gap-px overflow-hidden rounded-sm bg-bark/30 sm:grid-cols-2 md:mt-12 md:grid-cols-4"
          style={{ animationDelay: "200ms", minHeight: "60vh" }}
        >
          <Door
            n="01"
            label="The reading"
            sub="Today, in your voice"
            preview="The energetic weather, where to expand, where to release."
            href="/reading"
            glyph={<SunGlyph />}
          />
          <Door
            n="02"
            label="The card"
            sub="A single pull"
            preview="Twenty-eight botanical cards. Drawn for your chart."
            href="/draw"
            glyph={<CardGlyph />}
          />
          <Door
            n="03"
            label="The journal"
            sub="Set down what's moving"
            preview="The oracle reads your entries before it speaks."
            href="/journal"
            glyph={<QuillGlyph />}
          />
          <Door
            n="04"
            label="Your chart"
            sub="The sky you arrived in"
            preview="Birth details. Voice preference. Edit any time."
            href="/onboarding"
            glyph={<WheelGlyph />}
          />
        </nav>

        {/* Editorial footer — quiet */}
        <footer className="mt-8 flex flex-wrap items-baseline justify-between gap-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
          <span>Witch Life · MMXXVI</span>
          <span className="accent text-bark/80 normal-case tracking-normal italic text-xs">
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

      {/* Middle: glyph (animated). Grows on hover. */}
      <div
        aria-hidden
        className="flex flex-1 items-center justify-center text-bark/70 transition-all duration-700 group-hover:scale-[1.08] group-hover:text-clay"
      >
        {glyph}
      </div>

      {/* Bottom: label + sub + preview */}
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

// ─── Hand-drawn glyphs for the four doors ─────────────────────────────────

function SunGlyph() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <circle cx="40" cy="40" r="14" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 40 + Math.cos(rad) * 22;
        const y1 = 40 + Math.sin(rad) * 22;
        const x2 = 40 + Math.cos(rad) * 32;
        const y2 = 40 + Math.sin(rad) * 32;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="22" y="14" width="36" height="52" rx="2" />
      <rect x="28" y="22" width="24" height="36" rx="1" strokeWidth="0.6" />
      <path d="M40 30 L 40 50" />
      <path d="M40 36 C 36 36, 34 34, 33 31" />
      <path d="M40 36 C 44 36, 46 34, 47 31" />
      <path d="M40 42 C 35 42, 33 40, 32 37" />
      <path d="M40 42 C 45 42, 47 40, 48 37" />
      <circle cx="40" cy="50" r="1.5" fill="currentColor" />
    </svg>
  );
}

function QuillGlyph() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M58 14 C 52 22, 44 32, 36 44 L 26 58 L 38 56 C 50 50, 60 38, 64 24 Z" />
      <path d="M36 44 L 22 66" />
      <path d="M44 28 C 42 32, 40 36, 38 40" strokeWidth="0.7" />
      <path d="M50 22 C 48 26, 46 30, 44 34" strokeWidth="0.7" />
      <path d="M16 70 L 28 70" />
    </svg>
  );
}

function WheelGlyph() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <circle cx="40" cy="40" r="24" />
      <circle cx="40" cy="40" r="14" strokeDasharray="2 3" opacity="0.6" />
      <circle cx="40" cy="40" r="2" fill="currentColor" />
      <line x1="40" y1="16" x2="40" y2="64" strokeWidth="0.6" />
      <line x1="16" y1="40" x2="64" y2="40" strokeWidth="0.6" />
      <line x1="23" y1="23" x2="57" y2="57" strokeWidth="0.5" opacity="0.7" />
      <line x1="57" y1="23" x2="23" y2="57" strokeWidth="0.5" opacity="0.7" />
    </svg>
  );
}

// Keep imports of types we use indirectly so tree-shaking is happy.
void SIGN_GLYPH;
void PLANET_GLYPH;
