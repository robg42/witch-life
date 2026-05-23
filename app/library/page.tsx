import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { isSubscribed as isSubscribedFn } from "@/lib/subscription";
import { upcomingSabbat } from "@/lib/sabbats";
import { LibraryBrowser } from "@/components/library/library-browser";

export const dynamic = "force-dynamic";

/*
  The Library — searchable correspondences + sabbat companion. Free
  users see a preview (6 correspondences + the upcoming sabbat name +
  date). Subscribers see everything and can generate practices from a
  specific correspondence.
*/
export default async function LibraryPage() {
  const { userId } = await auth();
  const subscribed = userId ? await isSubscribedFn() : false;
  const next = upcomingSabbat();

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70 transition-base hover:text-clay"
          >
            ← Witch Life
          </Link>
          {!subscribed && (
            <Link
              href="/account"
              className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay transition-base hover:text-ink"
            >
              Subscribe →
            </Link>
          )}
        </header>

        {/* Title */}
        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
            The Library
          </p>
          <h1 className="display mt-2 text-3xl text-ink md:text-5xl">
            Correspondences &amp; sabbats
          </h1>
          <p className="oracle-body mt-4 max-w-2xl text-ink/85">
            Search by what you have at hand, by what you need, or by the day
            of the week. Each entry can be turned into a 5–10 minute
            practice that uses it specifically.
          </p>
        </section>

        {/* Upcoming sabbat strip */}
        <section className="mt-8 rounded-sm border border-bark/25 bg-parchment/50 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
                Next sabbat
              </span>
              <span className="accent text-2xl text-ink">
                {next.sabbat.name}
              </span>
              <span className="font-serif text-base italic text-ink/85">
                {next.sabbat.tagline}
              </span>
            </div>
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
              In {next.daysUntil} days ·{" "}
              {next.date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })}
            </span>
            <Link
              href={`/library/sabbats/${next.sabbat.key}`}
              className="font-sans text-[10px] uppercase tracking-[0.25em] text-clay transition-base hover:text-ink"
            >
              Open →
            </Link>
          </div>
        </section>

        {/* Browser */}
        <section className="mt-10">
          <LibraryBrowser isSubscribed={subscribed} />
        </section>
      </div>
    </main>
  );
}
