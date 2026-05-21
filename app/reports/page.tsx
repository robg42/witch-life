import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
} from "@/lib/astro";
import { REPORT_META, type ReportType } from "@/lib/reports";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { ReportPurchaseCard } from "@/components/reports/report-purchase-card";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  report_type: ReportType;
  report_json: { type?: string; pendingReason?: string } | null;
  created_at: string;
}

export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id, birth_date, birth_time, birth_lat, birth_lng, oracle_voice")
    .eq("clerk_id", userId)
    .maybeSingle();

  const purchases: ReportRow[] = userRow
    ? ((
        await sb
          .from("reports")
          .select("id, report_type, report_json, created_at")
          .eq("user_id", userRow.id)
          .order("created_at", { ascending: false })
      ).data as ReportRow[]) ?? []
    : [];

  let natal: NatalChart | null = null;
  if (userRow?.birth_date) {
    const [y, m, d] = userRow.birth_date.split("-").map(Number);
    const [hh, mm] = (userRow.birth_time ?? "12:00").split(":").map(Number);
    const offsetMs =
      userRow.birth_lng != null
        ? Math.round((userRow.birth_lng / 15) * 3_600_000)
        : 0;
    natal = computeNatalChart({
      date: new Date(
        Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0, 0) - offsetMs,
      ),
      lat: userRow.birth_lat ?? undefined,
      lng: userRow.birth_lng ?? undefined,
    });
  }
  const sky = getSkyState(new Date());
  const now = new Date();
  const types: ReportType[] = [
    "natal",
    "year_ahead",
    "saturn_return",
    "eclipse_season",
  ];

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
        >
          ← Witch Life
        </Link>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay mt-10">
          Long-form readings
        </p>
        <h1 className="display mt-3 text-3xl text-ink md:text-5xl">
          In-depth reports
        </h1>
        <p className="oracle-body mt-4 text-ink/85">
          Long-form readings, written once and yours to keep. Each is
          generated specifically for your chart in your chosen voice.
        </p>

        {!natal && (
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.25em] text-clay">
            Add your birth details before purchasing —{" "}
            <Link href="/onboarding" className="underline-offset-4 hover:underline">
              edit chart
            </Link>
          </p>
        )}

        <BotanicalDivider className="my-12" />

        <section>
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 mb-6">
            Available reports
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {types.map((t) => {
              const meta = REPORT_META[t];
              const available = natal
                ? meta.isAvailable({ natal, sky, date: now })
                : true;
              return (
                <ReportPurchaseCard
                  key={t}
                  type={t}
                  title={meta.title}
                  blurb={meta.blurb}
                  priceGBP={meta.priceGBP}
                  available={available}
                  unavailableReason={
                    t === "saturn_return"
                      ? "Surfaced when your Saturn return is active."
                      : t === "eclipse_season"
                        ? "Surfaced during an eclipse window."
                        : undefined
                  }
                />
              );
            })}
          </div>
        </section>

        <BotanicalDivider className="my-16" />

        <section>
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 mb-6">
            Yours
          </h2>
          {purchases.length === 0 ? (
            <p className="font-serif text-base italic text-bark/70">
              No reports yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {purchases.map((row) => {
                const meta = REPORT_META[row.report_type];
                const pending = row.report_json?.pendingReason;
                return (
                  <li
                    key={row.id}
                    className="rounded-sm border border-bark/25 bg-linen/40 px-5 py-4"
                  >
                    <Link
                      href={`/reports/${row.id}`}
                      className="flex items-baseline justify-between text-ink transition-base hover:text-clay"
                    >
                      <span className="font-serif text-lg">
                        {meta?.title ?? row.report_type}
                      </span>
                      <span className="font-sans text-xs uppercase tracking-[0.2em] text-bark/60">
                        {new Date(row.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </Link>
                    {pending && (
                      <p className="mt-2 font-sans text-xs uppercase tracking-[0.2em] text-clay">
                        Awaiting generation · {pending}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
