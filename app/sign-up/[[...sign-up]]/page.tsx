import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { almanacFor } from "@/lib/almanac";
import { EditionInfo, Fleuron } from "@/components/broadsheet";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
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
        <header className="rule-b pb-4">
          <div className="almanac flex flex-wrap items-end justify-between gap-3">
            <span>Volume I · For the practitioner</span>
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

        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
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
              The almanac is opening a new leaf for you. We&rsquo;ll cast your
              chart against the moment you arrived, ask you to choose one to
              three intentions for the season, and pick one of three voices
              the oracle will speak to you in. Then every day you return, the
              practice that lands here will be shaped by who you are and what
              the sky is doing.
            </p>

            <Fleuron mark="❋" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Column
                num="I"
                title="Your day in the year"
                body="The date you arrived, plus optional time and place. Enough to know what was overhead when you began."
              />
              <Column
                num="II"
                title="Your intentions"
                body="One to three from a menu of ten — clarity, courage, rest, grief, fertility — to shape the practice."
              />
              <Column
                num="III"
                title="Your voice"
                body="The Root, the Blade, or the Tide. The oracle will speak in your chosen register."
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

          <aside className="md:pl-10 md:border-l md:border-rule">
            <div
              className="sticky top-10 fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <p className="almanac">A notice</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">Begin</h2>
              <p className="italic-accent mt-3 text-lg text-ink/80">
                Save your chart. Begin the daily ritual.
              </p>
              <p className="oracle-body mt-3 text-ink/80">
                An account holds your chart, your journal, your practice log.
                <br />
                <Link href="/sign-in" className="wl-link">
                  Or return if the oracle already knows you
                </Link>
                .
              </p>

              <div className="mt-8">
                <SignUp />
              </div>
            </div>
          </aside>
        </div>

        <footer className="rule-t mt-16 pt-4 almanac">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span>Witch Life</span>
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

function Column({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rule-t pt-3">
      <div className="flex items-baseline gap-2">
        <span className="marginalia text-base">{num}</span>
        <h3 className="display text-lg text-ink">{title}</h3>
      </div>
      <p className="italic-accent mt-2 text-base text-ink/80 leading-snug">
        {body}
      </p>
    </div>
  );
}
