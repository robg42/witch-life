import Link from "next/link";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { BirthDetailsForm } from "@/components/forms/birth-details-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-2xl px-6 py-16 md:px-12 md:py-24">
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
        >
          ← The Verdant Oracle
        </Link>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mt-12">
          The chart
        </p>
        <h1 className="display mt-3 text-3xl text-ink md:text-5xl">
          Cast your chart
        </h1>
        <p className="oracle-body mt-4 text-ink/85">
          The oracle reads the sky against the moment you arrived in it.
          Nothing here leaves your device until you sign in.
        </p>

        <BotanicalDivider className="my-10" />

        <BirthDetailsForm />
      </div>
    </main>
  );
}
