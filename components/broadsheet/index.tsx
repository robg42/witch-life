/*
  Broadsheet building blocks — the Witch Life almanac design vocabulary.
  Re-used across hub, reading, library, sabbat, onboarding etc.

  Avoid one-off styling at the page level; reach for these instead.
*/

import * as React from "react";

// ─── Fleuron — section separator with a centred ornament ────────────────

export function Fleuron({
  mark = "❦",
  className = "",
}: {
  mark?: string;
  className?: string;
}) {
  return (
    <div className={`fleuron ${className}`} aria-hidden>
      <span className="fleuron-mark">{mark}</span>
    </div>
  );
}

// ─── BroadsheetMasthead ────────────────────────────────────────────────

interface MastheadProps {
  /** Top tiny line — usually edition number or date. */
  edition: string;
  /** The publication name. */
  title?: string;
  /** Right-hand small caption. */
  meta?: React.ReactNode;
  className?: string;
}

export function Masthead({
  edition,
  title = "Witch Life",
  meta,
  className = "",
}: MastheadProps) {
  return (
    <header
      className={`rule-b border-rule pb-3 ${className}`}
    >
      <div className="flex items-end justify-between gap-3 almanac">
        <span className="text-ink/80">{edition}</span>
        {meta && <span className="text-ink/80">{meta}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <h1 className="broadsheet text-[clamp(2.2rem,8vw,5.5rem)]">
          {title}
        </h1>
      </div>
    </header>
  );
}

// ─── SectionHeader — rule + label + optional accent ────────────────────

interface SectionHeaderProps {
  /** Small caps label, e.g. "Today's Practice" */
  label: string;
  /** Optional numeric tag e.g. "01" — placed left of the label. */
  index?: string;
  /** Optional right-hand metadata, like "MMXXVI · MOON XV". */
  meta?: React.ReactNode;
  /** Optional secondary headline. */
  headline?: string;
  className?: string;
}

export function SectionHeader({
  label,
  index,
  meta,
  headline,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`rule-t pt-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 almanac">
        <div className="flex items-baseline gap-3">
          {index && (
            <span className="text-vermilion font-medium">{index}</span>
          )}
          <span>{label}</span>
        </div>
        {meta && <span className="text-ash">{meta}</span>}
      </div>
      {headline && (
        <h2 className="display mt-2 text-3xl md:text-4xl">{headline}</h2>
      )}
    </div>
  );
}

// ─── RuledList — list with hard rules between rows ─────────────────────

export function RuledList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={`rule-t border-rule ${className}`}>{children}</ul>
  );
}

export function RuledRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={`rule-b border-rule py-3 ${className}`}>{children}</li>
  );
}

// ─── DataField — label-over-value, mono uppercase label ────────────────

export function DataField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="almanac">{label}</span>
      <span className="font-serif text-base text-ink">{value}</span>
    </div>
  );
}

// ─── Stamp — small box for tags / status labels ────────────────────────

export function Stamp({
  children,
  tone = "vermilion",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "vermilion" | "ink" | "sage";
  className?: string;
}) {
  const cls =
    tone === "ink"
      ? "stamp-ink"
      : tone === "sage"
        ? "stamp"
        : "stamp";
  const style: React.CSSProperties =
    tone === "sage"
      ? { borderColor: "var(--c-sage)", color: "var(--c-sage)" }
      : {};
  return (
    <span className={`${cls} ${className}`} style={style}>
      {children}
    </span>
  );
}

// ─── Marginalia — the big margin number used beside list items ─────────

export function Marginalia({
  number,
  children,
}: {
  number: number | string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr] items-baseline gap-4">
      <span className="marginalia">{String(number).padStart(2, "0")}</span>
      <div>{children}</div>
    </div>
  );
}

// ─── Frame — thick-bordered container with ink shadow ──────────────────

export function Frame({
  children,
  className = "",
  shadow = "ink",
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: "ink" | "vermilion" | "none";
}) {
  const shadowCls =
    shadow === "vermilion"
      ? "vermilion-shadow"
      : shadow === "none"
        ? ""
        : "ink-shadow";
  return (
    <div
      className={`border-[1.5px] border-rule bg-paper-3 ${shadowCls} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── EditionInfo — date + sky strip rendered as a printed strip ────────

export function EditionInfo({
  parts,
  className = "",
}: {
  parts: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return (
    <div
      className={`grid border-[1.5px] border-rule bg-paper-2/60 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))`,
      }}
    >
      {parts.map((p, i) => (
        <div
          key={i}
          className={`px-4 py-3 ${i > 0 ? "border-l-[1.5px] border-rule" : ""}`}
        >
          <div className="almanac">{p.label}</div>
          <div className="mt-1 font-serif text-base text-ink">{p.value}</div>
        </div>
      ))}
    </div>
  );
}
