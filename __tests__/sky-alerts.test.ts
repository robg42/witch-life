import { describe, expect, it } from "vitest";
import { computeSkyAlerts } from "@/lib/sky-alerts";
import type { SkyState } from "@/lib/astro";

/*
  computeSkyAlerts is pure — given a SkyState it produces a stable
  list of alert objects. Tests build small synthetic SkyStates rather
  than hitting the real Meeus engine, so the assertions don't drift
  when the underlying ephemeris is improved.
*/

function makeSky(overrides: Partial<SkyState> = {}): SkyState {
  const base: SkyState = {
    date: new Date("2026-05-23T12:00:00Z"),
    julianDay: 0,
    moon: {
      phase: 0.25,
      phaseName: "Waxing Crescent",
      phaseSymbol: "🌒",
      sign: "Cancer",
      daysToNewMoon: 14,
      daysToFullMoon: 7,
      cycleDay: 8,
    },
    sun: { sign: "Gemini", degree: 0, longitude: 0 },
    planets: {
      mercury: {
        sign: "Gemini",
        degree: 0,
        longitude: 0,
        retrograde: false,
        shadowPeriod: false,
      },
      venus: { sign: "Taurus", degree: 0, longitude: 0 },
      mars: { sign: "Leo", degree: 0, longitude: 0 },
      jupiter: { sign: "Cancer", degree: 0, longitude: 0 },
      saturn: { sign: "Pisces", degree: 0, longitude: 0 },
    },
    season: "spring",
  } as unknown as SkyState;
  return { ...base, ...overrides } as SkyState;
}

describe("computeSkyAlerts", () => {
  it("yields no alerts on an ordinary day", () => {
    const sky = makeSky();
    const alerts = computeSkyAlerts(sky, new Date("2026-05-23T12:00:00Z"));
    expect(alerts).toEqual([]);
  });

  it("surfaces a new-moon alert when the new moon is imminent", () => {
    const sky = makeSky({
      moon: {
        ...makeSky().moon,
        sign: "Taurus",
        phaseName: "New Moon",
        daysToNewMoon: 0.3,
        daysToFullMoon: 14,
      },
    });
    const alerts = computeSkyAlerts(sky, new Date("2026-05-23T12:00:00Z"));
    expect(alerts.find((a) => a.id === "new-moon")).toBeTruthy();
    expect(alerts.find((a) => a.id === "new-moon")?.title).toContain("Taurus");
  });

  it("surfaces a full-moon alert when the full moon is imminent", () => {
    const sky = makeSky({
      moon: {
        ...makeSky().moon,
        sign: "Scorpio",
        phaseName: "Full Moon",
        daysToNewMoon: 14,
        daysToFullMoon: 0.5,
      },
    });
    const alerts = computeSkyAlerts(sky, new Date("2026-05-23T12:00:00Z"));
    expect(alerts.find((a) => a.id === "full-moon")).toBeTruthy();
  });

  it("flags Mercury retrograde", () => {
    const sky = makeSky({
      planets: {
        ...makeSky().planets,
        mercury: {
          sign: "Gemini",
          degree: 0,
          longitude: 0,
          retrograde: true,
          shadowPeriod: false,
        },
      },
    });
    const alerts = computeSkyAlerts(sky, new Date("2026-05-23T12:00:00Z"));
    expect(alerts.find((a) => a.id === "mercury-retro")).toBeTruthy();
  });

  it("emits a seasonal alert on the equinox", () => {
    const sky = makeSky();
    // 21 March is the spring equinox threshold (day-of-year ≈ 80).
    const alerts = computeSkyAlerts(sky, new Date("2026-03-21T12:00:00Z"));
    expect(alerts.find((a) => a.id.startsWith("season-"))).toBeTruthy();
  });
});
