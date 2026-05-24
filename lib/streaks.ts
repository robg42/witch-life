import { supabaseAdmin } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/*
  Practice streaks. The streak counts how many consecutive days, ending
  today or yesterday, the user has marked a practice complete.

  Why "today or yesterday": if today is Tuesday and the user last
  practised Monday, they're still on a streak — they just haven't
  practised yet today. If they didn't practise yesterday, the streak
  is broken.

  Computation runs server-side so the streak is trustworthy (the
  practices table is the source of truth). We fetch the last 60 days
  of distinct practice dates and walk the gap-free run from the most
  recent date back.
*/

if (typeof window !== "undefined") {
  throw new Error("lib/streaks must not be imported in client code");
}

export interface StreakSummary {
  /** Consecutive days ending today or yesterday. 0 if the streak is broken. */
  current: number;
  /** Longest streak observed in the lookback window. */
  longest: number;
  /** Total practice days in the lookback window. */
  totalInWindow: number;
  /** Lookback days used to compute the above. */
  windowDays: number;
}

interface PracticeDateRow {
  practice_date: string;
}

/**
 * Compute the streak summary for the current Clerk-authenticated user.
 * Returns null if unauthenticated. Returns zeros if no practices yet.
 */
export async function getStreakSummary(
  windowDays = 60,
): Promise<StreakSummary | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const sb = supabaseAdmin();
  const { data: userRow } = await sb
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!userRow) return null;

  const sinceISO = new Date(Date.now() - windowDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data: rows } = await sb
    .from("practices")
    .select("practice_date")
    .eq("user_id", (userRow as { id: string }).id)
    .gte("practice_date", sinceISO)
    .order("practice_date", { ascending: false });

  const dates = new Set(
    ((rows ?? []) as PracticeDateRow[]).map((r) => r.practice_date),
  );

  return summariseStreaks(dates, new Date(), windowDays);
}

/**
 * Pure function — extracted so tests can pin a "today" without
 * mocking the system clock. Pass the practice-date set and the
 * effective date to compute against.
 */
export function summariseStreaks(
  dates: Set<string>,
  today: Date,
  windowDays: number,
): StreakSummary {
  const todayISO = isoDate(today);
  const yesterdayISO = isoDate(addDays(today, -1));

  let current = 0;
  let cursor: Date;
  if (dates.has(todayISO)) {
    cursor = today;
  } else if (dates.has(yesterdayISO)) {
    cursor = addDays(today, -1);
  } else {
    // No practice today or yesterday — streak is broken.
    return finishSummary(0, dates, windowDays);
  }

  while (dates.has(isoDate(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return finishSummary(current, dates, windowDays);
}

function finishSummary(
  current: number,
  dates: Set<string>,
  windowDays: number,
): StreakSummary {
  // Walk the full set to find the longest run.
  const sorted = Array.from(dates).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const current = new Date(d);
    if (prev && Math.round((current.getTime() - prev.getTime()) / 86_400_000) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = current;
  }
  return {
    current,
    longest: Math.max(longest, current),
    totalInWindow: dates.size,
    windowDays,
  };
}

function isoDate(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
