import { describe, expect, it } from "vitest";
import { DECK, cardByName, dailyCard, randomCard } from "@/lib/deck";

describe("deck composition", () => {
  it("contains exactly 28 unique cards across four suits", () => {
    expect(DECK.length).toBe(28);
    const names = new Set(DECK.map((c) => c.name));
    expect(names.size).toBe(28);
    const suits = new Set(DECK.map((c) => c.suit));
    expect(suits).toEqual(new Set(["Root", "Tide", "Blade", "Ember"]));
  });

  it("has exactly seven cards in each suit", () => {
    for (const suit of ["Root", "Tide", "Blade", "Ember"] as const) {
      expect(DECK.filter((c) => c.suit === suit).length).toBe(7);
    }
  });
});

describe("dailyCard", () => {
  it("is deterministic — the same date always returns the same card", () => {
    const d = new Date(Date.UTC(2026, 4, 20, 12, 0, 0));
    const a = dailyCard(d);
    const b = dailyCard(d);
    expect(a.name).toBe(b.name);
  });

  it("draws different cards across adjacent days (at least for one neighbour)", () => {
    const today = new Date(Date.UTC(2026, 4, 20, 12, 0, 0));
    const tomorrow = new Date(today.getTime() + 86_400_000);
    expect(dailyCard(today).name).not.toBe(dailyCard(tomorrow).name);
  });

  it("walks through the whole deck over 28 consecutive days", () => {
    const base = new Date(Date.UTC(2026, 4, 1, 12, 0, 0));
    const names = new Set<string>();
    for (let i = 0; i < 28; i++) {
      names.add(dailyCard(new Date(base.getTime() + i * 86_400_000)).name);
    }
    expect(names.size).toBe(28);
  });
});

describe("randomCard", () => {
  it("returns a card from the deck", () => {
    for (let i = 0; i < 20; i++) {
      const c = randomCard();
      expect(cardByName(c.name)).toBeDefined();
    }
  });
});
