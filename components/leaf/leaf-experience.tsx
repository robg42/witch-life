"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  computeNatalChart,
  getSkyState,
  type NatalChart,
  type SkyState,
} from "@/lib/astro";
import {
  birthToUtcDate,
  loadBirth,
  type BirthDetails,
} from "@/lib/birth-details";
import type { ReadingResponse, PracticeStep } from "@/app/api/reading/route";
import type { CardResponse } from "@/app/api/card/route";
import { summariseEntries, type JournalEntry } from "@/lib/journal";
import { almanacFor } from "@/lib/almanac";
import { dailyCard, randomCard, type Card } from "@/lib/deck";
import { VOICE_LABEL } from "@/lib/voices";
import {
  EditionInfo,
  Fleuron,
  Frame,
  Stamp,
  SectionHeader,
} from "@/components/broadsheet";
import { OracleInput, type OracleAction } from "./oracle-input";
import { LeafJournal } from "./leaf-journal";
import {
  LeafResponse,
  LibraryLookupBody,
  NoteAddedBody,
  type LeafEntry,
} from "./leaf-response";

/*
  The Leaf — Witch Life's single primary surface. It IS the homepage,
  the daily reading, the journal, the card draw, and the question
  channel, arranged as a single broadsheet page for today.

  Flow:
    1. Read birth from localStorage → if missing redirect to onboarding.
    2. Compute sky + natal client-side, derive almanac context.
    3. Fetch recent journal → fetch /api/reading with the daily card.
    4. Render: masthead, edition strip, the practice (intention + gather
       + steps + reflect), today's card with action, oracle conversational
       input, dynamic responses below, inline journal.
*/

export function LeafExperience() {
  const router = useRouter();
  const [birth, setBirth] = useState<BirthDetails | null>(null);

  useEffect(() => {
    const b = loadBirth();
    if (!b) {
      router.replace("/onboarding");
      return;
    }
    setBirth(b);
  }, [router]);

  if (!birth) return <Booting />;
  return <Leaf birth={birth} />;
}

interface InnerProps {
  birth: BirthDetails;
}

function Leaf({ birth }: InnerProps) {
  const { sky, natal, card: seededCard, almanac, seasonalContext } = useMemo(() => {
    const now = new Date();
    const sky = getSkyState(now, { lat: birth.lat });
    const birthDate = birthToUtcDate(birth);
    const natal = computeNatalChart({
      date: birthDate,
      lat: birth.lat,
      lng: birth.lng,
    });
    const a = almanacFor(now, { hemisphere: birth.hemisphere ?? "N" });
    return {
      sky,
      natal,
      card: dailyCard(now),
      almanac: a,
      seasonalContext: `${a.season} · ${a.marker}; ${a.land}`,
    };
  }, [birth]);

  // ─── Reading state ────────────────────────────────────────────────────
  const [reading, setReading] = useState<
    | { status: "loading" }
    | { status: "ok"; data: ReadingResponse }
    | { status: "error"; error: string }
  >({ status: "loading" });
  const [hasJournal, setHasJournal] = useState(false);
  const question: string | undefined = undefined;

  // ─── Conversational response stack ───────────────────────────────────
  const [entries, setEntries] = useState<LeafEntry[]>([]);
  const [appendedNote, setAppendedNote] = useState<string | undefined>();
  const [oracleBusy, setOracleBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReading({ status: "loading" });
    fetchRecentJournal().then((es) => {
      if (cancelled) return;
      const summary = es.length > 0 ? summariseEntries(es) : undefined;
      setHasJournal(es.length > 0);
      fetchReading({
        sky,
        natal,
        voice: birth.voice,
        question,
        recentJournal: summary,
        intentions: birth.intentions,
        seasonalContext,
        dailyCard: seededCard,
      }).then((r) => {
        if (cancelled) return;
        setReading(r);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [sky, natal, birth.voice, birth.intentions, question, seededCard, seasonalContext]);

  // ─── Oracle input dispatcher ─────────────────────────────────────────
  const handleOracle = async (action: OracleAction) => {
    if (action.kind === "library") {
      addEntry({
        kind: "library",
        prompt: `library: ${action.query}`,
        body: <LibraryLookupBody query={action.query} />,
        meta: "Library",
      });
      return;
    }
    if (action.kind === "note") {
      setAppendedNote(action.text);
      addEntry({
        kind: "note",
        prompt: action.text,
        body: <NoteAddedBody />,
        meta: "Saved below",
      });
      return;
    }
    if (action.kind === "card") {
      const drawn = randomCard();
      setOracleBusy(true);
      try {
        const res = await fetch("/api/card", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            card: drawn,
            sky,
            natal,
            voice: birth.voice,
            seasonalContext,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Server responded ${res.status}`);
        }
        const data = (await res.json()) as CardResponse;
        addEntry({
          kind: "card",
          prompt: `Pulled: ${drawn.name}`,
          meta: `${drawn.suit} · ${drawn.name}`,
          body: <PulledCardBody card={drawn} data={data} />,
        });
      } catch (err) {
        addEntry({
          kind: "error",
          prompt: "Pull a card",
          body: <p className="font-mono text-sm text-vermilion">{(err as Error).message}</p>,
        });
      } finally {
        setOracleBusy(false);
      }
      return;
    }
    // Question
    setOracleBusy(true);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sky,
          natal,
          voice: birth.voice,
          question: action.text,
          seasonalContext,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Server responded ${res.status}`);
      }
      const data = (await res.json()) as ReadingResponse;
      addEntry({
        kind: "question",
        prompt: action.text,
        body: data.questionGuidance ? (
          <p className="oracle-body text-ink/95">{data.questionGuidance}</p>
        ) : (
          <p className="oracle-body text-ink/85">
            {data.intentionLine}
          </p>
        ),
        meta: VOICE_LABEL[birth.voice],
      });
    } catch (err) {
      addEntry({
        kind: "error",
        prompt: action.text,
        body: <p className="font-mono text-sm text-vermilion">{(err as Error).message}</p>,
      });
    } finally {
      setOracleBusy(false);
    }
  };

  const addEntry = (e: Omit<LeafEntry, "id">) => {
    setEntries((cur) => [
      { ...e, id: crypto.randomUUID() },
      ...cur,
    ]);
  };

  const dismissEntry = (id: string) => {
    setEntries((cur) => cur.filter((e) => e.id !== id));
  };

  // ─── Render ──────────────────────────────────────────────────────────
  const now = new Date();
  const day = now.getUTCDate();
  const dateLong = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-[1080px] px-5 py-6 md:px-10 md:py-10">
        {/* ─── Masthead ─────────────────────────────────────────────── */}
        <header className="rule-b pb-3">
          <div className="almanac flex flex-wrap items-end justify-between gap-3">
            <span>
              Today&rsquo;s leaf · {dateLong.toUpperCase()}
            </span>
            <span>
              Voice ·{" "}
              <span className="text-vermilion">{VOICE_LABEL[birth.voice]}</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 items-end gap-2 md:grid-cols-[auto_1fr] md:gap-8">
            <span className="display text-vermilion text-[clamp(4.5rem,16vw,10rem)] leading-[0.82] block fade-up">
              {day}
            </span>
            <div className="md:pb-4 fade-up" style={{ animationDelay: "120ms" }}>
              <h1 className="broadsheet text-[clamp(2rem,6vw,4rem)] leading-[0.88]">
                Witch&nbsp;Life
              </h1>
              <p className="display-italic mt-1 text-lg text-ink/80 md:text-xl">
                {almanac.season} — {almanac.marker.toLowerCase()}.
              </p>
            </div>
          </div>
        </header>

        {/* Edition strip */}
        <section
          className="mt-6 fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <EditionInfo
            parts={[
              {
                label: "Moon",
                value: (
                  <span>
                    <span className="text-vermilion mr-2 text-lg leading-none">
                      {sky.moon.phaseSymbol}
                    </span>
                    {sky.moon.phaseName}
                  </span>
                ),
              },
              { label: "Sun", value: sky.sun.sign },
              {
                label: "Mercury",
                value: (
                  <span
                    className={
                      sky.planets.mercury.retrograde
                        ? "text-vermilion"
                        : sky.planets.mercury.shadowPeriod
                          ? "text-sage"
                          : "text-ink"
                    }
                  >
                    {sky.planets.mercury.retrograde
                      ? "Retrograde"
                      : sky.planets.mercury.shadowPeriod
                        ? "In shadow"
                        : "Direct"}
                  </span>
                ),
              },
              {
                label: "Dark moon",
                value: `${Math.round(sky.moon.daysToNewMoon)}d`,
              },
            ]}
          />
          <p className="oracle-body mt-5 text-ink/90 max-w-2xl">
            {almanac.land}
          </p>
        </section>

        <Fleuron mark="❋" />

        {/* ─── The opening — oracle's framing of today ─────────────── */}
        <section>
          {reading.status === "loading" && <OpeningSkeleton />}
          {reading.status === "ok" && (
            <OpeningBlock
              intentionLine={reading.data.intentionLine}
              hasJournal={hasJournal && !!reading.data.journalAwareness}
              journalAwareness={reading.data.journalAwareness}
            />
          )}
          {reading.status === "error" && (
            <Frame shadow="vermilion" className="px-6 py-5">
              <Stamp tone="vermilion">The oracle could not respond</Stamp>
              <p className="font-mono text-sm text-vermilion mt-3">
                {reading.error}
              </p>
            </Frame>
          )}
        </section>

        {/* ─── Practice — gather + do + reflect ──────────────────────── */}
        {reading.status === "ok" && (
          <section className="mt-12">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              <GatherList items={reading.data.gather} />
              <StepsList steps={reading.data.steps} />
            </div>
            <div className="mt-12">
              <Frame shadow="vermilion" className="px-7 py-7">
                <div className="flex items-baseline justify-between gap-4">
                  <Stamp tone="vermilion">Then write</Stamp>
                  <span className="almanac">After the practice</span>
                </div>
                <p className="display-italic mt-5 text-2xl text-ink md:text-3xl">
                  {reading.data.reflectionPrompt}
                </p>
              </Frame>
            </div>
          </section>
        )}

        {/* ─── Today's card with action ────────────────────────────── */}
        {reading.status === "ok" && reading.data.cardAction && (
          <section className="mt-14">
            <SectionHeader
              label="Today&rsquo;s card"
              index="✦"
              meta={`Suit of ${seededCard.suit}`}
            />
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr] md:gap-10">
              <BroadsheetMiniCard suit={seededCard.suit} name={seededCard.name} />
              <p className="oracle-body text-ink/95 max-w-2xl">
                {reading.data.cardAction}
              </p>
            </div>
          </section>
        )}

        <Fleuron mark="✻" />

        {/* ─── Oracle input ────────────────────────────────────────── */}
        <section>
          <div className="almanac mb-4">Ask · pull · note · look up</div>
          <OracleInput onSubmit={handleOracle} busy={oracleBusy} />
        </section>

        {/* ─── Response stack ─────────────────────────────────────── */}
        {entries.length > 0 && (
          <section className="mt-8">
            <LeafResponse entries={entries} onDismiss={dismissEntry} />
          </section>
        )}

        {/* ─── Inline journal ──────────────────────────────────────── */}
        <section className="mt-14">
          <LeafJournal appendedNote={appendedNote} />
        </section>

        <Fleuron mark="❦" className="!my-12" />

        {/* ─── Side rooms ──────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-px bg-rule md:grid-cols-5">
          <RoomLink href="/library" label="The Library" hint="47 entries" />
          <RoomLink href="/spread" label="Three-card spread" hint="Subscriber" />
          <RoomLink href="/journal" label="Past leaves" hint="Archive" />
          <RoomLink href="/reports" label="Long-form" hint="Practice plans" />
          <RoomLink href="/practice" label="Your practice" hint="Settings + log" />
        </section>

        <footer className="rule-t mt-10 pt-4 almanac flex flex-wrap items-baseline justify-between gap-3">
          <span>Witch Life · A.D. {toRoman(now.getUTCFullYear())}</span>
          <span className="italic-accent normal-case tracking-normal text-base text-ink/70">
            Gather. Do. Reflect.
          </span>
          <span>No prediction · only attention</span>
        </footer>
      </div>
    </main>
  );
}

// ─── Sub-blocks ─────────────────────────────────────────────────────────

function OpeningBlock({
  intentionLine,
  hasJournal,
  journalAwareness,
}: {
  intentionLine: string;
  hasJournal: boolean;
  journalAwareness: string | null;
}) {
  return (
    <div className="fade-up">
      <SectionHeader
        label="Opening"
        index="I"
        meta="The oracle&rsquo;s framing for today"
      />
      <p className="oracle-body drop-cap mt-5 text-ink/95 max-w-3xl">
        {intentionLine}
      </p>
      {hasJournal && journalAwareness && (
        <div className="mt-6 border-l-2 border-vermilion pl-5">
          <span className="almanac">From the previous leaves</span>
          <p className="italic-accent mt-2 text-lg text-ink/85">
            {journalAwareness}
          </p>
        </div>
      )}
    </div>
  );
}

function GatherList({ items }: { items: string[] }) {
  return (
    <div>
      <SectionHeader label="Gather" index="II" meta={`${items.length} items`} />
      <ul className="mt-6 space-y-5">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3">
            <span className="marginalia">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-serif text-lg leading-snug text-ink">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepsList({ steps }: { steps: PracticeStep[] }) {
  const total = steps
    .map((s) => parseMinutes(s.duration))
    .reduce((a, b) => a + b, 0);
  return (
    <div>
      <SectionHeader
        label="Do"
        index="III"
        meta={total > 0 ? `${total} min total` : `${steps.length} steps`}
      />
      <ol className="rule-t mt-6 border-rule">
        {steps.map((s, i) => (
          <li
            key={i}
            className="rule-b border-rule grid grid-cols-[3rem_5rem_1fr] items-baseline gap-3 py-4"
          >
            <span className="marginalia">{i + 1}</span>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-vermilion">
              {s.duration}
            </span>
            <span className="font-serif text-lg leading-snug text-ink">
              {s.action}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OpeningSkeleton() {
  return (
    <div className="animate-pulse space-y-4 text-ink/40">
      <div className="h-3 w-32 bg-vermilion/30" />
      <div className="space-y-2">
        <div className="h-5 w-full bg-ink/10" />
        <div className="h-5 w-11/12 bg-ink/10" />
        <div className="h-5 w-10/12 bg-ink/10" />
      </div>
    </div>
  );
}

function BroadsheetMiniCard({ suit, name }: { suit: string; name: string }) {
  return (
    <div className="w-[180px] border-[2px] border-ink bg-paper-3 ink-shadow">
      <div className="rule-b px-4 pb-2 pt-2 almanac text-vermilion">
        {suit}
      </div>
      <div className="px-4 py-10 text-center">
        <span className="display-italic text-[clamp(1.8rem,4vw,2.3rem)] text-ink leading-[0.9]">
          {name}
        </span>
      </div>
      <div className="rule-t px-4 py-2 almanac text-ash">I / XXVIII</div>
    </div>
  );
}

function PulledCardBody({ card, data }: { card: Card; data: CardResponse }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr] md:gap-7">
      <BroadsheetMiniCard suit={card.suit} name={card.name} />
      <div>
        <p className="italic-accent text-lg text-ink/85">{data.interpretation}</p>
        <p className="oracle-body mt-3 text-ink/95">{data.action}</p>
      </div>
    </div>
  );
}

function RoomLink({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-paper px-4 py-4 transition-base hover:bg-paper-3"
    >
      <div className="almanac text-ink/50 group-hover:text-vermilion">
        {hint}
      </div>
      <div className="mt-1 font-display text-lg text-ink group-hover:text-vermilion">
        {label} →
      </div>
    </Link>
  );
}

function Booting() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <span className="almanac">Pressing today&rsquo;s leaf…</span>
    </main>
  );
}

function parseMinutes(s: string): number {
  const m = s.match(/(\d+)\s*min/i);
  if (m) return parseInt(m[1], 10);
  const sec = s.match(/(\d+)\s*sec/i);
  if (sec) return Math.round(parseInt(sec[1], 10) / 60);
  return 0;
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let rem = n;
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}

// ─── Fetchers ──────────────────────────────────────────────────────────

interface FetchReadingArgs {
  sky: SkyState;
  natal: NatalChart;
  voice: BirthDetails["voice"];
  question: string | undefined;
  recentJournal: string | undefined;
  intentions: string[] | undefined;
  seasonalContext: string | undefined;
  dailyCard: Card | undefined;
}

async function fetchReading(
  args: FetchReadingArgs,
): Promise<
  | { status: "ok"; data: ReadingResponse }
  | { status: "error"; error: string }
> {
  try {
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        status: "error",
        error: body?.error ?? `Server responded ${res.status}`,
      };
    }
    const data = (await res.json()) as ReadingResponse;
    return { status: "ok", data };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

async function fetchRecentJournal(): Promise<JournalEntry[]> {
  try {
    const res = await fetch("/api/journal", { method: "GET" });
    if (!res.ok) return [];
    const body = (await res.json()) as { entries?: JournalEntry[] };
    return body.entries ?? [];
  } catch {
    return [];
  }
}
