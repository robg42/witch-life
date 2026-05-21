"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  computeNatalChart,
  computeTransits,
  getSkyState,
  type NatalChart,
  type SkyState,
} from "@/lib/astro";
import { birthToUtcDate, loadBirth, type BirthDetails } from "@/lib/birth-details";
import type { ReadingResponse } from "@/app/api/reading/route";
import type { WeeklyResponse } from "@/app/api/weekly/route";
import { summariseEntries, type JournalEntry } from "@/lib/journal";
import { BotanicalDivider } from "@/components/site/botanical-divider";
import { CosmicBar } from "@/components/reading/cosmic-bar";
import { NatalStrip } from "@/components/reading/natal-strip";
import { OracleSection } from "@/components/reading/oracle-section";
import { WeeklyArc } from "@/components/reading/weekly-arc";
import { TarotCard } from "@/components/cards/tarot-card";
import { CardInterpretation } from "@/components/cards/card-interpretation";
import { dailyCard, type Card } from "@/lib/deck";
import { VOICE_LABEL } from "@/lib/voices";

/*
  Reading page on the cream herbarium surface.
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
  const { sky, natal, todayISO, card } = useMemo(() => {
    const now = new Date();
    const sky = getSkyState(now, { lat: birth.lat });
    const birthDate = birthToUtcDate(birth);
    const natal = computeNatalChart({
      date: birthDate,
      lat: birth.lat,
      lng: birth.lng,
    });
    return {
      sky,
      natal,
      todayISO: now.toISOString().slice(0, 10),
      card: dailyCard(now),
    };
  }, [birth]);

  const [revealedCard, setRevealedCard] = useState<Card | null>(null);

  const [reading, setReading] = useState<
    { status: "loading" } | { status: "ok"; data: ReadingResponse } | { status: "error"; error: string }
  >({ status: "loading" });

  const [weekly, setWeekly] = useState<
    { status: "loading" } | { status: "ok"; data: WeeklyResponse } | { status: "error"; error: string }
  >({ status: "loading" });

  const [hasJournal, setHasJournal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReading({ status: "loading" });
    setWeekly({ status: "loading" });

    fetchWeekly(todayISO, natal, birth.voice).then((r) => {
      if (cancelled) return;
      setWeekly(r);
    });

    fetchRecentJournal().then((entries) => {
      if (cancelled) return;
      const summary = entries.length > 0 ? summariseEntries(entries) : undefined;
      setHasJournal(entries.length > 0);
      fetchReading(sky, natal, birth.voice, question, summary).then((r) => {
        if (cancelled) return;
        setReading(r);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [sky, natal, birth.voice, question, todayISO]);

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-baseline justify-between">
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 transition-base hover:text-clay"
          >
            ← Witch Life
          </Link>
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Voice: <span className="text-clay">{VOICE_LABEL[birth.voice]}</span>{" "}
            ·{" "}
            <Link
              href="/onboarding"
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              edit chart
            </Link>
          </span>
        </header>

        <section className="mt-10">
          <CosmicBar sky={sky} />
        </section>

        <section className="mt-8">
          <NatalStrip natal={natal} />
        </section>

        <section className="mt-12 flex flex-col items-center">
          <TarotCard card={card} onFlip={(c) => setRevealedCard(c)} />
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Today&rsquo;s symbol — drawn for everyone
          </p>
          <CardInterpretation
            card={revealedCard}
            sky={sky}
            natal={natal}
            voice={birth.voice}
          />
        </section>

        <BotanicalDivider className="my-12 mx-auto" />

        {reading.status === "loading" && <ReadingSkeleton />}
        {reading.status === "error" && (
          <ErrorBlock
            label="The oracle could not respond"
            detail={reading.error}
          />
        )}
        {reading.status === "ok" && (
          <ReadingBody
            reading={reading.data}
            hasJournal={hasJournal}
            hasQuestion={!!question}
          />
        )}

        {/* Question form */}
        <section className="mt-16 border-t border-bark/25 pt-10">
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
            Ask the oracle
          </h2>
          <p className="oracle-body mt-2 text-ink/85">
            One question. The oracle answers it through the day&rsquo;s sky.
          </p>
          <div className="mt-4 flex gap-4">
            <input
              type="text"
              value={questionValue}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="What should I be paying attention to?"
              className="flex-1 border-b border-bark/30 bg-transparent px-1 py-2 font-serif text-lg text-ink outline-none placeholder:text-bark/50 focus:border-clay"
            />
            <button
              onClick={onAskQuestion}
              disabled={!questionValue.trim()}
              className="font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/15 px-6 py-3 text-ink transition-base hover:bg-moss/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </section>

        <BotanicalDivider className="my-16 mx-auto" />

        <section>
          <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70 mb-6">
            The week ahead
          </h2>
          {weekly.status === "loading" && <WeeklySkeleton />}
          {weekly.status === "error" && (
            <ErrorBlock
              label="The weekly arc could not be drawn"
              detail={weekly.error}
            />
          )}
          {weekly.status === "ok" && (
            <WeeklyArc weekly={weekly.data} todayISO={todayISO} />
          )}
        </section>

        <BotanicalDivider className="my-16 mx-auto" />

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FooterLink href="/draw" label="Pull a card" />
          <FooterLink href="/spread" label="Three-card spread" />
          <FooterLink href="/journal" label="The journal" />
          <FooterLink href="/reports" label="Deeper reports" />
        </section>

        <footer className="mt-24 text-center font-sans text-[10px] uppercase tracking-[0.25em] text-bark/60">
          {transitFooter(sky, natal)}
        </footer>
      </div>
    </main>
  );
}

function ReadingBody({
  reading,
  hasJournal,
  hasQuestion,
}: {
  reading: ReadingResponse;
  hasJournal: boolean;
  hasQuestion: boolean;
}) {
  return (
    <div>
      <OracleSection label="Energetic weather">
        {reading.energeticWeather}
      </OracleSection>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <OracleSection label="Expand" tone="expand">
          {reading.expand}
        </OracleSection>
        <OracleSection label="Contract" tone="contract">
          {reading.contract}
        </OracleSection>
      </div>

      {hasJournal && reading.journalAwareness && (
        <OracleSection label="What's been moving through you" tone="journal">
          {reading.journalAwareness}
        </OracleSection>
      )}

      {hasQuestion && reading.questionGuidance && (
        <OracleSection label="On your question" tone="question">
          {reading.questionGuidance}
        </OracleSection>
      )}

      <div className="mt-10 rounded-sm border border-clay/40 bg-clay/5 p-6">
        <OracleSection label="Protect your energy" tone="protect">
          {reading.protectYourEnergy}
        </OracleSection>
      </div>
    </div>
  );
}

function ReadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 text-bark/40">
      <div className="h-3 w-32 bg-bark/20" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-bark/15" />
        <div className="h-4 w-11/12 bg-bark/15" />
        <div className="h-4 w-10/12 bg-bark/15" />
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-28 border border-bark/20 bg-bark/5" />
      ))}
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
      className="rounded-sm border border-bark/25 bg-linen/40 px-4 py-3 text-center font-sans text-xs uppercase tracking-[0.25em] text-ink transition-base hover:border-clay hover:bg-linen/70 hover:text-clay"
    >
      {label}
    </Link>
  );
}

function BootingState() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <span className="font-sans text-xs uppercase tracking-[0.25em] text-bark/70">
        Casting…
      </span>
    </main>
  );
}

function transitFooter(sky: SkyState, natal: NatalChart): string {
  const t = computeTransits(sky, natal);
  return [...t.activeTransits, ...t.significantWindows].join(" · ") || "—";
}

async function fetchReading(
  sky: SkyState,
  natal: NatalChart,
  voice: BirthDetails["voice"],
  question: string | undefined,
  recentJournal: string | undefined,
): Promise<
  | { status: "ok"; data: ReadingResponse }
  | { status: "error"; error: string }
> {
  try {
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sky, natal, voice, question, recentJournal }),
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

async function fetchWeekly(
  startISO: string,
  natal: NatalChart,
  voice: BirthDetails["voice"],
): Promise<
  | { status: "ok"; data: WeeklyResponse }
  | { status: "error"; error: string }
> {
  try {
    const res = await fetch("/api/weekly", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ startISO, natal, voice }),
    });
    if (!res.ok) {
      const body = await safeJson(res);
      return {
        status: "error",
        error: body?.error ?? `Server responded ${res.status}`,
      };
    }
    const data = (await res.json()) as WeeklyResponse;
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
