import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSkyState } from "@/lib/astro";
import { upcomingSabbat } from "@/lib/sabbats";
import { almanacFor } from "@/lib/almanac";
import { dailyCard } from "@/lib/deck";
import { LandingAuthActions } from "@/components/site/landing-auth-actions";
import {
  Fleuron,
  EditionInfo,
  Marginalia,
  Stamp,
} from "@/components/broadsheet";

export const dynamic = "force-dynamic";

/*
  Hub. The front page of an almanac for the current date. The page is
  a broadsheet: masthead, the date as an enormous numeral, the day's
  sky as a ruled table-strip, four lettered doors as marginalia, the
  next sabbat called out as printer's red.
*/
export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }

  const now = new Date();
  const sky = getSkyState(now);
  const almanac = almanacFor(now);
  const sabbat = upcomingSabbat(now, "N");
  const card = dailyCard(now);

  const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
  const day = now.getUTCDate();
  const month = now.toLocaleDateString("en-GB", { month: "long" });
  const yearRoman = toRoman(now.getUTCFullYear());

  const mercury = sky.planets.mercury;
  const mercuryNote = mercury.retrograde
    ? "Retrograde"
    : mercury.shadowPeriod
      ? "Shadow"
      : "Direct";

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-[1400px] px-5 py-6 md:px-12 md:py-10">
        {/* ─── Masthead ─────────────────────────────────────────────── */}
        <header className="rule-b pb-4">
          <div className="almanac flex items-end justify-between gap-3">
            <span>
              No. {numberOfDay(now)} · A.D. {yearRoman}
            </span>
            <span>Pressed by hand, daily</span>
            <LandingAuthActions />
          </div>
          <div className="mt-3 grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr_auto] md:gap-8">
            <h1 className="broadsheet text-[clamp(3rem,11vw,8rem)] leading-[0.85] fade-up">
              Witch&nbsp;Life
            </h1>
            <p
              className="display-italic text-[clamp(1.1rem,2vw,1.6rem)] text-ink/85 md:text-right fade-up"
              style={{ animationDelay: "120ms" }}
            >
              An almanac of daily practice, drawn from the moon,
              <br className="hidden md:block" /> the season, the land, and your chart.
            </p>
          </div>
        </header>

        {/* ─── Date strip — enormous date number ──────────────────── */}
        <section
          className="rule-b grid grid-cols-1 items-center gap-6 py-6 md:grid-cols-[auto_1fr] md:gap-12 fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-baseline gap-4">
            <span className="display text-vermilion text-[clamp(5rem,18vw,11rem)] leading-none">
              {day}
            </span>
            <div className="flex flex-col gap-1">
              <span className="almanac">{weekday}</span>
              <span className="display text-2xl md:text-3xl">{month}</span>
              <span className="almanac mt-1">
                MMXXVI · DAY {dayOfYear(now)} OF CCCLXV
              </span>
            </div>
          </div>
          <div>
            <p className="display-italic text-xl text-ink/90 md:text-2xl">
              {capitalise(almanac.season)} — {almanac.marker.toLowerCase()}.
            </p>
            <p className="oracle-body mt-3 max-w-2xl text-ink/85">
              {almanac.land}
            </p>
          </div>
        </section>

        {/* ─── Ruled sky table ──────────────────────────────────────── */}
        <section className="mt-8 fade-up" style={{ animationDelay: "260ms" }}>
          <EditionInfo
            parts={[
              {
                label: "Moon",
                value: (
                  <span>
                    <span className="text-vermilion mr-2 text-lg leading-none">
                      {sky.moon.phaseSymbol}
                    </span>
                    {sky.moon.phaseName} · day {sky.moon.cycleDay}/29
                  </span>
                ),
              },
              {
                label: "Sun",
                value: `${sky.sun.sign}, ${Math.round(sky.sun.degree)}°`,
              },
              {
                label: "Mercury",
                value: (
                  <span
                    className={
                      mercury.retrograde
                        ? "text-vermilion"
                        : mercury.shadowPeriod
                          ? "text-sage"
                          : "text-ink"
                    }
                  >
                    {mercuryNote}
                  </span>
                ),
              },
              {
                label: "Next dark moon",
                value: `${Math.round(sky.moon.daysToNewMoon)} days`,
              },
              {
                label: "Today&rsquo;s card",
                value: card.name,
              },
            ]}
          />
        </section>

        <Fleuron className="!my-10" />

        {/* ─── The doors, as marginalia entries ────────────────────── */}
        <section className="grid grid-cols-1 gap-px bg-rule md:grid-cols-2 lg:grid-cols-4">
          <Door
            num="I"
            href="/reading"
            title="Today&rsquo;s practice"
            kicker="A ritual for the hour you have"
            description="Gather these things. Do these steps. Reflect on this question. Five to fifteen minutes."
            tag="Daily"
          />
          <Door
            num="II"
            href="/library"
            title="The Library"
            kicker={`Next sabbat: ${sabbat.sabbat.name} in ${sabbat.daysUntil} days`}
            description="Forty-seven correspondences. Eight sabbats. Search by intention, by phase, by what you have at hand."
            tag={sabbat.sabbat.tagline}
          />
          <Door
            num="III"
            href="/journal"
            title="The journal"
            kicker="What you did. What's moving."
            description="The practice you completed. What's underneath the visible. Read by the oracle before it speaks again."
            tag="Private"
          />
          <Door
            num="IV"
            href="/practice"
            title="Your practice"
            kicker="The log, your chart, your intentions"
            description="What you've done, who you cast yourself as, what you're trying to grow this season."
            tag="Yours"
          />
        </section>

        <Fleuron className="!my-10" />

        {/* ─── Today&rsquo;s card, given a hero block ────────────────────── */}
        <section
          className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:gap-16 fade-up"
          style={{ animationDelay: "340ms" }}
        >
          <div className="rule-t pt-5">
            <div className="almanac">Today&rsquo;s card · pulled for everyone</div>
            <h3 className="display mt-3 text-5xl md:text-6xl">{card.name}</h3>
            <p className="italic-accent mt-3 text-xl text-ink/85">
              &ldquo;{card.description}&rdquo;
            </p>
            <p className="oracle-body mt-5 max-w-xl text-ink/85 drop-cap">
              The oracle will read this card against your chart and today&rsquo;s
              sky on the practice page. The card is shared; what it asks of you
              is yours alone.
            </p>
            <Link
              href="/reading"
              className="btn-vermilion mt-7 no-underline"
            >
              Open today&rsquo;s practice <Arrow />
            </Link>
          </div>
          <aside className="flex items-start justify-center md:justify-end">
            <BroadsheetCard suit={card.suit} name={card.name} />
          </aside>
        </section>

        {/* ─── Foot ────────────────────────────────────────────────── */}
        <footer className="rule-t mt-16 pt-4 almanac">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span>Witch Life · {yearRoman}</span>
            <span className="italic-accent normal-case tracking-normal text-base text-ink/70">
              Gather. Do. Reflect.
            </span>
            <span>No prediction · only attention</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function Door({
  num,
  href,
  title,
  kicker,
  description,
  tag,
}: {
  num: string;
  href: string;
  title: string;
  kicker: string;
  description: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block bg-paper px-6 py-7 transition-base hover:bg-paper-3 md:px-7 md:py-8"
    >
      <Marginalia number={num}>
        <div className="flex flex-col gap-3">
          <span className="almanac">{kicker}</span>
          <h3 className="display text-3xl text-ink leading-none md:text-4xl">
            {title}
          </h3>
          <p className="font-serif text-[15px] italic leading-snug text-ink/80">
            {description}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <Stamp tone="vermilion">{tag}</Stamp>
            <span
              aria-hidden
              className="font-mono text-base text-ink/60 transition-base group-hover:translate-x-1 group-hover:text-vermilion"
            >
              →
            </span>
          </div>
        </div>
      </Marginalia>
    </Link>
  );
}

function BroadsheetCard({ suit, name }: { suit: string; name: string }) {
  return (
    <div className="relative w-full max-w-[280px]">
      <div className="border-[2px] border-ink bg-paper-3 ink-shadow">
        <div className="rule-b px-5 pb-2 pt-3">
          <div className="almanac text-vermilion">{suit}</div>
        </div>
        <div className="px-5 py-10 text-center">
          <h4 className="display-italic text-[clamp(2.5rem,6vw,3.5rem)] text-ink leading-[0.9]">
            {name}
          </h4>
        </div>
        <div className="rule-t px-5 py-2">
          <div className="flex items-baseline justify-between almanac">
            <span>Suit of {suit}</span>
            <span>I / XXVIII</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="font-mono leading-none">
      →
    </span>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  return Math.floor(diff / 86_400_000);
}

function numberOfDay(d: Date): string {
  return String(dayOfYear(d)).padStart(3, "0");
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let rem = n;
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
