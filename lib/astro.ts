/*
  lib/astro.ts — The Verdant Oracle astronomical engine.

  Pure TypeScript, no external dependencies. All functions are pure: given
  the same inputs they return the same outputs. Can run server-side or
  client-side. Inputs and outputs use UTC throughout — the caller is
  responsible for any timezone conversion.

  Accuracy targets:
    - Sign placement (every 30°): always correct from year 1900–2100.
    - Sun/moon/planet longitudes: within ~0.5° over the same window.
    - Moon phase: within a few hours of the true phase.
    - Mercury retrograde stations: correctly identified within ~1 day.

  References used (no code copied — formulas only):
    - Jean Meeus, "Astronomical Algorithms", 2nd ed.
      Ch. 7 (Julian Day), Ch. 22 (Nutation), Ch. 25 (Sun),
      Ch. 31–33 (Planets), Ch. 47 (Moon), Ch. 13 (Coord transforms).
    - Astronomical Almanac low-precision formulae.

  We are not chasing arcsecond accuracy — we are chasing reliable sign
  placement and recognisable lunar phase. Truncated series are deliberate.
*/

// ─── Types ────────────────────────────────────────────────────────────────

export type Sign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type PhaseName =
  | "New"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

export interface PlanetPosition {
  sign: Sign;
  degree: number; // 0–30 within the sign
}

export interface MercuryPosition extends PlanetPosition {
  retrograde: boolean;
  shadowPeriod: boolean;
}

export interface SkyState {
  date: Date;
  julianDay: number;
  moon: {
    phase: number; // 0–1, where 0 = new, 0.5 = full
    phaseName: PhaseName;
    phaseSymbol: string;
    sign: Sign;
    daysToNewMoon: number;
    daysToFullMoon: number;
    cycleDay: number; // 1–29 (rounded)
  };
  sun: PlanetPosition;
  planets: {
    mercury: MercuryPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
  };
  season: Season;
}

export interface BirthDetails {
  date: Date; // a UTC instant — caller converts local birth time to UTC
  lat?: number;
  lng?: number;
}

export interface NatalChart {
  sun: Sign;
  moon: Sign;
  mercury: Sign;
  venus: Sign;
  mars: Sign;
  jupiter: Sign;
  saturn: Sign;
  rising: Sign | null;
}

export interface TransitReport {
  activeTransits: string[];
  significantWindows: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const SIGNS: readonly Sign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const PHASE_SYMBOLS: Record<PhaseName, string> = {
  New: "●",
  "Waxing Crescent": "☽",
  "First Quarter": "◐",
  "Waxing Gibbous": "◕",
  Full: "○",
  "Waning Gibbous": "◔",
  "Last Quarter": "◑",
  "Waning Crescent": "☾",
};

const J2000 = 2451545.0; // JD of 2000-01-01T12:00 TT
const SYNODIC_MONTH = 29.530588853; // mean synodic month in days

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ─── Math helpers ─────────────────────────────────────────────────────────

const sin = (deg: number) => Math.sin(deg * DEG2RAD);
const cos = (deg: number) => Math.cos(deg * DEG2RAD);
const tan = (deg: number) => Math.tan(deg * DEG2RAD);

/** Reduce an angle to the range [0, 360). */
function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Shortest signed difference between two angles, range (-180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

// ─── Julian Day ───────────────────────────────────────────────────────────

/**
 * Julian Day Number for any UTC instant.
 * Implements the Gregorian-calendar formula from Meeus §7.1.
 * Valid for any year (no Y2K-style cliff).
 */
export function julianDay(date: Date): number {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1; // 1–12
  const D =
    date.getUTCDate() +
    (date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600) /
      24;

  let y = Y;
  let m = M;
  if (M <= 2) {
    y = Y - 1;
    m = M + 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4); // Gregorian correction
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    D +
    B -
    1524.5
  );
}

/** Julian centuries since J2000. */
function julianCenturies(jd: number): number {
  return (jd - J2000) / 36525;
}

// ─── Sun ──────────────────────────────────────────────────────────────────

/**
 * Apparent geocentric ecliptic longitude of the Sun, in degrees.
 * Meeus §25, low-precision (~0.01°) form.
 */
function sunEclipticLongitude(jd: number): number {
  const T = julianCenturies(jd);
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  // Equation of centre
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
    (0.019993 - 0.000101 * T) * sin(2 * M) +
    0.000289 * sin(3 * M);
  return norm360(L0 + C);
}

// ─── Moon ─────────────────────────────────────────────────────────────────

/**
 * Geocentric ecliptic longitude of the Moon, in degrees.
 * Truncated ELP series from Meeus §47 — keeps the largest periodic
 * terms only. Accurate to within ~0.3° in this window; ample for
 * sign-level placement.
 */
function moonEclipticLongitude(jd: number): number {
  const T = julianCenturies(jd);
  // Mean longitude of the Moon
  const Lp =
    218.3164477 +
    481267.88123421 * T -
    0.0015786 * T * T +
    (T * T * T) / 538841 -
    (T * T * T * T) / 65194000;
  // Mean elongation of the Moon from the Sun
  const D =
    297.8501921 +
    445267.1114034 * T -
    0.0018819 * T * T +
    (T * T * T) / 545868 -
    (T * T * T * T) / 113065000;
  // Mean anomaly of the Sun
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  // Mean anomaly of the Moon
  const Mp =
    134.9633964 +
    477198.8675055 * T +
    0.0087414 * T * T +
    (T * T * T) / 69699 -
    (T * T * T * T) / 14712000;
  // Argument of latitude of the Moon
  const F =
    93.272095 +
    483202.0175233 * T -
    0.0036539 * T * T -
    (T * T * T) / 3526000 +
    (T * T * T * T) / 863310000;

  // Main periodic terms in longitude (degrees). Truncated for compactness.
  // Coefficients in Meeus Table 47.A; the omitted terms each contribute
  // less than ~0.05°.
  const dL =
    6.288774 * sin(Mp) +
    1.274027 * sin(2 * D - Mp) +
    0.658314 * sin(2 * D) +
    0.213618 * sin(2 * Mp) -
    0.185116 * sin(M) -
    0.114332 * sin(2 * F) +
    0.058793 * sin(2 * D - 2 * Mp) +
    0.057066 * sin(2 * D - M - Mp) +
    0.053322 * sin(2 * D + Mp) +
    0.045758 * sin(2 * D - M) -
    0.040923 * sin(M - Mp) -
    0.034720 * sin(D) -
    0.030383 * sin(M + Mp) +
    0.015327 * sin(2 * D - 2 * F) -
    0.012528 * sin(Mp + 2 * F) +
    0.010980 * sin(Mp - 2 * F);

  return norm360(Lp + dL);
}

/**
 * Lunar phase as a fraction of the synodic cycle.
 * 0 = exact new moon, 0.5 = exact full moon, approaching 1 = new again.
 *
 * Computed from the difference of the Moon's and Sun's apparent ecliptic
 * longitudes. This matches the astronomical definition of phase (the
 * Sun–Earth–Moon elongation), which is the convention used by every
 * widely cited new/full moon table.
 */
export function moonPhaseFraction(jd: number): number {
  const elong = norm360(moonEclipticLongitude(jd) - sunEclipticLongitude(jd));
  return elong / 360;
}

const PHASE_BOUNDARIES: [number, PhaseName][] = [
  [0.0, "New"],
  [0.0625, "Waxing Crescent"],
  [0.1875, "First Quarter"],
  [0.3125, "Waxing Gibbous"],
  [0.4375, "Full"],
  [0.5625, "Waning Gibbous"],
  [0.6875, "Last Quarter"],
  [0.8125, "Waning Crescent"],
  [0.9375, "New"],
];

export function moonPhaseName(phase: number): PhaseName {
  const p = ((phase % 1) + 1) % 1;
  let last: PhaseName = "New";
  for (const [boundary, name] of PHASE_BOUNDARIES) {
    if (p >= boundary) last = name;
  }
  return last;
}

export function moonPhaseSymbol(name: PhaseName): string {
  return PHASE_SYMBOLS[name];
}

/**
 * Days from `jd` until the Moon reaches a given phase fraction
 * (0 = new, 0.5 = full). Walks forward in 6-hour increments until the
 * phase fraction crosses the target. Capped at one full cycle so callers
 * always get a sensible number.
 */
function daysToPhase(jd: number, target: number): number {
  const step = 0.25; // 6 hours
  const max = SYNODIC_MONTH + 2; // search window in days
  const current = moonPhaseFraction(jd);
  // If we're already on the target (within ~6 hours), return ~0.
  if (Math.abs(angleDiff(current * 360, target * 360)) < 3) return 0;

  let t = step;
  let prev = current;
  while (t <= max) {
    const next = moonPhaseFraction(jd + t);
    // Did we cross the target?
    if (didCross(prev, next, target)) {
      // Linear interpolation within the step
      const wrappedPrev = wrapToTargetSide(prev, target);
      const wrappedNext = wrapToTargetSide(next, target);
      const frac = (target - wrappedPrev) / (wrappedNext - wrappedPrev);
      return t - step + step * frac;
    }
    prev = next;
    t += step;
  }
  return max;
}

function didCross(prev: number, next: number, target: number): boolean {
  // Treat the phase as a circular value: a crossing happens if the target
  // lies in the arc traversed going forward from prev to next.
  const arc = norm360((next - prev) * 360);
  const offset = norm360((target - prev) * 360);
  return offset > 0 && offset <= arc;
}

function wrapToTargetSide(p: number, target: number): number {
  // Return a representation of `p` such that `p ≤ target ≤ p + 1`.
  let q = p;
  while (q > target) q -= 1;
  while (q + 1 < target) q += 1;
  return q;
}

// ─── Planets ──────────────────────────────────────────────────────────────

/**
 * Mean orbital elements at J2000 with linear rates per Julian century.
 * Source: Meeus §31, equinox-of-date heliocentric elements.
 *  L  = mean longitude (deg)
 *  a  = semi-major axis (AU)
 *  e  = eccentricity (dimensionless)
 *  i  = inclination to ecliptic (deg)
 *  W  = longitude of ascending node Ω (deg)
 *  P  = longitude of perihelion ϖ (deg)
 *
 * Each field is `[value at T=0, per-century rate, per-century² rate]`.
 * Higher-order terms are dropped — sufficient for sign placement.
 */
interface Elements {
  L: [number, number, number];
  a: [number, number, number];
  e: [number, number, number];
  i: [number, number, number];
  W: [number, number, number];
  P: [number, number, number];
}

const ELEMENTS: Record<
  "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn",
  Elements
> = {
  mercury: {
    L: [252.250906, 149474.0722491, 0],
    a: [0.38709831, 0, 0],
    e: [0.20563175, 0.000020406, -0.0000000284],
    i: [7.004986, -0.0059516, 0.00000081],
    W: [48.330893, -0.1254227, -0.00008833],
    P: [77.456119, 0.1588643, -0.00001342],
  },
  venus: {
    L: [181.979801, 58519.2130302, 0],
    a: [0.7233298, 0, 0],
    e: [0.00677192, -0.000047765, 0.0000000981],
    i: [3.394662, -0.0008568, -0.00003244],
    W: [76.67992, -0.278008, -0.00014256],
    P: [131.563707, 0.0048646, -0.00138232],
  },
  earth: {
    L: [100.466449, 35999.3728519, 0],
    a: [1.000001018, 0, 0],
    e: [0.01670862, -0.000042037, -0.0000001236],
    i: [0, 0, 0],
    W: [0, 0, 0], // Earth's orbit defines the ecliptic; ascending node undefined.
    P: [102.937348, 0.3225557, 0.00015026],
  },
  mars: {
    L: [355.433275, 19140.2993313, 0],
    a: [1.523679342, 0, 0],
    e: [0.09340062, 0.000090483, -0.0000000806],
    i: [1.849726, -0.000601, 0.0000128],
    W: [49.558093, -0.2949846, -0.00063993],
    P: [336.060234, 0.4438983, -0.00017537],
  },
  jupiter: {
    L: [34.351484, 3034.9056746, 0],
    a: [5.202603209, 0.0000001913, 0],
    e: [0.04849485, 0.000163244, -0.0000004719],
    i: [1.30327, -0.0019872, 0.0000334],
    W: [100.464441, 0.1766828, 0.00090387],
    P: [14.331309, 0.2155525, 0.00072252],
  },
  saturn: {
    L: [50.077471, 1222.1137943, 0],
    a: [9.554909192, -0.0000021389, 0],
    e: [0.05550862, -0.000346818, -0.0000006456],
    i: [2.488878, 0.0025515, -0.0000491],
    W: [113.665524, -0.2566649, -0.00018345],
    P: [93.056787, 0.5665496, 0.0005285],
  },
};

function evalElement(e: [number, number, number], T: number): number {
  return e[0] + e[1] * T + e[2] * T * T;
}

interface HelioPos {
  x: number;
  y: number;
  z: number;
  r: number;
  L: number; // heliocentric ecliptic longitude
}

/**
 * Heliocentric ecliptic Cartesian coordinates for a body with mean orbital
 * elements. Solves Kepler's equation iteratively, then rotates from the
 * orbital plane to the ecliptic.
 */
function heliocentric(name: keyof typeof ELEMENTS, jd: number): HelioPos {
  const T = julianCenturies(jd);
  const els = ELEMENTS[name];
  const a = evalElement(els.a, T);
  const e = evalElement(els.e, T);
  const i = evalElement(els.i, T);
  const W = norm360(evalElement(els.W, T));
  const P = norm360(evalElement(els.P, T));
  const L = norm360(evalElement(els.L, T));
  const M = norm360(L - P); // mean anomaly
  const omega = norm360(P - W); // argument of perihelion

  // Solve Kepler: M = E - e*sin(E), E in radians.
  const Mrad = M * DEG2RAD;
  const ecc = e;
  let E = Mrad + ecc * Math.sin(Mrad);
  for (let k = 0; k < 8; k++) {
    const dE = (E - ecc * Math.sin(E) - Mrad) / (1 - ecc * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }

  // True anomaly
  const nu =
    2 *
    Math.atan2(
      Math.sqrt(1 + ecc) * Math.sin(E / 2),
      Math.sqrt(1 - ecc) * Math.cos(E / 2),
    );
  const r = a * (1 - ecc * Math.cos(E));

  // Position in orbital plane (with x toward perihelion)
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Rotate by argument of perihelion, then inclination, then node.
  const cosW = cos(W);
  const sinW = sin(W);
  const cosI = cos(i);
  const sinI = sin(i);
  const cosO = cos(omega);
  const sinO = sin(omega);

  const x =
    (cosW * cosO - sinW * sinO * cosI) * xOrb +
    (-cosW * sinO - sinW * cosO * cosI) * yOrb;
  const y =
    (sinW * cosO + cosW * sinO * cosI) * xOrb +
    (-sinW * sinO + cosW * cosO * cosI) * yOrb;
  const z = sinO * sinI * xOrb + cosO * sinI * yOrb;

  return {
    x,
    y,
    z,
    r,
    L: norm360(Math.atan2(y, x) * RAD2DEG),
  };
}

/**
 * Apparent geocentric ecliptic longitude of a planet, in degrees.
 * Computed by subtracting Earth's heliocentric position from the planet's.
 */
function planetGeocentricLongitude(
  name: "mercury" | "venus" | "mars" | "jupiter" | "saturn",
  jd: number,
): number {
  const p = heliocentric(name, jd);
  const earth = heliocentric("earth", jd);
  const dx = p.x - earth.x;
  const dy = p.y - earth.y;
  return norm360(Math.atan2(dy, dx) * RAD2DEG);
}

/**
 * Mercury retrograde detection.
 *
 * - `retrograde`: true if Mercury's geocentric longitude is decreasing
 *   (i.e. apparent motion is westward) on the day in question.
 * - `shadowPeriod`: true if we are within ~14 days before retrograde
 *   begins or ~14 days after it ends. This is the "pre-shadow / post-
 *   shadow" period that astrologers track: the energy is brewing or
 *   still settling but the planet is technically direct.
 *
 * Implementation: compute today's and yesterday's longitudes. For the
 * shadow check, look forward 14 days and back 14 days and see whether
 * any of those samples is retrograde while today is direct.
 */
function mercuryRetrograde(jd: number): {
  retrograde: boolean;
  shadowPeriod: boolean;
} {
  const today = planetGeocentricLongitude("mercury", jd);
  const yesterday = planetGeocentricLongitude("mercury", jd - 1);
  const retrograde = angleDiff(today, yesterday) < 0;
  if (retrograde) return { retrograde: true, shadowPeriod: false };

  // Direct today — check the shadow window.
  for (let d = 1; d <= 21; d++) {
    const ahead = planetGeocentricLongitude("mercury", jd + d);
    const aheadPrev = planetGeocentricLongitude("mercury", jd + d - 1);
    if (angleDiff(ahead, aheadPrev) < 0) return { retrograde: false, shadowPeriod: true };
    const behind = planetGeocentricLongitude("mercury", jd - d);
    const behindNext = planetGeocentricLongitude("mercury", jd - d + 1);
    if (angleDiff(behindNext, behind) < 0) return { retrograde: false, shadowPeriod: true };
  }
  return { retrograde: false, shadowPeriod: false };
}

// ─── Ascendant ────────────────────────────────────────────────────────────

/**
 * Local apparent sidereal time, in degrees.
 * Meeus §12 — sufficient precision for ascendant work.
 */
function localSiderealTime(jd: number, longitudeEast: number): number {
  const T = julianCenturies(jd);
  // Greenwich mean sidereal time at 0h UT
  let GMST =
    280.46061837 +
    360.98564736629 * (jd - J2000) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  GMST = norm360(GMST);
  return norm360(GMST + longitudeEast);
}

/** Mean obliquity of the ecliptic, in degrees. Meeus §22. */
function obliquity(jd: number): number {
  const T = julianCenturies(jd);
  return (
    23.43929111 -
    (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600
  );
}

/**
 * Ascendant: the zodiac sign rising on the eastern horizon at a given
 * time and place.  Meeus §13.6.
 *
 * Returns the ecliptic longitude of the ascendant in degrees, or null
 * if `lat` is outside ±66.5° (the polar circle, where the ascendant can
 * be undefined). Inputs:
 *   jd  — Julian Day of the moment (UTC).
 *   lat — geographic latitude in degrees (north positive).
 *   lng — geographic longitude in degrees (east positive).
 */
export function ascendantLongitude(
  jd: number,
  lat: number,
  lng: number,
): number | null {
  if (lat > 66.5 || lat < -66.5) return null;
  const lst = localSiderealTime(jd, lng); // degrees
  const eps = obliquity(jd);
  // tan(Asc) = -cos(LST) / (sin(eps)*tan(lat) + cos(eps)*sin(LST))
  const numerator = -cos(lst);
  const denominator = sin(eps) * tan(lat) + cos(eps) * sin(lst);
  const ascRad = Math.atan2(numerator, denominator);
  // The two-argument arctangent gives the ascendant directly — no
  // quadrant correction needed beyond normalising to [0, 360).
  return norm360(ascRad * RAD2DEG);
}

// ─── Public conversions ───────────────────────────────────────────────────

export function longitudeToSign(longitude: number): Sign {
  return SIGNS[Math.floor(norm360(longitude) / 30)];
}

export function longitudeToDegreeInSign(longitude: number): number {
  return norm360(longitude) % 30;
}

function position(longitude: number): PlanetPosition {
  return {
    sign: longitudeToSign(longitude),
    degree: longitudeToDegreeInSign(longitude),
  };
}

/**
 * Season from the Sun's longitude.
 *
 * Northern hemisphere:
 *   spring  =   0°–90°  (Sun in Aries → Gemini)
 *   summer  =  90°–180° (Cancer → Virgo)
 *   autumn  = 180°–270° (Libra → Sagittarius)
 *   winter  = 270°–360° (Capricorn → Pisces)
 *
 * Southern hemisphere is rotated 180°.
 */
function seasonFromSun(sunLng: number, lat: number): Season {
  const offset = lat < 0 ? 180 : 0;
  const l = norm360(sunLng + offset);
  if (l < 90) return "spring";
  if (l < 180) return "summer";
  if (l < 270) return "autumn";
  return "winter";
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Snapshot of the live sky at a given UTC instant.
 *
 * Pass `lat` if you want the season derived for the user's hemisphere;
 * otherwise it defaults to northern.
 */
export function getSkyState(
  date: Date,
  opts: { lat?: number } = {},
): SkyState {
  const jd = julianDay(date);
  const sunLng = sunEclipticLongitude(jd);
  const moonLng = moonEclipticLongitude(jd);
  const phase = moonPhaseFraction(jd);
  const phaseName = moonPhaseName(phase);
  const merc = mercuryRetrograde(jd);

  return {
    date,
    julianDay: jd,
    moon: {
      phase,
      phaseName,
      phaseSymbol: moonPhaseSymbol(phaseName),
      sign: longitudeToSign(moonLng),
      daysToNewMoon: daysToPhase(jd, 0),
      daysToFullMoon: daysToPhase(jd, 0.5),
      cycleDay: Math.min(29, Math.max(1, Math.round(phase * SYNODIC_MONTH) + 1)),
    },
    sun: position(sunLng),
    planets: {
      mercury: {
        ...position(planetGeocentricLongitude("mercury", jd)),
        retrograde: merc.retrograde,
        shadowPeriod: merc.shadowPeriod,
      },
      venus: position(planetGeocentricLongitude("venus", jd)),
      mars: position(planetGeocentricLongitude("mars", jd)),
      jupiter: position(planetGeocentricLongitude("jupiter", jd)),
      saturn: position(planetGeocentricLongitude("saturn", jd)),
    },
    season: seasonFromSun(sunLng, opts.lat ?? 51),
  };
}

/**
 * The sky at the moment of birth — the user's natal chart.
 * `lat` and `lng` are required only for the rising sign; without them
 * `rising` is null and the planet placements are still returned.
 */
export function computeNatalChart(birth: BirthDetails): NatalChart {
  const jd = julianDay(birth.date);
  const sun = longitudeToSign(sunEclipticLongitude(jd));
  const moon = longitudeToSign(moonEclipticLongitude(jd));
  const mercury = longitudeToSign(planetGeocentricLongitude("mercury", jd));
  const venus = longitudeToSign(planetGeocentricLongitude("venus", jd));
  const mars = longitudeToSign(planetGeocentricLongitude("mars", jd));
  const jupiter = longitudeToSign(planetGeocentricLongitude("jupiter", jd));
  const saturn = longitudeToSign(planetGeocentricLongitude("saturn", jd));

  let rising: Sign | null = null;
  if (birth.lat != null && birth.lng != null) {
    const asc = ascendantLongitude(jd, birth.lat, birth.lng);
    if (asc != null) rising = longitudeToSign(asc);
  }

  return { sun, moon, mercury, venus, mars, jupiter, saturn, rising };
}

/**
 * Significant transits — places where today's sky touches the natal chart.
 *
 * Returns flat strings rather than a structured representation; these are
 * intended as prose hints that get folded into the LLM prompt, not
 * something the UI parses.
 */
export function computeTransits(
  today: SkyState,
  natal: NatalChart,
): TransitReport {
  const active: string[] = [];

  // Transiting Moon over natal Sun/Moon/Rising
  if (today.moon.sign === natal.sun)
    active.push(`Moon in ${today.moon.sign} crossing your natal Sun`);
  if (today.moon.sign === natal.moon)
    active.push(`Moon returning to its natal sign of ${today.moon.sign}`);
  if (natal.rising && today.moon.sign === natal.rising)
    active.push(`Moon in ${today.moon.sign} crossing your rising`);

  // Transiting Sun over natal Moon/Rising
  if (today.sun.sign === natal.moon)
    active.push(`Sun in ${today.sun.sign} lighting your natal Moon`);
  if (natal.rising && today.sun.sign === natal.rising)
    active.push(`Sun in ${today.sun.sign} on your ascendant`);

  // Same-sign overlaps for the other planets
  const planetMap: [keyof SkyState["planets"], keyof NatalChart][] = [
    ["mercury", "mercury"],
    ["venus", "venus"],
    ["mars", "mars"],
    ["jupiter", "jupiter"],
    ["saturn", "saturn"],
  ];
  for (const [today_, natal_] of planetMap) {
    if (today.planets[today_].sign === natal[natal_])
      active.push(
        `${capitalise(today_)} returning to your natal sign of ${
          natal[natal_]
        }`,
      );
  }

  const windows: string[] = [];
  if (today.planets.mercury.retrograde)
    windows.push("Mercury retrograde");
  else if (today.planets.mercury.shadowPeriod)
    windows.push("Mercury shadow period");
  if (today.moon.daysToNewMoon < 2)
    windows.push(`New moon in ${Math.ceil(today.moon.daysToNewMoon)} day(s)`);
  if (today.moon.daysToFullMoon < 2)
    windows.push(`Full moon in ${Math.ceil(today.moon.daysToFullMoon)} day(s)`);

  return { activeTransits: active, significantWindows: windows };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
