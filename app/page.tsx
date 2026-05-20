import Link from "next/link";
import { BotanicalDivider } from "@/components/site/botanical-divider";

export default function Home() {
  return (
    <main className="min-h-screen bg-earth text-parchment">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 py-16 md:px-12 md:py-24">
        {/* Mast */}
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ash">
          <span className="font-sans">The Verdant Oracle</span>
          <span className="font-sans">Est. MMXXVI</span>
        </header>

        {/* Body */}
        <section className="flex flex-col items-center text-center">
          <p className="accent text-lg text-ochre">A reading of the sky</p>

          <h1 className="display mt-6 text-4xl leading-tight text-parchment md:text-5xl">
            What is moving,
            <br />
            what is still,
            <br />
            what is building.
          </h1>

          <BotanicalDivider className="my-12" />

          <p className="oracle-body max-w-xl text-parchment/90">
            Not a horoscope. Not a prediction. A daily reading of the live sky —
            sun, moon, planets — translated into where to pour your energy and
            where to consciously withdraw it. Written in a voice you choose:
            <span className="accent text-ochre"> the Root</span>, the{" "}
            <span className="accent text-ochre">Blade</span>, or the{" "}
            <span className="accent text-ochre">Tide</span>.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="font-sans text-sm uppercase tracking-[0.2em] border border-moss bg-moss/20 px-8 py-3 text-parchment transition-base hover:bg-moss/40"
            >
              Begin the reading
            </Link>
            <Link
              href="/sign-in"
              className="font-sans text-sm uppercase tracking-[0.2em] text-sage transition-base hover:text-parchment"
            >
              Return to your chart
            </Link>
          </div>
        </section>

        {/* Foot */}
        <footer className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ash">
          <span className="font-sans">Phase i — foundation</span>
          <span className="font-sans">Built by hand</span>
        </footer>
      </div>
    </main>
  );
}
