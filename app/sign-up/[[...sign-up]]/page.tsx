import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";

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
    <main className="min-h-screen text-wax">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-between px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-baseline justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-ash">
          <Link
            href="/"
            className="text-wax transition-base hover:text-gold"
          >
            Witch Life
          </Link>
          <span className="hidden text-ash/80 md:inline">{dateLong}</span>
        </header>

        <section className="my-12 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold">
            Save your chart
          </p>
          <h1 className="display mt-6 text-4xl leading-[1.05] text-wax md:text-5xl">
            Begin
          </h1>
          <p className="oracle-body mt-5 text-wax/75">
            An account holds your chart, your journal, your reading history.{" "}
            <Link
              href="/sign-in"
              className="text-gold underline-offset-4 transition-base hover:underline"
            >
              Or return if the oracle already knows you
            </Link>
            .
          </p>

          <div className="mt-10">
            <SignUp />
          </div>
        </section>

        <footer className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-sans text-[10px] uppercase tracking-[0.25em] text-ash/80">
          <span className="text-gold">Today</span>
          <span>
            {sky.moon.phaseSymbol} {sky.moon.phaseName} in {sky.moon.sign}
          </span>
          <span className="text-ash/40">·</span>
          <span>Sun in {sky.sun.sign}</span>
          <span className="text-ash/40">·</span>
          <span>
            Mercury{" "}
            {sky.planets.mercury.retrograde
              ? "retrograde"
              : sky.planets.mercury.shadowPeriod
                ? "in shadow"
                : "direct"}
          </span>
        </footer>
      </div>
    </main>
  );
}
