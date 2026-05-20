import Link from "next/link";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { BirthDetailsForm } from "@/components/forms/birth-details-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-earth text-parchment">
      <div className="mx-auto max-w-2xl px-6 py-16 md:px-12 md:py-24">
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-[0.25em] text-ash transition-base hover:text-parchment"
        >
          ← The Verdant Oracle
        </Link>

        <h1 className="display mt-12 text-3xl text-parchment md:text-4xl">
          Cast your chart
        </h1>
        <p className="oracle-body mt-4 text-parchment/85">
          The oracle reads the sky against the moment you arrived in it.
          Nothing here leaves your device until you sign in.
        </p>

        <BotanicalDivider className="my-10" />

        <BirthDetailsForm />
      </div>
    </main>
  );
}
