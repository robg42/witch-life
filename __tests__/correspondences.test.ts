import { describe, expect, it } from "vitest";
import {
  CORRESPONDENCES,
  PREVIEW_CORRESPONDENCES,
  correspondenceById,
  correspondencesByType,
  correspondencesForIntention,
} from "@/lib/correspondences";
import { INTENTIONS } from "@/lib/intentions";

describe("Correspondences", () => {
  it("ships at least 40 entries", () => {
    expect(CORRESPONDENCES.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = new Set(CORRESPONDENCES.map((c) => c.id));
    expect(ids.size).toBe(CORRESPONDENCES.length);
  });

  it("looks up by id", () => {
    expect(correspondenceById("rosemary")?.name).toBe("Rosemary");
    expect(correspondenceById("nope")).toBeUndefined();
  });

  it("filters by type", () => {
    expect(correspondencesByType("herb").length).toBeGreaterThan(10);
    expect(correspondencesByType("element")).toHaveLength(4);
    expect(correspondencesByType("phase")).toHaveLength(4);
  });

  it("every entry maps to at least one valid intention", () => {
    const validKeys = new Set(INTENTIONS.map((i) => i.key));
    for (const c of CORRESPONDENCES) {
      expect(c.bestFor.length).toBeGreaterThan(0);
      for (const k of c.bestFor) {
        expect(validKeys.has(k)).toBe(true);
      }
    }
  });

  it("every intention has at least one correspondence", () => {
    for (const i of INTENTIONS) {
      const found = correspondencesForIntention(i.key);
      expect(found.length).toBeGreaterThan(0);
    }
  });

  it("preview holds six entries", () => {
    expect(PREVIEW_CORRESPONDENCES).toHaveLength(6);
  });
});
