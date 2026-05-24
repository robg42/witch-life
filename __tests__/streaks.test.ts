import { describe, expect, it } from "vitest";
import { summariseStreaks } from "@/lib/streaks";

/*
  Pure-function tests for the streak summariser. The DB-fetching
  wrapper (getStreakSummary) is integration-only; the maths lives
  here and gets full coverage.
*/

function dates(...ds: string[]): Set<string> {
  return new Set(ds);
}

describe("summariseStreaks", () => {
  const today = new Date("2026-05-23T10:00:00Z");

  it("returns zeros when nothing has been practised", () => {
    const s = summariseStreaks(dates(), today, 60);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(0);
    expect(s.totalInWindow).toBe(0);
  });

  it("counts a one-day streak when only today is logged", () => {
    const s = summariseStreaks(dates("2026-05-23"), today, 60);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
    expect(s.totalInWindow).toBe(1);
  });

  it("counts a five-day streak ending today", () => {
    const s = summariseStreaks(
      dates(
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-23",
      ),
      today,
      60,
    );
    expect(s.current).toBe(5);
    expect(s.longest).toBe(5);
  });

  it("counts the streak when today is missing but yesterday is not", () => {
    const s = summariseStreaks(
      dates("2026-05-20", "2026-05-21", "2026-05-22"),
      today,
      60,
    );
    expect(s.current).toBe(3);
  });

  it("breaks the streak when both today and yesterday are missing", () => {
    const s = summariseStreaks(
      dates("2026-05-19", "2026-05-20"),
      today,
      60,
    );
    expect(s.current).toBe(0);
    // ...but longest still reflects the historical run
    expect(s.longest).toBe(2);
  });

  it("longest tracks the biggest gap-free run in the window", () => {
    const s = summariseStreaks(
      dates(
        "2026-05-01",
        "2026-05-02",
        "2026-05-03",
        "2026-05-04", // 4-day run
        // gap
        "2026-05-10",
        "2026-05-11", // 2-day run
        // gap
        "2026-05-22",
        "2026-05-23", // current 2-day
      ),
      today,
      60,
    );
    expect(s.current).toBe(2);
    expect(s.longest).toBe(4);
  });

  it("tolerates out-of-order date input", () => {
    const s = summariseStreaks(
      dates("2026-05-22", "2026-05-23", "2026-05-20", "2026-05-21"),
      today,
      60,
    );
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });
});
