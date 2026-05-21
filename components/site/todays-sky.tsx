import type { SkyState } from "@/lib/astro";
import {
  PLANET_GLYPH,
  PLANET_NAME,
  SIGN_GLYPH,
} from "@/lib/zodiac";

/*
  TodaysSky — replaces the circular SkyWheel as the centerpiece. Reads
  like a page from a 19th century almanac: a hand-illustrated moon at
  centre, the sun and Mercury in two columns directly underneath, then
  the outer planets as a quiet typographic row, then a closing line of
  almanac data (next new moon).

  The moon is drawn from actual geometry — terminator ellipse derived
  from the current phase fraction — not a Unicode glyph, so the
  illustration matches the night sky tonight.
*/
export function TodaysSky({ sky }: { sky: SkyState }) {
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "Retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "In shadow"
      : "Direct";

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* The moon — illustrated, centred */}
      <figure className="flex flex-col items-center">
        <Moon phase={sky.moon.phase} />
        <figcaption className="mt-6 text-center">
          <p className="font-accent text-3xl italic leading-tight text-ink md:text-4xl">
            {sky.moon.phaseName}
          </p>
          <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.35em] text-clay">
            <span className="text-xl text-moss leading-none align-middle">
              {SIGN_GLYPH[sky.moon.sign]}
            </span>
            <span className="ml-2 align-middle">in {sky.moon.sign}</span>
          </p>
          <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
            Day {sky.moon.cycleDay} of the lunar cycle
          </p>
        </figcaption>
      </figure>

      {/* Sun + Mercury — secondary, two columns */}
      <div className="mt-12 grid grid-cols-2">
        <div className="border-r border-bark/20 py-4 text-center">
          <span className="font-serif text-3xl text-saffron leading-none">☉</span>
          <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            The sun
          </p>
          <p className="mt-2 font-serif text-lg text-ink">
            {sky.sun.sign}, {Math.round(sky.sun.degree)}°
          </p>
        </div>
        <div className="py-4 text-center">
          <span
            className={`font-serif text-3xl leading-none ${
              sky.planets.mercury.retrograde ? "text-clay" : "text-moss"
            }`}
          >
            ☿
          </span>
          <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-bark/70">
            Mercury
          </p>
          <p className="mt-2 font-serif text-lg text-ink">
            {mercuryStatus},{" "}
            <span className="text-bark/80">{sky.planets.mercury.sign}</span>
          </p>
        </div>
      </div>

      {/* The visible planets — tertiary, single row */}
      <div className="mt-10 border-t border-bark/20 pt-6">
        <p className="text-center font-sans text-[10px] uppercase tracking-[0.3em] text-bark/60">
          The other visible planets
        </p>
        <div className="mt-4 flex flex-wrap items-baseline justify-center gap-x-10 gap-y-3">
          {(["venus", "mars", "jupiter", "saturn"] as const).map((p) => (
            <div key={p} className="flex items-baseline gap-2">
              <span className="font-serif text-xl text-moss" title={PLANET_NAME[p]}>
                {PLANET_GLYPH[p]}
              </span>
              <span className="font-serif text-base text-ink">
                {sky.planets[p].sign}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hand-drawn moon ──────────────────────────────────────────────────────

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 72;

/**
 * Draws the moon at a given phase. Phase 0 = new (all shadow),
 * 0.5 = full (no shadow), continuing to 1 = new again. The terminator
 * (boundary between lit and dark) is modelled as an ellipse whose
 * semi-major axis shrinks to zero at the quarters and grows to r at
 * new/full — matching the projection of the lit hemisphere onto a 2D
 * disk.
 */
function Moon({ phase }: { phase: number }) {
  return (
    <div className="relative">
      {/* Soft saffron glow behind the moon */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-saffron/25 blur-3xl"
        style={{ width: SIZE * 1.4, height: SIZE * 1.4 }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="relative"
        aria-hidden
      >
        {/* Faint outer ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R + 12}
          fill="none"
          stroke="rgba(61, 53, 41, 0.15)"
          strokeWidth="0.5"
          strokeDasharray="1 6"
        />

        {/* Moon body — warm bone with subtle inner gradient */}
        <defs>
          <radialGradient id="moon-body" cx="40%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#FDF4DC" />
            <stop offset="70%" stopColor="#EAD9BD" />
            <stop offset="100%" stopColor="#D4C0A0" />
          </radialGradient>
        </defs>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="url(#moon-body)"
          stroke="rgba(61, 53, 41, 0.5)"
          strokeWidth="1.2"
        />

        {/* Craters — fixed positions, parchment maria */}
        <circle cx={CX - 22} cy={CY - 18} r="5" fill="rgba(61, 53, 41, 0.22)" />
        <circle cx={CX + 16} cy={CY - 4} r="3.5" fill="rgba(61, 53, 41, 0.18)" />
        <circle cx={CX - 6} cy={CY + 22} r="6" fill="rgba(61, 53, 41, 0.2)" />
        <circle cx={CX + 26} cy={CY + 24} r="3" fill="rgba(61, 53, 41, 0.16)" />
        <circle cx={CX - 30} cy={CY + 8} r="2.5" fill="rgba(61, 53, 41, 0.15)" />

        {/* Shadow — drawn from terminator geometry */}
        <Shadow phase={phase} />
      </svg>
    </div>
  );
}

function Shadow({ phase }: { phase: number }) {
  // New moon — full disk shadow.
  if (phase < 0.01 || phase > 0.99) {
    return (
      <circle cx={CX} cy={CY} r={R} fill="rgba(31, 26, 18, 0.78)" />
    );
  }
  // Full moon — no shadow.
  if (Math.abs(phase - 0.5) < 0.01) return null;

  const isWaxing = phase < 0.5;
  const isCrescent =
    (isWaxing && phase < 0.25) || (!isWaxing && phase > 0.75);

  const rx = Math.abs(Math.cos(phase * 2 * Math.PI)) * R;

  // Shadow semicircle direction. SVG arc sweep flag:
  //   sweep=1 traces the arc clockwise from start to end (in screen space).
  // Going from (CX, CY-R) [top] to (CX, CY+R) [bottom]:
  //   sweep=1 traces the RIGHT semicircle.
  //   sweep=0 traces the LEFT semicircle.
  // Waxing: shadow lives on the LEFT, so we trace LEFT semicircle.
  const semiSweep = isWaxing ? 0 : 1;

  // Terminator ellipse, going (CX, CY+R) [bottom] back to (CX, CY-R) [top]:
  //   sweep=1 bulges RIGHT (clockwise from bottom upward = curving right).
  //   sweep=0 bulges LEFT.
  // Crescent waxing: terminator bulges RIGHT (into lit area) → sweep=1
  // Gibbous waxing: terminator bulges LEFT (into shadow lens)  → sweep=0
  // Gibbous waning: terminator bulges RIGHT (into shadow lens) → sweep=1
  // Crescent waning: terminator bulges LEFT (into lit area)    → sweep=0
  const termSweep =
    (isWaxing && isCrescent) || (!isWaxing && !isCrescent) ? 1 : 0;

  const path = `M ${CX} ${CY - R} A ${R} ${R} 0 0 ${semiSweep} ${CX} ${CY + R} A ${rx} ${R} 0 0 ${termSweep} ${CX} ${CY - R} Z`;

  return <path d={path} fill="rgba(31, 26, 18, 0.78)" />;
}
