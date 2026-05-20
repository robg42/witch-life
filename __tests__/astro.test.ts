import { describe, expect, it } from "vitest";
import {
  ascendantLongitude,
  computeNatalChart,
  computeTransits,
  getSkyState,
  julianDay,
  longitudeToDegreeInSign,
  longitudeToSign,
  moonPhaseFraction,
  moonPhaseName,
} from "@/lib/astro";

/*
  Tests verify sign placement and lunar phase against well-known events.
  Tolerance is generous on degrees but tight on sign: the engine is for
  reading energy, not navigating spacecraft. We assert sign correctness
  always; degree within ~1.5°, phase fraction within ~0.01.
*/

describe("julianDay", () => {
  it("returns 2451545.0 for the J2000 epoch (2000-01-01T12:00 UTC)", () => {
    const jd = julianDay(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(jd).toBeCloseTo(2451545.0, 4);
  });

  it("returns 2451544.5 for 2000-01-01T00:00 UTC (the calendar-day boundary)", () => {
    const jd = julianDay(new Date(Date.UTC(2000, 0, 1, 0, 0, 0)));
    expect(jd).toBeCloseTo(2451544.5, 4);
  });

  it("returns 2459580.5 for 2022-01-01T00:00 UTC", () => {
    const jd = julianDay(new Date(Date.UTC(2022, 0, 1, 0, 0, 0)));
    expect(jd).toBeCloseTo(2459580.5, 4);
  });
});

describe("sign helpers", () => {
  it("maps 0° to Aries and the start of each subsequent sign", () => {
    expect(longitudeToSign(0)).toBe("Aries");
    expect(longitudeToSign(30)).toBe("Taurus");
    expect(longitudeToSign(60)).toBe("Gemini");
    expect(longitudeToSign(90)).toBe("Cancer");
    expect(longitudeToSign(330)).toBe("Pisces");
    expect(longitudeToSign(359.9)).toBe("Pisces");
  });

  it("normalises negative longitudes", () => {
    expect(longitudeToSign(-1)).toBe("Pisces");
  });

  it("returns degree within sign", () => {
    expect(longitudeToDegreeInSign(35)).toBeCloseTo(5, 6);
    expect(longitudeToDegreeInSign(0)).toBeCloseTo(0, 6);
    expect(longitudeToDegreeInSign(359.5)).toBeCloseTo(29.5, 6);
  });
});

describe("Sun position", () => {
  it("places the Sun in Aries near the vernal equinox (2024-03-20 03:06 UTC)", () => {
    const sky = getSkyState(new Date(Date.UTC(2024, 2, 20, 4, 0, 0)));
    expect(sky.sun.sign).toBe("Aries");
    expect(sky.sun.degree).toBeLessThan(2);
  });

  it("places the Sun in Cancer at the summer solstice (2024-06-21)", () => {
    const sky = getSkyState(new Date(Date.UTC(2024, 5, 21, 12, 0, 0)));
    expect(sky.sun.sign).toBe("Cancer");
    expect(sky.sun.degree).toBeLessThan(2);
  });

  it("places the Sun in Capricorn at the winter solstice (2024-12-21)", () => {
    const sky = getSkyState(new Date(Date.UTC(2024, 11, 21, 12, 0, 0)));
    expect(sky.sun.sign).toBe("Capricorn");
    expect(sky.sun.degree).toBeLessThan(2);
  });

  it("places the Sun in late Taurus on 2026-05-20", () => {
    const sky = getSkyState(new Date(Date.UTC(2026, 4, 20, 12, 0, 0)));
    expect(sky.sun.sign).toBe("Taurus");
    // Sun enters Gemini around May 21 — should be 28-29° Taurus.
    expect(sky.sun.degree).toBeGreaterThan(27);
  });
});

describe("Moon phase", () => {
  it("identifies the 2024-01-11 11:57 UTC new moon", () => {
    const jd = julianDay(new Date(Date.UTC(2024, 0, 11, 11, 57, 0)));
    const phase = moonPhaseFraction(jd);
    // Phase should be very near 0 or very near 1 — both denote new moon.
    const distance = Math.min(phase, 1 - phase);
    expect(distance).toBeLessThan(0.01);
    expect(moonPhaseName(phase)).toBe("New");
  });

  it("identifies the 2024-01-25 17:54 UTC full moon", () => {
    const jd = julianDay(new Date(Date.UTC(2024, 0, 25, 17, 54, 0)));
    const phase = moonPhaseFraction(jd);
    expect(Math.abs(phase - 0.5)).toBeLessThan(0.01);
    expect(moonPhaseName(phase)).toBe("Full");
  });

  it("identifies the 2024-08-04 11:13 UTC new moon", () => {
    const jd = julianDay(new Date(Date.UTC(2024, 7, 4, 11, 13, 0)));
    const phase = moonPhaseFraction(jd);
    const distance = Math.min(phase, 1 - phase);
    expect(distance).toBeLessThan(0.01);
  });

  it("walks daysToNewMoon forward to a sensible value", () => {
    // Right after the 2024-08-04 new moon, the next new moon is ~29.5 days away.
    const sky = getSkyState(new Date(Date.UTC(2024, 7, 5, 0, 0, 0)));
    expect(sky.moon.daysToNewMoon).toBeGreaterThan(27);
    expect(sky.moon.daysToNewMoon).toBeLessThan(31);
  });

  it("walks daysToFullMoon forward to a sensible value", () => {
    // 2024-08-04 new → next full ~14.7 days later.
    const sky = getSkyState(new Date(Date.UTC(2024, 7, 5, 0, 0, 0)));
    expect(sky.moon.daysToFullMoon).toBeGreaterThan(13);
    expect(sky.moon.daysToFullMoon).toBeLessThan(17);
  });
});

describe("Mercury retrograde", () => {
  it("flags Mercury as retrograde during the 2024-04-01 → 2024-04-25 window", () => {
    const sky = getSkyState(new Date(Date.UTC(2024, 3, 10, 12, 0, 0)));
    expect(sky.planets.mercury.retrograde).toBe(true);
  });

  it("does NOT flag Mercury as retrograde well outside any window", () => {
    // 2024-02-15 is direct and well past the post-shadow of the prior Dec retrograde.
    const sky = getSkyState(new Date(Date.UTC(2024, 1, 15, 12, 0, 0)));
    expect(sky.planets.mercury.retrograde).toBe(false);
  });

  it("flags Mercury as retrograde during the 2024-08-05 → 2024-08-28 window", () => {
    const sky = getSkyState(new Date(Date.UTC(2024, 7, 15, 12, 0, 0)));
    expect(sky.planets.mercury.retrograde).toBe(true);
  });
});

describe("Ascendant", () => {
  it("returns null inside the Arctic Circle", () => {
    expect(
      ascendantLongitude(julianDay(new Date(Date.UTC(2024, 5, 21, 12))), 80, 0),
    ).toBeNull();
  });

  it("returns a valid number for a mid-latitude moment", () => {
    const jd = julianDay(new Date(Date.UTC(2024, 5, 21, 12, 0, 0)));
    const asc = ascendantLongitude(jd, 51.5, -0.13); // London, summer solstice noon
    expect(asc).not.toBeNull();
    expect(asc).toBeGreaterThanOrEqual(0);
    expect(asc).toBeLessThan(360);
  });
});

describe("Natal chart and transits", () => {
  it("produces a complete natal chart with rising when lat/lng are given", () => {
    const chart = computeNatalChart({
      date: new Date(Date.UTC(1990, 5, 15, 14, 30, 0)),
      lat: 40.7,
      lng: -74,
    });
    expect(chart.sun).toBeDefined();
    expect(chart.moon).toBeDefined();
    expect(chart.rising).not.toBeNull();
  });

  it("returns null rising when lat/lng are omitted", () => {
    const chart = computeNatalChart({
      date: new Date(Date.UTC(1990, 5, 15, 14, 30, 0)),
    });
    expect(chart.rising).toBeNull();
  });

  it("flags a transit when today's Moon matches the natal Sun", () => {
    const natal = computeNatalChart({
      date: new Date(Date.UTC(1990, 5, 15, 14, 30, 0)),
    });
    // Find a recent date where the moon is in the same sign as natal Sun.
    const start = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    for (let i = 0; i < 30; i++) {
      const d = new Date(start.getTime() + i * 86_400_000);
      const sky = getSkyState(d);
      if (sky.moon.sign === natal.sun) {
        const report = computeTransits(sky, natal);
        expect(
          report.activeTransits.some((t) => t.includes("natal Sun")),
        ).toBe(true);
        return;
      }
    }
    throw new Error(
      "Expected at least one day in January 2024 with Moon in natal Sun's sign",
    );
  });
});
