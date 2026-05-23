import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { getAccount, isSubscribed } from "@/lib/subscription";
import { VOICE_LABEL } from "@/lib/voices";
import { intentionLabel } from "@/lib/intentions";

export const dynamic = "force-dynamic";

interface PracticeRow {
  id: string;
  practice_date: string;
  practice_type: string;
  source_card_name: string | null;
  notes: string | null;
  created_at: string;
}

interface IntentionRow {
  intention: string;
}

/*
  Your Practice — the tracker. Shows recent completed practices, the
  reader's chosen intentions, voice, chart preview, and subscription
  status. Subscribers also see a small pattern panel ("you've completed
  N practices in the last 30 days").
*/
export default async function PracticePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const account = await getAccount();
  const subscribed = await isSubscribed();

  let practices: PracticeRow[] = [];
  let intentions: string[] = [];
  let practiceCount30 = 0;

  if (account) {
    try {
      const sb = await supabaseForUser();
      const { data: rows } = await sb
        .from("practices")
        .select("*")
        .order("practice_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      practices = (rows as PracticeRow[]) ?? [];

      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 30);
      practiceCount30 = practices.filter(
        (p) => new Date(p.practice_date) >= since,
      ).length;

      const { data: intentRows } = await sb
        .from("user_intentions")
        .select("intention")
        .eq("user_id", account.id);
      intentions = (intentRows as IntentionRow[] | null)?.map(
        (r) => r.intention,
      ) ?? [];
    } catch {
      // Supabase not fully configured yet; leave defaults.
    }
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70 transition-base hover:text-clay"
          >
            ← Witch Life
          </Link>
          <Link
            href="/account"
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70 transition-base hover:text-clay"
          >
            Billing →
          </Link>
        </header>

        <section className="mt-10">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
            Your practice
          </p>
          <h1 className="display mt-2 text-3xl text-ink md:text-5xl">
            What you&rsquo;ve done
          </h1>
          <p className="oracle-body mt-4 max-w-2xl text-ink/85">
            The practices you mark complete are kept here. So are your
            intentions and your chart. Edit anything any time.
          </p>
        </section>

        {/* Subscriber pattern badge */}
        {subscribed && (
          <section className="mt-8 rounded-sm border border-clay/30 bg-clay/5 px-5 py-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
              Last thirty days
            </p>
            <p className="oracle-body mt-2 text-ink/95">
              {practiceCount30 === 0
                ? "You haven't marked a practice as done yet. Start with one — the daily practice is waiting."
                : `${practiceCount30} ${
                    practiceCount30 === 1 ? "practice" : "practices"
                  } completed. ${attendanceLine(practiceCount30)}`}
            </p>
          </section>
        )}

        {/* Intentions */}
        <section className="mt-10 border-t border-bark/25 pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
              Intentions
            </h2>
            <Link
              href="/onboarding"
              className="font-sans text-[10px] uppercase tracking-[0.25em] text-clay transition-base hover:text-ink"
            >
              Edit →
            </Link>
          </div>
          {intentions.length === 0 ? (
            <p className="oracle-body mt-3 text-bark/70">
              No intentions saved yet. Pick up to three from{" "}
              <Link
                href="/onboarding"
                className="text-clay underline-offset-4 hover:underline"
              >
                your chart
              </Link>
              .
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {intentions.map((i) => (
                <span
                  key={i}
                  className="rounded-sm border border-clay/30 bg-clay/5 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-clay"
                >
                  {intentionLabel(i) ?? i}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Chart */}
        <section className="mt-10 border-t border-bark/25 pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
              Your chart
            </h2>
            <Link
              href="/onboarding"
              className="font-sans text-[10px] uppercase tracking-[0.25em] text-clay transition-base hover:text-ink"
            >
              Edit →
            </Link>
          </div>
          {account?.birth_date ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 font-serif text-base text-ink/90">
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth date
              </dt>
              <dd>{account.birth_date}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth time
              </dt>
              <dd>{account.birth_time ?? "—"}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Birth city
              </dt>
              <dd>{account.birth_city ?? "—"}</dd>
              <dt className="font-sans text-xs uppercase tracking-[0.2em] text-bark/70">
                Voice
              </dt>
              <dd>{VOICE_LABEL[account.oracle_voice]}</dd>
            </dl>
          ) : (
            <p className="oracle-body mt-3 text-bark/70">
              No chart saved yet. Cast it on{" "}
              <Link
                href="/onboarding"
                className="text-clay underline-offset-4 hover:underline"
              >
                the threshold
              </Link>
              .
            </p>
          )}
        </section>

        {/* Practice log */}
        <section className="mt-10 border-t border-bark/25 pt-8">
          <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Recent practices
          </h2>
          {practices.length === 0 ? (
            <p className="oracle-body mt-3 italic text-bark/70">
              Nothing yet. Complete the daily practice and tap{" "}
              <span className="not-italic text-moss">Mark as done</span> to
              start the log.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {practices.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between rounded-sm border border-bark/25 bg-bone/40 px-4 py-3"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-clay w-20">
                      {p.practice_type}
                    </span>
                    <span className="font-serif text-base text-ink/95">
                      {p.source_card_name ?? "—"}
                    </span>
                  </div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
                    {formatPracticeDate(p.practice_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function formatPracticeDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function attendanceLine(count: number): string {
  if (count >= 25) return "A daily practice now.";
  if (count >= 15) return "Showing up more than half the time.";
  if (count >= 7) return "About once a week.";
  if (count >= 3) return "A start.";
  return "The body remembers small things.";
}
