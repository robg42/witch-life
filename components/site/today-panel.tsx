import type { SkyState } from "@/lib/astro";
import { almanacFor } from "@/lib/almanac";

/*
  Today panel — replaces the horoscope-flavoured SkyStrip on the hub.
  Lead with the date and the season. Moon phase visible (the only
  cosmic reading a witch cares about daily). Mercury only surfaces
  when it's misbehaving. No zodiac signs.

  Two columns:
    Left: date + season + wheel-of-the-year marker
    Right: moon phase + the land
*/
export function TodayPanel({ sky }: { sky: SkyState }) {
  const date = sky.date;
  const dateLine = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const almanac = almanacFor(date);
  const mercury = sky.planets.mercury;
  const mercuryNote = mercury.retrograde
    ? "Mercury retrograde — speak slowly."
    : mercury.shadowPeriod
      ? "Mercury in shadow — the field is settling."
      : null;

  return (
    <div className="rounded-sm border border-bark/25 bg-parchment/45 px-6 py-5 backdrop-blur-[1px]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left — date and season */}
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-clay">
            Today
          </p>
          <p className="mt-2 font-serif text-xl text-ink md:text-2xl">
            {dateLine}
          </p>
          <p className="mt-3 font-accent text-lg italic text-bark/85">
            {almanac.season} · {almanac.marker}
          </p>
        </div>

        {/* Right — moon + land */}
        <div className="md:border-l md:border-bark/20 md:pl-6">
          <div className="flex items-baseline gap-3">
            <MoonGlyph phase={sky.moon.phase} />
            <div>
              <p className="font-serif text-base text-ink leading-tight">
                {sky.moon.phaseName} moon
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-bark/70 mt-1">
                Day {sky.moon.cycleDay} of 29 ·{" "}
                {Math.round(sky.moon.daysToNewMoon)} days to dark
              </p>
            </div>
          </div>
          <p className="mt-4 font-serif text-sm italic leading-snug text-bark/80">
            {almanac.land}
          </p>
          {mercuryNote && (
            <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.3em] text-clay">
              {mercuryNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/*
  Small inline moon glyph drawn from actual phase geometry. Lives next
  to the phase name in the Today panel — not a hero illustration,
  just a small indicator the eye can read at a glance.
*/
function MoonGlyph({ phase }: { phase: number }) {
  const size = 36;
  const cx = size / 2;
  const cy = size / 2;
  const r = 14;

  const isWaxing = phase < 0.5;
  const isCrescent =
    (isWaxing && phase < 0.25) || (!isWaxing && phase > 0.75);
  const isNew = phase < 0.01 || phase > 0.99;
  const isFull = Math.abs(phase - 0.5) < 0.01;
  const rx = Math.abs(Math.cos(phase * 2 * Math.PI)) * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* Moon body */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--color-bone)"
        stroke="var(--color-bark)"
        strokeWidth="1"
      />
      {/* Shadow */}
      {isNew && (
        <circle cx={cx} cy={cy} r={r} fill="rgba(31, 24, 16, 0.85)" />
      )}
      {!isNew && !isFull && (
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 ${isWaxing ? 0 : 1} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${
            (isWaxing && isCrescent) || (!isWaxing && !isCrescent) ? 1 : 0
          } ${cx} ${cy - r} Z`}
          fill="rgba(31, 24, 16, 0.78)"
        />
      )}
    </svg>
  );
}
