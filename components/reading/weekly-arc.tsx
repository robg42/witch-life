import type { WeeklyResponse } from "@/app/api/weekly/route";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  Seven-day grid with colour-coded energy quality and the day's moon
  phase + sign. Today is highlighted.
*/
const QUALITY_COLOUR: Record<string, string> = {
  expand: "border-energy-expand text-energy-expand",
  flow: "border-energy-flow text-energy-flow",
  inward: "border-energy-inward text-energy-inward",
  contract: "border-energy-contract text-energy-contract",
  friction: "border-energy-friction text-energy-friction",
};

export function WeeklyArc({
  weekly,
  todayISO,
}: {
  weekly: WeeklyResponse;
  todayISO: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
        {weekly.days.map((day) => {
          const isToday = day.date === todayISO;
          const colour =
            QUALITY_COLOUR[day.energyQuality] ?? QUALITY_COLOUR.flow;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-2 border ${colour.split(" ")[0]} bg-bark/30 px-3 py-4 ${
                isToday ? "ring-1 ring-ochre" : ""
              }`}
            >
              <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-ash">
                {formatDate(day.date)}
              </span>
              <span
                className={`font-sans text-[10px] uppercase tracking-[0.2em] ${colour.split(" ")[1]}`}
              >
                {day.energyQuality}
              </span>
              <span className="font-serif text-base text-parchment">
                {day.descriptor}
              </span>
              <span className="text-xs text-ash">
                {phaseSymbol(day.moonPhase)} {SIGN_GLYPH[day.moonSign as keyof typeof SIGN_GLYPH] ?? ""}
              </span>
            </div>
          );
        })}
      </div>
      {weekly.narrativeArc && (
        <p className="mt-6 oracle-body text-parchment/90">
          {weekly.narrativeArc}
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  // Render "Mon 3 Jun" style without pulling in a date library.
  const d = new Date(iso + "T00:00:00Z");
  const weekday = d.toLocaleString("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  });
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${weekday} ${day} ${month}`;
}

const PHASE_SYMBOL_BY_NAME: Record<string, string> = {
  New: "●",
  "Waxing Crescent": "☽",
  "First Quarter": "◐",
  "Waxing Gibbous": "◕",
  Full: "○",
  "Waning Gibbous": "◔",
  "Last Quarter": "◑",
  "Waning Crescent": "☾",
};

function phaseSymbol(name: string): string {
  return PHASE_SYMBOL_BY_NAME[name] ?? "";
}
