import type { WeeklyResponse } from "@/app/api/weekly/route";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  Seven-day grid with colour-coded energy quality and the day's moon
  phase + sign. Today is highlighted. Cream-surface theme.
*/
const QUALITY_TONE: Record<
  string,
  { border: string; text: string; bg: string }
> = {
  expand: { border: "border-moss", text: "text-moss", bg: "bg-moss/10" },
  flow: { border: "border-saffron", text: "text-saffron", bg: "bg-saffron/10" },
  inward: { border: "border-bark", text: "text-bark/80", bg: "bg-bark/5" },
  contract: { border: "border-clay/60", text: "text-clay", bg: "bg-clay/10" },
  friction: { border: "border-clay", text: "text-clay", bg: "bg-clay/15" },
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
          const tone = QUALITY_TONE[day.energyQuality] ?? QUALITY_TONE.flow;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-2 border ${tone.border} ${tone.bg} px-3 py-4 ${
                isToday ? "ring-1 ring-clay" : ""
              }`}
            >
              <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-ash">
                {formatDate(day.date)}
              </span>
              <span
                className={`font-sans text-[10px] uppercase tracking-[0.2em] ${tone.text}`}
              >
                {day.energyQuality}
              </span>
              <span className="font-serif text-base text-wax">
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
        <p className="mt-6 oracle-body text-wax/90">
          {weekly.narrativeArc}
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
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
