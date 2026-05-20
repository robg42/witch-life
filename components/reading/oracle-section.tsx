/*
  A single labelled section of the oracle's reading. The label is small,
  uppercase, archaic-feeling; the body is generous Cormorant Garamond.

  `tone` lets a section signal mood (expand/contract/protect) by shifting
  the marginal label colour without changing the body type.
*/
export function OracleSection({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "expand" | "contract" | "protect" | "question" | "journal";
  children: React.ReactNode;
}) {
  const labelColour: Record<typeof tone, string> = {
    default: "text-ash",
    expand: "text-sage",
    contract: "text-moss",
    protect: "text-ochre",
    question: "text-ochre",
    journal: "text-ash",
  };
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-3 font-sans text-xs uppercase tracking-[0.25em]">
        <span className={labelColour[tone]}>{label}</span>
      </div>
      <div className="oracle-body text-parchment/95">{children}</div>
    </section>
  );
}
