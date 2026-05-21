import type { NatalChart } from "@/lib/astro";
import {
  PLANET_GLYPH,
  PLANET_NAME,
  PLANET_ORDER,
  SIGN_GLYPH,
} from "@/lib/zodiac";

/*
  The reader's natal chart at a glance: a horizontal row of planet glyph
  + sign for each of the seven traditional bodies, with rising at the
  end when birth time + place are known.
*/
export function NatalStrip({ natal }: { natal: NatalChart }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-b border-bark/60 py-4">
      {PLANET_ORDER.map((p) => {
        const sign = natal[p];
        return (
          <Cell
            key={p}
            glyph={PLANET_GLYPH[p]}
            name={PLANET_NAME[p]}
            signGlyph={SIGN_GLYPH[sign]}
            signName={sign}
          />
        );
      })}
      {natal.rising && (
        <Cell
          glyph="↑"
          name="Rising"
          signGlyph={SIGN_GLYPH[natal.rising]}
          signName={natal.rising}
          accent
        />
      )}
    </div>
  );
}

function Cell({
  glyph,
  name,
  signGlyph,
  signName,
  accent = false,
}: {
  glyph: string;
  name: string;
  signGlyph: string;
  signName: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`text-lg ${accent ? "text-clay" : "text-moss"}`}
        title={name}
      >
        {glyph}
      </span>
      <span className="font-sans text-xs uppercase tracking-[0.15em] text-ash">
        {name}
      </span>
      <span className="font-serif text-base text-wax">
        {signGlyph} {signName}
      </span>
    </div>
  );
}
