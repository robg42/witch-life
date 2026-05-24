import Link from "next/link";
import { hasFeature } from "@/lib/feature-flags-server";

/*
  Journal export trigger — gated behind 'journal-export' feature flag.
  Renders a single anchor that hits the GET /api/journal/export
  endpoint and prompts a browser download.
*/

export async function JournalExportButton() {
  if (!(await hasFeature("journal-export"))) return null;

  return (
    <Link
      href="/api/journal/export"
      prefetch={false}
      className="inline-flex items-center gap-2 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/60 px-3 py-2 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.18em] text-[var(--c-ink)] transition-colors hover:bg-[var(--c-paper-3)] hover:text-[var(--c-vermilion)]"
    >
      <span aria-hidden>↓</span>
      Export journal · markdown
    </Link>
  );
}
