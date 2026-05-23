import { describe, expect, it } from "vitest";
import {
  SABBATS,
  sabbatByKey,
  sabbatDate,
  upcomingSabbat,
  inSabbatWindow,
} from "@/lib/sabbats";

describe("Sabbats", () => {
  it("has all eight wheel-of-the-year events", () => {
    expect(SABBATS).toHaveLength(8);
    const keys = SABBATS.map((s) => s.key);
    expect(keys).toEqual([
      "imbolc",
      "ostara",
      "beltane",
      "litha",
      "lammas",
      "mabon",
      "samhain",
      "yule",
    ]);
  });

  it("looks up by key", () => {
    expect(sabbatByKey("beltane")?.name).toBe("Beltane");
    expect(sabbatByKey("nope")).toBeUndefined();
  });

  it("computes northern hemisphere dates correctly", () => {
    const beltane = sabbatByKey("beltane")!;
    expect(sabbatDate(beltane, 2026, "N").toISOString()).toBe(
      "2026-05-01T00:00:00.000Z",
    );
  });

  it("computes southern hemisphere dates six months apart", () => {
    const beltane = sabbatByKey("beltane")!;
    expect(sabbatDate(beltane, 2026, "S").toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });

  it("finds the next upcoming sabbat", () => {
    // 22 May 2026 — Beltane just passed, Litha next.
    const now = new Date("2026-05-22T00:00:00Z");
    const result = upcomingSabbat(now, "N");
    expect(result.sabbat.key).toBe("litha");
    expect(result.daysUntil).toBeGreaterThan(20);
    expect(result.daysUntil).toBeLessThan(40);
  });

  it("detects sabbat window", () => {
    // 30 Oct 2026 — Samhain on 31 Oct, so we're in the window.
    const inside = inSabbatWindow(new Date("2026-10-30T00:00:00Z"), "N");
    expect(inside?.key).toBe("samhain");

    // 15 Aug 2026 — not in any window.
    const outside = inSabbatWindow(new Date("2026-08-15T00:00:00Z"), "N");
    expect(outside).toBeNull();
  });

  it("every sabbat has content + reflection prompts + correspondences", () => {
    for (const s of SABBATS) {
      expect(s.traditionalMeaning.length).toBeGreaterThan(100);
      expect(s.homePractice.length).toBeGreaterThan(100);
      expect(s.reflectionPrompts.length).toBeGreaterThanOrEqual(3);
      expect(s.correspondenceIds.length).toBeGreaterThanOrEqual(2);
    }
  });
});
