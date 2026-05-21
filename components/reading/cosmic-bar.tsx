import type { SkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  Live sky conditions, rendered immediately from the astronomical engine.
  Sits at the top of the reading page on the cream herbarium surface.
*/
export function CosmicBar({ sky }: { sky: SkyState }) {
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "Retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "Shadow"
      : "Direct";

  return (
    <div className="rounded-sm border border-bark/70 bg-smoke/40 px-6 py-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
        <Item label="Moon">
          <span className="text-2xl text-wax">{sky.moon.phaseSymbol}</span>
          <span className="ml-2 text-wax">{sky.moon.phaseName}</span>
          <span className="ml-2 text-ash">
            in {sky.moon.sign} {SIGN_GLYPH[sky.moon.sign]}
          </span>
        </Item>
        <Item label="Sun">
          <span className="text-wax">
            {sky.sun.sign} {SIGN_GLYPH[sky.sun.sign]}
          </span>
        </Item>
        <Item label="Mercury">
          <span
            className={
              sky.planets.mercury.retrograde
                ? "text-clay"
                : sky.planets.mercury.shadowPeriod
                  ? "text-moss"
                  : "text-wax"
            }
          >
            {mercuryStatus}
          </span>
          <span className="ml-2 text-ash">in {sky.planets.mercury.sign}</span>
        </Item>
        <Item label="New moon in">
          <span className="text-wax">
            {Math.round(sky.moon.daysToNewMoon)} days
          </span>
        </Item>
      </div>
    </div>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-sans text-xs uppercase tracking-[0.2em] text-ash">
        {label}
      </span>
      <span className="mt-1 font-serif text-base text-wax">{children}</span>
    </div>
  );
}
