/*
  Tiny shared UI bricks for /admin. We deliberately keep these here
  rather than in components/site so they can evolve independently of
  the user-facing surfaces.
*/

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-baseline gap-2 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.22em] text-[var(--c-ash)]">
      <span className="h-px w-6 bg-[var(--c-rule)]" />
      {children}
    </h2>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const accentClass =
    tone === "warn"
      ? "border-l-[var(--c-vermilion)]"
      : tone === "good"
        ? "border-l-[var(--c-sage)]"
        : "border-l-[var(--c-rule)]";
  return (
    <div
      className={`border border-[var(--c-rule)] border-l-[6px] bg-[var(--c-paper-3)]/60 px-4 py-3 ${accentClass}`}
    >
      <div className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--c-ash)]">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--c-ink)]">
        {value}
      </div>
      {hint && (
        <div className="mt-1 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.15em] text-[var(--c-ash)]">
          {hint}
        </div>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn" | "muted";
}) {
  const toneClass =
    tone === "good"
      ? "border-[var(--c-sage)] text-[var(--c-sage)]"
      : tone === "warn"
        ? "border-[var(--c-vermilion)] text-[var(--c-vermilion)]"
        : tone === "muted"
          ? "border-[var(--c-ash)] text-[var(--c-ash)]"
          : "border-[var(--c-rule)] text-[var(--c-ink)]";
  return (
    <span
      className={`inline-block border px-2 py-[2px] font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.18em] ${toneClass}`}
    >
      {children}
    </span>
  );
}
