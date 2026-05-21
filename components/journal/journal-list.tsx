"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JournalEntry } from "@/lib/journal";

const PHASE_SYMBOL: Record<string, string> = {
  New: "●",
  "Waxing Crescent": "☽",
  "First Quarter": "◐",
  "Waxing Gibbous": "◕",
  Full: "○",
  "Waning Gibbous": "◔",
  "Last Quarter": "◑",
  "Waning Crescent": "☾",
};

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="font-serif text-base italic text-bark/70">
        Nothing yet. The first entry is the hardest. Everything after is easier.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-12">
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/journal?id=${entry.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li>
      <header className="mb-3 flex items-baseline justify-between border-b border-bark/20 pb-2">
        <div className="flex items-baseline gap-4 font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
          <span>{formatDate(entry.entryDate)}</span>
          {entry.moonPhase && (
            <span>
              <span className="mr-1 text-base text-ink">
                {PHASE_SYMBOL[entry.moonPhase] ?? ""}
              </span>
              {entry.moonPhase}
            </span>
          )}
          {entry.sunSign && <span>Sun in {entry.sunSign}</span>}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="font-sans text-[10px] uppercase tracking-[0.2em] text-bark/60 transition-base hover:text-clay disabled:opacity-50"
        >
          {deleting ? "…" : "remove"}
        </button>
      </header>

      <div className="flex flex-col gap-3 font-serif text-base leading-relaxed text-ink/90">
        {entry.whatLanded && (
          <Block label="What landed">{entry.whatLanded}</Block>
        )}
        {entry.movingToward && (
          <Block label="Moving toward">{entry.movingToward}</Block>
        )}
        {entry.freeText && <Block label="">{entry.freeText}</Block>}
      </div>
    </li>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <span className="mb-1 block font-sans text-[10px] uppercase tracking-[0.25em] text-moss">
          {label}
        </span>
      )}
      <p className="whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const weekday = d.toLocaleString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  return `${weekday} ${day} ${month}`;
}
