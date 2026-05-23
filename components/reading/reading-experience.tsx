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
import type {
  ReadingResponse,
  PracticeStep,
} from "@/app/api/reading/route";
import { summariseEntries, type JournalEntry } from "@/lib/journal";
import { almanacFor } from "@/lib/almanac";
import { TodayPanel } from "@/components/site/today-panel";
import { dailyCard, type Card } from "@/lib/deck";
import { CardArt } from "@/components/cards/card-art";
import { VOICE_LABEL } from "@/lib/voices";

/*
  Today's Practice page. The output of /api/reading is now a practice
  (gather, steps, reflect) rather than interpretive prose. This file
  renders that practice as a real, usable thing: a checklist of items
  to gather, a numbered sequence of timed steps, a reflection prompt
  to take to the journal, and the day's card with its action.
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

  if (!birth) return <BootingState />;

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
  const { sky, natal, card, seasonalContext } = useMemo(() => {
    const now = new Date();
    const sky = getSkyState(now, { lat: birth.lat });
    const birthDate = birthToUtcDate(birth);
    const natal = computeNatalChart({
      date: birthDate,
      lat: birth.lat,
      lng: birth.lng,
    });
    const almanac = almanacFor(now, {
      hemisphere: birth.hemisphere ?? "N",
    });
    return {
      sky,
      natal,
      card: dailyCard(now),
      seasonalContext: `${almanac.season} · ${almanac.marker}; ${almanac.land}`,
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

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70 transition-base hover:text-clay"
          >
            ← Witch Life
          </Link>
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Voice ·{" "}
            <span className="text-clay">{VOICE_LABEL[birth.voice]}</span>
          </span>
        </header>

        {/* Hero — page title */}
        <section className="mt-8 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-clay">
            Today
          </p>
          <h1 className="display mt-2 text-3xl text-ink md:text-5xl">
            Your practice
          </h1>
          <p className="oracle-body mt-4 max-w-2xl text-ink/85">
            Five to fifteen minutes. Gather the things. Walk through the steps.
            Reflect when you&rsquo;re finished.
          </p>
        </section>

        {/* Almanac context */}
        <section className="mt-8 fade-up" style={{ animationDelay: "100ms" }}>
          <TodayPanel sky={sky} />
        </section>

        {/* Practice body */}
        <section className="mt-12">
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

        {/* Question form */}
        <section className="mt-16 border-t border-bark/25 pt-10">
          <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Ask the oracle
          </h2>
          <p className="oracle-body mt-2 text-ink/85">
            One question. The practice will be shaped to answer it.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={questionValue}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="What am I avoiding?"
              className="flex-1 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/50 focus:border-clay"
            />
            <button
              onClick={onAskQuestion}
              disabled={!questionValue.trim()}
              className="font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-6 py-3 text-parchment transition-base hover:bg-clay/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </section>

        <footer className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FooterLink href="/draw" label="Pull a card" />
          <FooterLink href="/spread" label="Three-card spread" />
          <FooterLink href="/journal" label="The journal" />
          <FooterLink href="/library" label="The library" />
        </footer>
      </div>
    </main>
  );
}

// ─── Body sections ─────────────────────────────────────────────────────────

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
    <div>
      {/* Intention line — the frame for today */}
      <p className="oracle-body text-ink/95 fade-up">
        {reading.intentionLine}
      </p>

      {/* Gather + Do, side by side on desktop */}
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <GatherList items={reading.gather} />
        <StepsList steps={reading.steps} />
      </div>

      {/* Reflect */}
      <div className="mt-12 rounded-sm border border-clay/40 bg-clay/5 p-6 fade-up">
        <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
          Then write
        </p>
        <p className="oracle-body mt-3 text-ink/95">
          {reading.reflectionPrompt}
        </p>
        <Link
          href="/journal"
          className="mt-5 inline-block font-sans text-xs uppercase tracking-[0.25em] border border-bark/30 bg-bone/60 px-5 py-2 text-ink transition-base hover:border-clay hover:text-clay"
        >
          Take it to the journal →
        </Link>
      </div>

      {/* Today's card with its action */}
      {reading.cardAction && (
        <div className="mt-12 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
            Today&rsquo;s card
          </p>
          <div className="mt-4 grid grid-cols-[auto,1fr] items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="flex h-44 w-28 flex-col items-center justify-between border border-bark/30 bg-bone/60 px-2 py-3">
                <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-moss">
                  {card.suit}
                </span>
                <div className="text-moss">
                  <CardArt card={card} />
                </div>
                <span className="accent text-sm text-ink">{card.name}</span>
              </div>
            </div>
            <p className="oracle-body text-ink/95">{reading.cardAction}</p>
          </div>
        </div>
      )}

      {/* Optional sections */}
      {hasJournal && reading.journalAwareness && (
        <div className="mt-12 border-l-2 border-moss/40 pl-5 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-moss">
            What&rsquo;s been moving through you
          </p>
          <p className="oracle-body mt-2 text-ink/90">
            {reading.journalAwareness}
          </p>
        </div>
      )}

      {hasQuestion && reading.questionGuidance && (
        <div className="mt-10 border-l-2 border-clay/40 pl-5 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
            On your question
          </p>
          <p className="oracle-body mt-2 text-ink/95">
            {reading.questionGuidance}
          </p>
        </div>
      )}

      {reading.tonightNote && (
        <div className="mt-10 fade-up">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Tonight
          </p>
          <p className="oracle-body mt-2 italic text-bark/85">
            {reading.tonightNote}
          </p>
        </div>
      )}
    </div>
  );
}

function GatherList({ items }: { items: string[] }) {
  return (
    <div className="fade-up">
      <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
        Gather
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 border-b border-bark/15 pb-3 last:border-b-0"
          >
            <span
              aria-hidden
              className="font-sans text-[10px] uppercase tracking-[0.25em] text-moss"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-serif text-base text-ink/95">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepsList({ steps }: { steps: PracticeStep[] }) {
  return (
    <div className="fade-up">
      <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
        Do
      </p>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-baseline gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-clay/50 bg-bone/60 font-sans text-[10px] tracking-wider text-clay">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
                {s.duration}
              </p>
              <p className="mt-1 font-serif text-base leading-relaxed text-ink/95">
                {s.action}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PracticeSkeleton() {
  return (
    <div className="animate-pulse space-y-8 text-bark/40">
      <div className="space-y-2">
        <div className="h-4 w-full bg-bark/15" />
        <div className="h-4 w-11/12 bg-bark/15" />
      </div>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="h-3 w-20 bg-clay/20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 w-full bg-bark/10" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-20 bg-clay/20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 w-full bg-bark/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorBlock({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-sm border border-clay/40 bg-clay/5 px-6 py-5">
      <p className="font-sans text-xs uppercase tracking-[0.25em] text-clay">
        {label}
      </p>
      <p className="mt-2 font-serif text-base text-ink/85">{detail}</p>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-sm border border-bark/25 bg-linen/40 px-4 py-3 text-center font-sans text-[10px] uppercase tracking-[0.25em] text-ink transition-base hover:border-clay hover:bg-linen/70 hover:text-clay"
    >
      {label}
    </Link>
  );
}

function BootingState() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
        Casting…
      </span>
    </main>
  );
}

// ─── Fetchers ─────────────────────────────────────────────────────────────

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
