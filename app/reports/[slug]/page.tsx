import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { REPORT_META, type ReportJson, type ReportType } from "@/lib/reports";
import { ReportRenderer } from "@/components/reports/report-renderer";
import { BotanicalDivider } from "@/components/site/botanical-divider";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  user_id: string;
  report_type: ReportType;
  report_json:
    | (ReportJson["data"] & { pendingReason?: string })
    | { type?: ReportType; pendingReason?: string }
    | null;
  created_at: string;
}

export default async function ReportDetail({
  params,
}: {
  params: { slug: string };
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) notFound();

  const { data: row } = await sb
    .from("reports")
    .select("*")
    .eq("id", params.slug)
    .eq("user_id", userRow.id)
    .maybeSingle();
  if (!row) notFound();

  const report = row as ReportRow;
  const meta = REPORT_META[report.report_type];
  const pendingReason =
    report.report_json &&
    typeof report.report_json === "object" &&
    "pendingReason" in report.report_json
      ? (report.report_json.pendingReason as string)
      : null;

  return (
    <main className="min-h-screen bg-earth text-parchment">
      <div className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/reports"
          className="font-sans text-xs uppercase tracking-[0.25em] text-ash transition-base hover:text-parchment"
        >
          ← Reports
        </Link>

        <h1 className="display mt-10 text-3xl text-parchment md:text-4xl">
          {meta?.title ?? report.report_type}
        </h1>
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-ash mt-3">
          {new Date(report.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <BotanicalDivider className="my-10" />

        {pendingReason ? (
          <div className="hairline rounded-md bg-bark/40 px-6 py-5">
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-ochre">
              Awaiting generation
            </p>
            <p className="oracle-body mt-2 text-parchment/85">
              {pendingReason}. Once your birth details are saved, the report
              will be generated in the background.
            </p>
            <p className="mt-3 font-sans text-xs text-ash">Report id: {report.id}</p>
          </div>
        ) : (
          <ReportRenderer report={report.report_json as ReportJson["data"]} type={report.report_type} />
        )}
      </div>
    </main>
  );
}
