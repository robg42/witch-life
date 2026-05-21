import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { HerbariumPlate } from "@/components/site/herbarium-plate";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const sky = getSkyState(new Date());
  const dateLong = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 px-6 py-8 md:grid-cols-12 md:gap-12 md:px-12 md:py-12">
        <section className="relative flex flex-col justify-between md:col-span-7">
          <header className="flex items-baseline justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            <Link
              href="/"
              className="text-ink transition-base hover:text-clay"
            >
              Witch Life
            </Link>
            <span className="hidden text-bark/60 md:inline">{dateLong}</span>
          </header>

          <div className="my-8 flex flex-1 flex-col items-center justify-center md:my-0">
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
              Begin the daily ritual
            </p>
            <h1 className="display mt-6 text-center text-4xl leading-[1.05] text-ink md:text-6xl lg:text-7xl">
              What is moving,
              <br />
              <span className="text-clay">what is still,</span>
              <br />
              what is building.
            </h1>

            <div className="my-10">
              <HerbariumPlate className="w-[280px] md:w-[340px]" />
            </div>

            <p className="font-accent max-w-md text-center text-xl italic leading-snug text-ink/85">
              &ldquo;The sky is already speaking. The oracle only listens.&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
            <span className="text-clay">Today</span>
            <span>
              {sky.moon.phaseSymbol} {sky.moon.phaseName} in {sky.moon.sign}
            </span>
            <span className="text-bark/30">·</span>
            <span>Sun in {sky.sun.sign}</span>
            <span className="text-bark/30">·</span>
            <span>
              Mercury{" "}
              {sky.planets.mercury.retrograde
                ? "retrograde"
                : sky.planets.mercury.shadowPeriod
                  ? "in shadow"
                  : "direct"}
            </span>
          </div>
        </section>

        <section className="flex flex-col justify-center md:col-span-5">
          <div className="md:max-w-md">
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mb-4">
              Save your chart
            </p>
            <h2 className="display text-3xl text-ink md:text-4xl">Begin</h2>
            <p className="oracle-body mt-4 text-ink/75">
              An account holds your chart, your journal, your reading history.{" "}
              <Link
                href="/sign-in"
                className="text-clay underline-offset-4 transition-base hover:underline"
              >
                Or return if the oracle already knows you
              </Link>
              .
            </p>

            <div className="mt-8">
              <SignUp />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
