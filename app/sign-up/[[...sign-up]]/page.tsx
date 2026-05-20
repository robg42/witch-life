import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { BotanicalBackdrop } from "@/components/site/botanical-backdrop";

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-moss opacity-[0.06]"
        aria-hidden
      >
        <BotanicalBackdrop variant="center" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <Link
          href="/"
          className="font-sans text-[10px] uppercase tracking-[0.3em] text-ash transition-base hover:text-parchment"
        >
          ← The Verdant Oracle
        </Link>
        <p className="accent mt-10 text-ochre text-lg">
          Save your chart. Begin the daily ritual.
        </p>
        <div className="mt-8 glow-warm">
          <SignUp />
        </div>
      </div>
    </main>
  );
}
