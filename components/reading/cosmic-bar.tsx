import type { SkyState } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  Live sky conditions, rendered immediately from the astronomical engine.
  No AI, no fetch, no loading state — this is the part of the page that
  exists the moment the reader lands.
*/
export function CosmicBar({ sky }: { sky: SkyState }) {
  const mercuryStatus = sky.planets.mercury.retrograde
    ? "Retrograde"
    : sky.planets.mercury.shadowPeriod
      ? "Shadow"
      : "Direct";

  return (
    <div className="hairline rounded-md bg-bark/40 px-6 py-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
        <Item label="Moon">
          <span className="text-2xl text-parchment">{sky.moon.phaseSymbol}</span>
          <span className="ml-2 text-parchment">{sky.moon.phaseName}</span>
          <span className="ml-2 text-ash">
            in {sky.moon.sign} {SIGN_GLYPH[sky.moon.sign]}
          </span>
        </Item>
        <Item label="Sun">
          <span className="text-parchment">
            {sky.sun.sign} {SIGN_GLYPH[sky.sun.sign]}
          </span>
        </Item>
        <Item label="Mercury">
          <span
            className={
              sky.planets.mercury.retrograde
                ? "text-ochre"
                : sky.planets.mercury.shadowPeriod
                  ? "text-sage"
                  : "text-parchment"
            }
          >
            {mercuryStatus}
          </span>
          <span className="ml-2 text-ash">in {sky.planets.mercury.sign}</span>
        </Item>
        <Item label="New moon in">
          <span className="text-parchment">
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
      <span className="mt-1 font-serif text-base">{children}</span>
    </div>
  );
}
