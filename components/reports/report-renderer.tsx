import type {
  EclipseReportJson,
  NatalReportJson,
  PracticeBlock,
  ReportType,
  SaturnReturnReportJson,
  YearAheadReportJson,
} from "@/lib/reports";

/*
  Long-form report rendering as practice plans. Each report type
  surfaces a shared PracticeBlock (gather/steps/reflect) plus the
  framing copy specific to that report.
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

// ─── Shared blocks ─────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay mb-3">
        {label}
      </h2>
      <div className="oracle-body whitespace-pre-wrap text-ink/95">
        {children}
      </div>
    </section>
  );
}

function PracticeBlockView({ practice }: { practice: PracticeBlock }) {
  return (
    <div className="rounded-sm border border-bark/25 bg-bone/40 p-5">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
            Gather
          </p>
          <ul className="mt-3 space-y-2">
            {practice.gather.map((g, i) => (
              <li key={i} className="font-serif text-base text-ink/95">
                — {g}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
            Do
          </p>
          <ol className="mt-3 space-y-3">
            {practice.steps.map((s, i) => (
              <li key={i} className="font-serif text-base text-ink/95">
                <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-bark/60">
                  {s.duration}
                </span>
                <br />
                {s.action}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-5 border-t border-bark/20 pt-4">
        <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
          Then write
        </p>
        <p className="mt-2 font-serif text-base italic text-ink/95">
          {practice.reflectionPrompt}
        </p>
      </div>
    </div>
  );
}

// ─── Per-report renderers ──────────────────────────────────────────────

function NatalReport({ data }: { data: NatalReportJson }) {
  return (
    <article>
      <p className="oracle-body text-ink/95">{data.overview}</p>
      {data.placements?.map((p, i) => (
        <section key={i} className="mt-12">
          <h2 className="accent text-2xl text-clay md:text-3xl">
            {p.placement}
          </h2>
          <p className="oracle-body mt-3 whitespace-pre-wrap text-ink/95">
            {p.asks}
          </p>
          <div className="mt-5">
            <PracticeBlockView practice={p.practice} />
          </div>
        </section>
      ))}
      <Section label="Taken together">{data.synthesis}</Section>
    </article>
  );
}

function YearAheadReport({ data }: { data: YearAheadReportJson }) {
  return (
    <article>
      <p className="oracle-body whitespace-pre-wrap text-ink/95">
        {data.opening}
      </p>
      {data.months?.map((m, i) => (
        <section key={i} className="mt-12">
          <h2 className="accent text-2xl text-clay md:text-3xl">{m.month}</h2>
          <p className="font-accent mt-3 text-xl italic text-ink/95">
            {m.theme}
          </p>
          <div className="mt-5">
            <PracticeBlockView practice={m.practice} />
          </div>
        </section>
      ))}
      <Section label="Closing">{data.closing}</Section>
    </article>
  );
}

function SaturnReturnReport({ data }: { data: SaturnReturnReportJson }) {
  return (
    <article>
      <p className="oracle-body whitespace-pre-wrap text-ink/95">
        {data.opening}
      </p>
      <Section label="Three asks">
        <ol className="mt-2 space-y-6">
          {data.threeAsks?.map((a, i) => (
            <li key={i}>
              <p className="accent text-xl text-clay">{a.ask}</p>
              <p className="oracle-body mt-2 whitespace-pre-wrap text-ink/95">
                {a.expansion}
              </p>
            </li>
          ))}
        </ol>
      </Section>
      <Section label="Each week of the window">
        <div className="not-prose">
          <PracticeBlockView practice={data.weeklyPractice} />
        </div>
      </Section>
      <Section label="When the return has done its work">
        {data.closing}
      </Section>
    </article>
  );
}

function EclipseSeasonReport({ data }: { data: EclipseReportJson }) {
  return (
    <article>
      <p className="oracle-body whitespace-pre-wrap text-ink/95">
        {data.opening}
      </p>
      {data.eclipses?.map((e, i) => (
        <section key={i} className="mt-12">
          <p className="font-sans text-xs uppercase tracking-[0.32em] text-clay">
            {e.date} · {e.type} in {e.sign}
          </p>
          <div className="mt-4">
            <PracticeBlockView practice={e.practice} />
          </div>
        </section>
      ))}
      <Section label="After the window">{data.followUp}</Section>
    </article>
  );
}
