import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { almanacFor } from "@/lib/almanac";
import { EditionInfo, Fleuron } from "@/components/broadsheet";

export const dynamic = "force-dynamic";

/*
  Sign-in arrival — the front page of an almanac, with the sign-in
  form set into the right column like a notice in a newspaper.
*/
export default function SignInPage() {
  const now = new Date();
  const sky = getSkyState(now);
  const almanac = almanacFor(now);
  const day = now.getUTCDate();
  const dateLong = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "Retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "In shadow"
      : "Direct";

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-[1280px] px-5 py-6 md:px-12 md:py-10">
        {/* Masthead */}
        <header className="rule-b pb-4">
          <div className="almanac flex flex-wrap items-end justify-between gap-3">
            <span>
              Volume I · A.D. {toRoman(now.getUTCFullYear())}
            </span>
            <span>For the practitioner</span>
            <span>{dateLong.toUpperCase()}</span>
          </div>
          <div className="mt-2 grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr_auto] md:gap-8">
            <h1 className="broadsheet text-[clamp(3.2rem,12vw,9rem)] leading-[0.82] fade-up">
              Witch&nbsp;Life
            </h1>
            <p
              className="display-italic text-lg text-ink/85 md:text-right md:text-2xl fade-up"
              style={{ animationDelay: "120ms" }}
            >
              An almanac of daily practice,
              <br className="hidden md:block" /> drawn from the moon, the season,
              <br className="hidden md:block" /> the land, and your chart.
            </p>
          </div>
        </header>

        {/* Body — two columns */}
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          {/* Left: editorial */}
          <article className="fade-up" style={{ animationDelay: "180ms" }}>
            <div className="flex items-start gap-5">
              <span className="display text-vermilion text-[clamp(4rem,10vw,7rem)] leading-none">
                {day}
              </span>
              <div className="mt-3">
                <p className="almanac">For the day</p>
                <p className="display-italic mt-1 text-2xl text-ink">
                  {almanac.season} — {almanac.marker.toLowerCase()}.
                </p>
              </div>
            </div>

            <p className="oracle-body mt-8 drop-cap text-ink/95">
              {almanac.land} The almanac is open to today&rsquo;s leaf. Each
              morning it carries the moon&rsquo;s phase, the season&rsquo;s
              edge, and a single concrete practice — gather these things, do
              these steps, then write this in your journal. Five to fifteen
              minutes. The work is small. The body remembers.
            </p>

            <Fleuron mark="❋" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Column
                title="Today's practice"
                body="A scaffolded ritual built around what's moving in the sky and what's growing on the land."
              />
              <Column
                title="The Library"
                body="Forty-seven correspondences and eight sabbats. Search by intention; pull a tailored practice from any entry."
              />
              <Column
                title="The journal"
                body="What you did. What's moving. The oracle reads the themes before it speaks again."
              />
            </div>

            <div className="mt-10">
              <EditionInfo
                parts={[
                  {
                    label: "Moon",
                    value: (
                      <span>
                        <span className="text-vermilion mr-2 text-lg leading-none">
                          {sky.moon.phaseSymbol}
                        </span>
                        {sky.moon.phaseName}
                      </span>
                    ),
                  },
                  { label: "Sun", value: sky.sun.sign },
                  {
                    label: "Mercury",
                    value: (
                      <span
                        className={
                          sky.planets.mercury.retrograde
                            ? "text-vermilion"
                            : sky.planets.mercury.shadowPeriod
                              ? "text-sage"
                              : "text-ink"
                        }
                      >
                        {mercuryStatus}
                      </span>
                    ),
                  },
                  {
                    label: "Dark moon",
                    value: `${Math.round(sky.moon.daysToNewMoon)}d`,
                  },
                ]}
              />
            </div>
          </article>

          {/* Right: sign-in */}
          <aside className="md:pl-10 md:border-l md:border-rule">
            <div
              className="sticky top-10 fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <p className="almanac">A notice</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">
                Enter
              </h2>
              <p className="italic-accent mt-3 text-lg text-ink/80">
                The chart remembers you.
              </p>
              <p className="oracle-body mt-3 text-ink/80">
                Sign in to find the day&rsquo;s practice already waiting.
                <br />
                <Link href="/sign-up" className="wl-link">
                  Or set down your chart for the first time
                </Link>
                .
              </p>

              <div className="mt-8">
                <SignIn />
              </div>
            </div>
          </aside>
        </div>

        {/* Foot */}
        <footer className="rule-t mt-16 pt-4 almanac">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span>Witch Life · {toRoman(now.getUTCFullYear())}</span>
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

function Column({ title, body }: { title: string; body: string }) {
  return (
    <div className="rule-t pt-3">
      <h3 className="display text-lg text-ink">{title}</h3>
      <p className="italic-accent mt-2 text-base text-ink/80 leading-snug">
        {body}
      </p>
    </div>
  );
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
