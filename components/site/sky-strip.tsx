import type { SkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  A compact single-line sky readout. Replaces the giant moon centrepiece
  on the hub — today's data still visible, but as data rather than as a
  static illustration.

  Each cell is a tiny module: glyph + value. Mercury status gets a
  semantic colour. The whole strip is glanceable in a second.
*/
export function SkyStrip({ sky }: { sky: SkyState }) {
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "Retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "Shadow"
      : "Direct";
  const mercuryClass = sky.planets.mercury.retrograde
    ? "text-clay"
    : sky.planets.mercury.shadowPeriod
      ? "text-moss"
      : "text-ink";

  return (
    <div className="rounded-sm border border-bark/25 bg-parchment/40 px-5 py-3 backdrop-blur-[1px]">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Cell label="Moon">
          <span className="text-base text-clay leading-none">
            {sky.moon.phaseSymbol}
          </span>
          <span className="text-ink">{sky.moon.phaseName}</span>
          <span className="text-bark/60">
            · {sky.moon.sign} {SIGN_GLYPH[sky.moon.sign]}
          </span>
        </Cell>

        <Divider />

        <Cell label="Sun">
          <span className="text-ink">{sky.sun.sign}</span>
          <span className="text-bark/60">{SIGN_GLYPH[sky.sun.sign]}</span>
          <span className="text-bark/60">
            · {Math.round(sky.sun.degree)}°
          </span>
        </Cell>

        <Divider />

        <Cell label="Mercury">
          <span className={mercuryClass}>{mercuryStatus}</span>
          <span className="text-bark/60">
            · {sky.planets.mercury.sign}
          </span>
        </Cell>

        <Divider />

        <Cell label="Next new moon">
          <span className="text-ink">
            {Math.round(sky.moon.daysToNewMoon)} days
          </span>
        </Cell>
      </div>
    </div>
  );
}

function Cell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2 font-serif text-sm">
      <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-bark/60">
        {label}
      </span>
      <span className="flex items-baseline gap-1">{children}</span>
    </div>
  );
}

function Divider() {
  return <span className="text-bark/30">·</span>;
}
