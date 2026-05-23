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
import { birthToUtcDate, loadBirth, type BirthDetails } from "@/lib/birth-details";
import type { ReadingResponse, PracticeStep } from "@/app/api/reading/route";
import { summariseEntries, type JournalEntry } from "@/lib/journal";
import { almanacFor } from "@/lib/almanac";
import { dailyCard, type Card } from "@/lib/deck";
import { VOICE_LABEL } from "@/lib/voices";
import { MarkDoneButton } from "@/components/practice/mark-done-button";
import {
  EditionInfo,
  Fleuron,
  Frame,
  Stamp,
  SectionHeader,
} from "@/components/broadsheet";

/*
  Today&rsquo;s practice rendered as a broadsheet recipe page. The intention
  is set with a drop cap; the gather list lives in the margin as
  numbered marginalia; the steps are a ruled table; the reflection is
  a framed inset with a vermilion stamp.
*/

export function ReadingExperience() {
  const router = useRouter();
  const [birth, setBirth] = useState<BirthDetails | null>(null);
  const [question, setQuestion] = useState("");
  const [appliedQuestion, setAppliedQuestion] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const b = loadBirth();
    if (!b) {
      router.replace("/onboarding");
      return;
    }
    setBirth(b);
  }, [router]);

  if (!birth) return <Booting />;

  return (
    <ReadingPage
      birth={birth}
      question={appliedQuestion}
      onQuestionChange={setQuestion}
      questionValue={question}
      onAskQuestion={() => setAppliedQuestion(question || undefined)}
    />
  );
}

interface InnerProps {
  birth: BirthDetails;
  question?: string;
  questionValue: string;
  onQuestionChange: (q: string) => void;
  onAskQuestion: () => void;
}

function ReadingPage({
  birth,
  question,
  questionValue,
  onQuestionChange,
  onAskQuestion,
}: InnerProps) {
  const { sky, natal, card, seasonalContext, almanac } = useMemo(() => {
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
      seasonalContext: `${a.season} · ${a.marker}; ${a.land}`,
      almanac: a,
    };
  }, [birth]);

  const [reading, setReading] = useState<
    | { status: "loading" }
    | { status: "ok"; data: ReadingResponse }
    | { status: "error"; error: string }
  >({ status: "loading" });

  const [hasJournal, setHasJournal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReading({ status: "loading" });
    fetchRecentJournal().then((entries) => {
      if (cancelled) return;
      const summary =
        entries.length > 0 ? summariseEntries(entries) : undefined;
      setHasJournal(entries.length > 0);
      fetchReading({
        sky,
        natal,
        voice: birth.voice,
        question,
        recentJournal: summary,
        intentions: birth.intentions,
        seasonalContext,
        dailyCard: card,
      }).then((r) => {
        if (cancelled) return;
        setReading(r);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [sky, natal, birth.voice, birth.intentions, question, card, seasonalContext]);

  const now = new Date();
  const day = now.getUTCDate();
  const dateLine = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-[1100px] px-5 py-6 md:px-10 md:py-10">
        {/* ─── Masthead strip ────────────────────────────────────── */}
        <header className="rule-b pb-3 almanac flex flex-wrap items-end justify-between gap-3">
          <Link
            href="/"
            className="wl-link no-underline"
          >
            ← Witch Life
          </Link>
          <span>{dateLine.toUpperCase()}</span>
          <span>
            Voice: <span className="text-vermilion">{VOICE_LABEL[birth.voice]}</span>
          </span>
        </header>

        {/* ─── Title + sky data ──────────────────────────────────── */}
        <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:gap-12">
          <div className="flex items-start gap-5">
            <span className="display text-vermilion text-[clamp(5rem,15vw,8rem)] leading-none">
              {day}
            </span>
            <div className="mt-2 flex flex-col">
              <span className="almanac">For the day</span>
              <h1 className="display mt-2 text-4xl md:text-5xl leading-none">
                Today&rsquo;s
                <br />
                <span className="display-italic text-vermilion">practice</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <p className="italic-accent text-lg text-ink/85 md:text-xl">
              {almanac.season} — {almanac.marker.toLowerCase()}.
            </p>
            <p className="oracle-body mt-2 text-ink/80">
              {almanac.land}
            </p>
          </div>
        </section>

        {/* ─── Sky table ─────────────────────────────────────────── */}
        <section className="mt-8">
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
              { label: "Sun", value: `${sky.sun.sign} ${Math.round(sky.sun.degree)}°` },
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
                label: "Dark moon in",
                value: `${Math.round(sky.moon.daysToNewMoon)}d`,
              },
            ]}
          />
        </section>

        <Fleuron mark="❋" />

        {/* ─── The practice itself ────────────────────────────────── */}
        <section>
          {reading.status === "loading" && <PracticeSkeleton />}
          {reading.status === "error" && (
            <ErrorBlock
              label="The oracle could not respond"
              detail={reading.error}
            />
          )}
          {reading.status === "ok" && (
            <PracticeBody
              reading={reading.data}
              card={card}
              hasJournal={hasJournal}
              hasQuestion={!!question}
            />
          )}
        </section>

        <Fleuron mark="❋" />

        {/* ─── Question ────────────────────────────────────────── */}
        <section>
          <SectionHeader label="Ask the oracle" index="?" />
          <p className="oracle-body mt-3 text-ink/85">
            One question. The practice will be shaped to answer it.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={questionValue}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="What am I avoiding?"
              className="broadsheet-input"
            />
            <button
              onClick={onAskQuestion}
              disabled={!questionValue.trim()}
              className="btn-vermilion disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </section>

        {/* ─── Foot links ────────────────────────────────────────── */}
        <section className="mt-14 grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
          <FooterLink href="/draw" label="Pull a card" />
          <FooterLink href="/spread" label="Three-card spread" />
          <FooterLink href="/journal" label="The journal" />
          <FooterLink href="/library" label="The Library" />
        </section>
      </div>
    </main>
  );
}

// ─── Body sections ────────────────────────────────────────────────────────

function PracticeBody({
  reading,
  card,
  hasJournal,
  hasQuestion,
}: {
  reading: ReadingResponse;
  card: Card;
  hasJournal: boolean;
  hasQuestion: boolean;
}) {
  return (
    <div className="fade-up">
      {/* Intention line — set with a drop cap */}
      <p className="oracle-body drop-cap text-ink/95 max-w-3xl">
        {reading.intentionLine}
      </p>

      {/* Gather and Do, side by side */}
      <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
        <GatherList items={reading.gather} />
        <StepsList steps={reading.steps} />
      </div>

      {/* Reflect — framed inset with vermilion stamp */}
      <div className="mt-14">
        <Frame shadow="vermilion" className="px-7 py-7">
          <div className="flex items-baseline justify-between gap-4">
            <Stamp tone="vermilion">Then write</Stamp>
            <span className="almanac">After the practice</span>
          </div>
          <p className="display-italic mt-5 text-2xl text-ink md:text-3xl">
            {reading.reflectionPrompt}
          </p>
          <div className="mt-6 flex flex-wrap items-baseline gap-5">
            <Link href="/journal" className="btn-ink no-underline">
              Take it to the journal <span>→</span>
            </Link>
            <MarkDoneButton practiceType="daily" />
          </div>
        </Frame>
      </div>

      {/* Today&rsquo;s card */}
      {reading.cardAction && (
        <section className="mt-14">
          <SectionHeader
            label="Today&rsquo;s card"
            index="✦"
            meta={`Suit of ${card.suit}`}
          />
          <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="border-[2px] border-ink bg-paper-3 ink-shadow w-[180px]">
              <div className="rule-b px-4 pb-2 pt-2 almanac text-vermilion">
                {card.suit}
              </div>
              <div className="px-4 py-10 text-center">
                <span className="display-italic text-[clamp(1.8rem,4vw,2.3rem)] text-ink leading-[0.9]">
                  {card.name}
                </span>
              </div>
              <div className="rule-t px-4 py-2 almanac text-ash">
                I / XXVIII
              </div>
            </div>
            <p className="oracle-body text-ink/95 max-w-2xl">
              {reading.cardAction}
            </p>
          </div>
        </section>
      )}

      {/* Optional sections */}
      {hasJournal && reading.journalAwareness && (
        <section className="mt-14">
          <SectionHeader
            label="What's been moving through you"
            index="¶"
            meta="Read from your journal"
          />
          <p className="oracle-body mt-3 max-w-3xl italic-accent text-ink/90">
            {reading.journalAwareness}
          </p>
        </section>
      )}

      {hasQuestion && reading.questionGuidance && (
        <section className="mt-14">
          <SectionHeader
            label="On your question"
            index="?"
            meta="In voice"
          />
          <p className="oracle-body mt-3 max-w-3xl text-ink/95">
            {reading.questionGuidance}
          </p>
        </section>
      )}

      {reading.tonightNote && (
        <section className="mt-14">
          <SectionHeader label="Tonight" index="☽" />
          <p className="display-italic mt-3 text-xl text-ink/85">
            {reading.tonightNote}
          </p>
        </section>
      )}
    </div>
  );
}

function GatherList({ items }: { items: string[] }) {
  return (
    <div>
      <SectionHeader label="Gather" index="I" meta={`${items.length} items`} />
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
        index="II"
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

function PracticeSkeleton() {
  return (
    <div className="animate-pulse space-y-8 text-ink/40">
      <div className="space-y-2">
        <div className="h-5 w-full bg-ink/10" />
        <div className="h-5 w-11/12 bg-ink/10" />
        <div className="h-5 w-10/12 bg-ink/10" />
      </div>
      <div className="grid gap-12 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 bg-vermilion/30" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-5 w-full bg-ink/10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ label, detail }: { label: string; detail: string }) {
  return (
    <Frame shadow="vermilion" className="px-6 py-5">
      <Stamp tone="vermilion">{label}</Stamp>
      <p className="mt-3 font-serif text-base text-ink/85">{detail}</p>
    </Frame>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block bg-paper px-5 py-4 almanac text-center text-ink transition-base hover:bg-paper-3 hover:text-vermilion"
    >
      {label}
    </Link>
  );
}

function Booting() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <span className="almanac">Casting…</span>
    </main>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function parseMinutes(s: string): number {
  const m = s.match(/(\d+)\s*min/i);
  if (m) return parseInt(m[1], 10);
  const sec = s.match(/(\d+)\s*sec/i);
  if (sec) return Math.round(parseInt(sec[1], 10) / 60);
  return 0;
}

// ─── fetchers (unchanged) ─────────────────────────────────────────────────

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
      const body = await safeJson(res);
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

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
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
