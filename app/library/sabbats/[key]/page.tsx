import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isSubscribed as isSubscribedFn } from "@/lib/subscription";
import { sabbatByKey, sabbatDate } from "@/lib/sabbats";
import { correspondenceById } from "@/lib/correspondences";

export const dynamic = "force-dynamic";

/*
  A single sabbat companion page. Free users see traditional meaning +
  one preview reflection prompt. Subscribers see the full home practice,
  all reflection prompts, and the matched correspondences.
*/
export default async function SabbatPage({
  params,
}: {
  params: { key: string };
}) {
  const sabbat = sabbatByKey(params.key);
  if (!sabbat) notFound();

  const { userId } = await auth();
  const subscribed = userId ? await isSubscribedFn() : false;

  const now = new Date();
  const yearNorth = sabbatDate(sabbat, now.getUTCFullYear(), "N");
  const yearSouth = sabbatDate(sabbat, now.getUTCFullYear(), "S");

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-baseline justify-between">
          <Link
            href="/library"
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70 transition-base hover:text-clay"
          >
            ← The Library
          </Link>
        </header>

        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
            Sabbat
          </p>
          <h1 className="display mt-2 text-3xl text-ink md:text-5xl">
            {sabbat.name}
          </h1>
          <p className="font-accent mt-3 text-xl italic text-ink/85">
            {sabbat.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
            <span>
              Northern ·{" "}
              {yearNorth.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })}
            </span>
            <span>
              Southern ·{" "}
              {yearSouth.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </section>

        {/* Traditional meaning — free for all */}
        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            What it is
          </p>
          <p className="oracle-body mt-3 text-ink/95">
            {sabbat.traditionalMeaning}
          </p>
        </section>

        {/* Home practice — subscriber only */}
        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
            How to celebrate at home
          </p>
          {subscribed ? (
            <div className="oracle-body mt-3 whitespace-pre-line text-ink/95">
              {sabbat.homePractice}
            </div>
          ) : (
            <LockedSection
              preview={sabbat.homePractice.split("\n\n")[0].slice(0, 220) + "…"}
              label="Subscribers get the full home practice — three concrete acts of devotion you can do this week at home."
            />
          )}
        </section>

        {/* Reflection prompts — subscriber only */}
        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
            Take to the journal
          </p>
          {subscribed ? (
            <ol className="mt-4 space-y-3">
              {sabbat.reflectionPrompts.map((p, i) => (
                <li
                  key={i}
                  className="border-l-2 border-clay/40 pl-4 font-serif text-base italic text-ink/90"
                >
                  {p}
                </li>
              ))}
            </ol>
          ) : (
            <ol className="mt-4 space-y-3">
              <li className="border-l-2 border-clay/40 pl-4 font-serif text-base italic text-ink/90">
                {sabbat.reflectionPrompts[0]}
              </li>
              <li className="border-l-2 border-bark/20 pl-4 font-serif text-base italic text-bark/60">
                + {sabbat.reflectionPrompts.length - 1} more for subscribers.
              </li>
            </ol>
          )}
        </section>

        {/* Matched correspondences */}
        {subscribed && sabbat.correspondenceIds.length > 0 && (
          <section className="mt-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
              Carry with you
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {sabbat.correspondenceIds
                .map((id) => correspondenceById(id))
                .filter((c): c is NonNullable<typeof c> => Boolean(c))
                .map((c) => (
                  <Link
                    key={c.id}
                    href="/library"
                    className="rounded-sm border border-bark/25 bg-bone/60 px-4 py-2 transition-base hover:border-clay hover:bg-parchment"
                  >
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70">
                      {c.type}
                    </span>
                    <br />
                    <span className="accent text-base text-ink">{c.name}</span>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {!subscribed && (
          <section className="mt-12 rounded-sm border border-clay/40 bg-clay/5 px-6 py-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
              Eight sabbats a year, the full companion content
            </p>
            <p className="oracle-body mt-2 text-ink/85">
              Subscribers get the home practice, the reflection set, and a
              tailored ritual using the sabbat&rsquo;s plant + element matches
              for every wheel-of-the-year event.
            </p>
            <Link
              href="/account"
              className="mt-4 inline-block font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-6 py-3 text-parchment transition-base hover:bg-clay/85"
            >
              Subscribe — £9 / month
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function LockedSection({
  preview,
  label,
}: {
  preview: string;
  label: string;
}) {
  return (
    <div className="mt-3">
      <p className="oracle-body text-ink/85">{preview}</p>
      <div className="mt-4 rounded-sm border border-clay/30 bg-clay/5 px-5 py-3">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-clay">
          {label}
        </p>
      </div>
    </div>
  );
}
