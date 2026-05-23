import type { VoiceKey } from "@/lib/voices";

/*
  Birth details + voice preference. Stored in localStorage for
  unauthenticated users; mirrored into Supabase when a user signs up.
  Date/time are kept as plain ISO strings so they survive JSON round
  trips intact (no timezone surprises from new Date()).
*/

export interface BirthDetails {
  /** ISO date, YYYY-MM-DD, in the user's birth city local calendar. */
  date: string;
  /** Optional ISO time, HH:MM, local to the birth city. Required for rising sign. */
  time?: string;
  /** Free-text city name as the user typed it. */
  city?: string;
  /** Geographic latitude in degrees (north positive). */
  lat?: number;
  /** Geographic longitude in degrees (east positive). */
  lng?: number;
  /** Oracle voice preference. */
  voice: VoiceKey;
  /** Hemisphere — used by the almanac. Defaults to 'N'. */
  hemisphere?: "N" | "S";
  /** Practice intentions selected at onboarding. Drives the daily practice generator. */
  intentions?: string[];
}

const STORAGE_KEY = "witchlife.birth";

export function loadBirth(): BirthDetails | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BirthDetails;
    if (!parsed.date || !parsed.voice) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBirth(b: BirthDetails): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

export function clearBirth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Convert stored birth details into a UTC Date for the astro engine.
 * If `time` is missing we default to 12:00 local — the natal positions
 * are still correct (planets move slowly within a day) but rising sign
 * cannot be trusted, so callers should null out rising in that case.
 */
export function birthToUtcDate(b: BirthDetails): Date {
  const [y, m, d] = b.date.split("-").map(Number);
  const [hh, mm] = (b.time ?? "12:00").split(":").map(Number);
  // The user typed local birth time. Without a precise timezone for the
  // birth location we approximate with UTC + (lng / 15) offset, which is
  // accurate to within ~1 hour of true local mean time. Good enough for
  // sign-level natal placements; rising sign assumes lng is set.
  const lngOffsetMs =
    b.lng != null ? Math.round((b.lng / 15) * 3_600_000) : 0;
  const utcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 12, mm ?? 0, 0) - lngOffsetMs;
  return new Date(utcMs);
}
