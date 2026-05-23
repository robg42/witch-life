import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { isSubscribed as isSubscribedFn } from "@/lib/subscription";
import { upcomingSabbat } from "@/lib/sabbats";
import { LibraryBrowser } from "@/components/library/library-browser";
import { Fleuron, Stamp } from "@/components/broadsheet";

export const dynamic = "force-dynamic";

/*
  The Library — laid out as a printed catalogue and index. Top of the
  page: an upcoming-sabbat notice rendered as a printed announcement.
  Below: the LibraryBrowser, which is itself a ruled index card.
*/
export default async function LibraryPage() {
  const { userId } = await auth();
  const subscribed = userId ? await isSubscribedFn() : false;
  const next = upcomingSabbat();
  const now = new Date();

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-10 md:py-10">
        {/* Masthead */}
        <header className="rule-b pb-3">
          <div className="almanac flex flex-wrap items-end justify-between gap-3">
            <Link href="/" className="wl-link no-underline">
              ← Witch Life
            </Link>
            <span>
              {now.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).toUpperCase()}
            </span>
            {!subscribed && (
              <Link
                href="/account"
                className="wl-link no-underline text-vermilion"
              >
                Subscribe →
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto] md:gap-8">
            <h1 className="broadsheet text-[clamp(2.6rem,9vw,7rem)] leading-[0.85]">
              The Library
            </h1>
            <p className="display-italic text-lg text-ink/85 md:text-right md:text-2xl">
              Forty-seven correspondences,
              <br className="hidden md:block" /> eight sabbats,
              <br className="hidden md:block" /> one searchable index.
            </p>
          </div>
        </header>

        {/* Sabbat notice — printed broadside */}
        <section className="mt-8">
          <div className="border-[2px] border-rule bg-paper-3 ink-shadow">
            <div className="rule-b px-6 py-3 almanac flex flex-wrap items-baseline justify-between gap-3">
              <span>Next sabbat</span>
              <span>
                {next.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                · in {next.daysUntil} days
              </span>
            </div>
            <div className="grid grid-cols-1 items-center gap-6 px-6 py-7 md:grid-cols-[auto_1fr_auto] md:gap-10">
              <div>
                <h2 className="display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9]">
                  {next.sabbat.name}
                </h2>
              </div>
              <p className="display-italic text-xl text-ink/85 md:text-2xl">
                {next.sabbat.tagline}
              </p>
              <Link
                href={`/library/sabbats/${next.sabbat.key}`}
                className="btn-vermilion no-underline justify-self-start md:justify-self-end"
              >
                Open the companion <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <Fleuron mark="✻" className="!my-12" />

        {/* Index intro */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr] md:gap-12">
          <div>
            <p className="almanac">An index of practice</p>
            <p className="oracle-body mt-2 drop-cap text-ink/95 max-w-2xl">
              Each correspondence — a plant, a stone, a day, an object — is
              tagged by the intentions it serves and the traditional uses it
              has held. Search by what you have at hand, by what you need,
              or by the day of the week. Subscribers can turn any entry
              into a tailored five-to-ten minute ritual.
            </p>
          </div>
          {!subscribed && (
            <aside className="rule-t pt-4">
              <Stamp tone="vermilion">For subscribers</Stamp>
              <p className="italic-accent mt-3 text-base text-ink/85">
                The full forty-seven entries plus the &ldquo;Practice with
                this&rdquo; generator. £9 / month.
              </p>
              <Link
                href="/account"
                className="btn-ink mt-4 no-underline"
              >
                Subscribe
              </Link>
            </aside>
          )}
        </section>

        <Fleuron mark="✻" className="!my-12" />

        {/* The actual library browser */}
        <section>
          <LibraryBrowser isSubscribed={subscribed} />
        </section>

        <footer className="rule-t mt-16 pt-4 almanac">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span>The Library · Witch Life</span>
            <span className="italic-accent normal-case tracking-normal text-base text-ink/70">
              Search · Open · Practice
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
