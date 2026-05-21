import type {
  EclipseReportJson,
  NatalReportJson,
  ReportType,
  SaturnReturnReportJson,
  YearAheadReportJson,
} from "@/lib/reports";

/*
  Long-form report rendering. One renderer per shape. We accept the raw
  jsonb out of Supabase and switch on the report_type column rather than
  trusting an embedded discriminator.
*/

interface Props {
  type: ReportType;
  report: unknown;
}

export function ReportRenderer({ type, report }: Props) {
  switch (type) {
    case "natal":
      return <NatalReport data={report as NatalReportJson} />;
    case "year_ahead":
      return <YearAheadReport data={report as YearAheadReportJson} />;
    case "saturn_return":
      return <SaturnReturnReport data={report as SaturnReturnReportJson} />;
    case "eclipse_season":
      return <EclipseSeasonReport data={report as EclipseReportJson} />;
  }
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 mb-3">
        {label}
      </h2>
      <div className="oracle-body whitespace-pre-wrap text-ink/95">
        {children}
      </div>
    </section>
  );
}

function NatalReport({ data }: { data: NatalReportJson }) {
  return (
    <article>
      <p className="oracle-body text-ink/95">{data.summary}</p>
      <Section label="Luminaries">{data.luminaries}</Section>
      <Section label="Personal planets">{data.personal_planets}</Section>
      <Section label="Social planets">{data.social_planets}</Section>
      {data.ascendant && <Section label="Ascendant">{data.ascendant}</Section>}
      <Section label="Synthesis">{data.synthesis}</Section>
    </article>
  );
}

function YearAheadReport({ data }: { data: YearAheadReportJson }) {
  return (
    <article>
      <p className="oracle-body text-ink/95">{data.opening}</p>
      {data.months?.map((m) => (
        <section key={m.month} className="mt-10">
          <h2 className="accent text-2xl text-clay">{m.month}</h2>
          <p className="oracle-body mt-3 whitespace-pre-wrap text-ink/95">
            {m.narrative}
          </p>
          {m.watchFor && (
            <p className="mt-3 font-sans text-xs uppercase tracking-[0.25em] text-moss">
              Watch for · {m.watchFor}
            </p>
          )}
        </section>
      ))}
      <Section label="Closing">{data.closing}</Section>
    </article>
  );
}

function SaturnReturnReport({ data }: { data: SaturnReturnReportJson }) {
  return (
    <article>
      <Section label="What it means">{data.whatItMeans}</Section>
      <Section label="What it undoes">{data.whatItUndoes}</Section>
      <Section label="What it builds">{data.whatItBuilds}</Section>
      <Section label="How to meet it">{data.howToMeetIt}</Section>
    </article>
  );
}

function EclipseSeasonReport({ data }: { data: EclipseReportJson }) {
  return (
    <article>
      <p className="oracle-body text-ink/95">{data.opening}</p>
      <Section label="Eclipses in this window">
        <div className="space-y-6">
          {data.eclipses?.map((e, i) => (
            <div key={i}>
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-clay">
                {e.date} · {e.type} in {e.sign}
              </p>
              <p className="oracle-body mt-1 text-ink/95">
                {e.whatItDisturbs}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section label="How to move">{data.howToMove}</Section>
    </article>
  );
}
