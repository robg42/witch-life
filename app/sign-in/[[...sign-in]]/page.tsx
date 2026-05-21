import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";

export const dynamic = "force-dynamic";

/*
  Sign-in arrival page. Aged-ink surface, lets the inherited layout
  ClerkProvider theme handle the form chrome — no per-page Clerk
  appearance overrides here. The page itself stays restrained:
  masthead, a single editorial line, the form, a quiet sky line at
  the foot.
*/
export default function SignInPage() {
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
            The chart remembers you
          </p>
          <h1 className="display mt-6 text-4xl leading-[1.05] text-wax md:text-5xl">
            Enter
          </h1>
          <p className="oracle-body mt-5 text-wax/75">
            Sign in to find your reading already waiting.{" "}
            <Link
              href="/sign-up"
              className="text-gold underline-offset-4 transition-base hover:underline"
            >
              Or set down your chart for the first time
            </Link>
            .
          </p>

          <div className="mt-10">
            <SignIn />
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
