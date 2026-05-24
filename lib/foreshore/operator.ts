/*
  Operator preferences — Foreshore-specific bits stored on the client
  alongside the existing BirthDetails. We keep them separate so the
  broadsheet at /leaf can continue to ignore them.

  Stored:
    - callsign       (display name; falls back to first portion of email)
    - phosphor       (CRT colour: 'amber' | 'green')
    - sound          (whether the console plays Web Audio cues)
    - dialChannel    (last-tuned channel, for ambient memory)
*/

export type Phosphor = "amber" | "green";

export interface OperatorPrefs {
  callsign?: string;
  phosphor?: Phosphor;
  sound?: boolean;
  dialChannel?: number;
}

const KEY = "foreshore.operator";

export function loadOperator(): OperatorPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OperatorPrefs;
  } catch {
    return {};
  }
}

export function saveOperator(prefs: OperatorPrefs): void {
  if (typeof window === "undefined") return;
  const current = loadOperator();
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...current, ...prefs }),
  );
}

export function clearOperator(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/**
 * Default phosphor colour. Amber feels intimate, green feels colder
 * and more technical — we default to amber because most operators
 * arrive without a preference and amber is the gentler debut.
 */
export const DEFAULT_PHOSPHOR: Phosphor = "amber";
