import {
  getSkyState,
  isInEclipseSeason,
  type SkyState,
} from "@/lib/astro";

/*
  Sky alerts — surface the loud days. We compute a small list of
  human-readable notes from today's SkyState. Used by the banner at
  the top of the Leaf when the 'sky-alerts' feature flag is on.

  Kept pure (takes a SkyState, returns notes) so it's trivially
  testable and so callers can pin a date for screenshots.
*/

export interface SkyAlert {
  /** Stable identifier — used as React key and for analytics. */
  id: string;
  /** Short title shown bold. */
  title: string;
  /** One sentence of context, kept practical. */
  detail: string;
  /** "loud" => render with the vermilion accent; "quiet" => muted. */
  intensity: "loud" | "quiet";
}

export function computeSkyAlerts(sky: SkyState, date: Date = new Date()): SkyAlert[] {
  const out: SkyAlert[] = [];

  // Lunar events — phase rounds to a window.
  if (sky.moon.daysToNewMoon < 1.0 && sky.moon.daysToFullMoon > 5) {
    out.push({
      id: "new-moon",
      title: `New moon in ${sky.moon.sign}`,
      detail:
        "A small starting practice tonight will travel further than usual. One sentence written, one candle lit.",
      intensity: "loud",
    });
  } else if (sky.moon.daysToFullMoon < 1.0) {
    out.push({
      id: "full-moon",
      title: `Full moon in ${sky.moon.sign}`,
      detail:
        "Bright sky. Best for releasing — what you finish tonight stays finished.",
      intensity: "loud",
    });
  } else if (sky.moon.phaseName === "Waning Crescent" && sky.moon.daysToNewMoon < 3) {
    out.push({
      id: "dark-moon",
      title: "Dark moon approaching",
      detail:
        "Three days of soft light. Tend, rest, listen — no big starts until the new moon.",
      intensity: "quiet",
    });
  }

  // Mercury retrograde.
  if (sky.planets.mercury.retrograde) {
    out.push({
      id: "mercury-retro",
      title: "Mercury retrograde",
      detail:
        "Re-read before you reply. Save twice. Speak slowly. The practice is rehearsal, not performance.",
      intensity: "loud",
    });
  }

  // Eclipse season.
  if (isInEclipseSeason(date)) {
    out.push({
      id: "eclipse-season",
      title: "Eclipse season",
      detail:
        "Disturbance is allowed to be useful. Keep the practice short and the journal close.",
      intensity: "loud",
    });
  }

  // Seasonal threshold — first day of a season carries a small note.
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const thresholds: Record<string, number> = {
    "Spring equinox": 80, // 21 Mar
    "Summer solstice": 172, // 21 Jun
    "Autumn equinox": 266, // 23 Sep
    "Winter solstice": 355, // 21 Dec
  };
  for (const [name, doy] of Object.entries(thresholds)) {
    if (Math.abs(dayOfYear - doy) < 1) {
      out.push({
        id: `season-${name.replace(/\s+/g, "-").toLowerCase()}`,
        title: name,
        detail: "A hinge in the year. Light a candle for the door you just stepped through.",
        intensity: "quiet",
      });
    }
  }

  return out;
}

/**
 * Convenience wrapper for callers that just want today's alerts.
 */
export function todaySkyAlerts(): SkyAlert[] {
  const now = new Date();
  return computeSkyAlerts(getSkyState(now), now);
}
