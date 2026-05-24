import type { SkyState } from "@/lib/astro";

/*
  Atmospheric strip — the always-on status bar above the CRT.

  Same sky data the broadsheet shows, but read as electromagnetic
  weather. The reframe is the entire copy: nothing about "Mercury
  retrograde" or "waxing crescent" lands in the operator's vocabulary
  — instead, "DRIFT NEGATIVE," "WAXING 23%," etc.
*/

interface Props {
  sky: SkyState;
  callsign?: string | null;
  channelNumber: number;
  channelName: string;
}

export function AtmosphericStrip({
  sky,
  callsign,
  channelNumber,
  channelName,
}: Props) {
  const propagation = propagationLabel(sky);
  const drift = driftLabel(sky);
  const moonPct = Math.round(sky.moon.phase < 0.5
    ? sky.moon.phase * 200
    : (1 - sky.moon.phase) * 200);
  const moonState = sky.moon.phase < 0.5 ? "WAXING" : "WANING";

  return (
    <div className="fs-housing border-y border-[var(--fs-rule-strong)] px-5 py-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <ul className="flex flex-wrap gap-x-6 gap-y-1 fs-mono text-[0.7rem]">
          <Item label="PROP" value={propagation} />
          <Item
            label="MOON"
            value={`${moonState} ${moonPct}%`}
          />
          <Item label="DRIFT" value={drift} />
          <Item
            label="CARRIER"
            value={sky.planets.mercury.retrograde ? "RETRO" : sky.planets.mercury.shadowPeriod ? "SHADOW" : "DIRECT"}
            tone={sky.planets.mercury.retrograde ? "alarm" : "default"}
          />
          <Item label="FIX" value={sky.sun.sign.toUpperCase().slice(0, 4)} />
        </ul>
        <div className="flex items-center gap-3 fs-mono text-[0.7rem] text-[var(--fs-ivory-dim)]">
          <span>STN 28</span>
          <span className="text-[var(--fs-brass-glint)]">·</span>
          <span>
            CH {String(channelNumber).padStart(2, "0")}
            <span className="ml-2 text-[var(--fs-ivory)]">{channelName}</span>
          </span>
          {callsign && (
            <>
              <span className="text-[var(--fs-brass-glint)]">·</span>
              <span>{callsign.toUpperCase()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "alarm";
}) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-[var(--fs-ivory-dim)] tracking-[0.22em]">
        {label}
      </span>
      <span
        className={
          tone === "alarm"
            ? "text-[var(--fs-alarm)]"
            : "text-[var(--fs-brass-glint)]"
        }
      >
        {value}
      </span>
    </li>
  );
}

function propagationLabel(sky: SkyState): string {
  // Map moon phase + Mercury state to a single propagation classifier.
  if (sky.planets.mercury.retrograde) return "DEGRADED";
  if (sky.moon.daysToNewMoon < 1 || sky.moon.daysToFullMoon < 1) return "PEAK";
  if (sky.moon.phase < 0.1 || sky.moon.phase > 0.9) return "LOW";
  return "NOMINAL";
}

function driftLabel(sky: SkyState): string {
  // Convert sun-ish longitude into an artificial Hz drift figure — pure
  // theatre. Stable per day, varies smoothly.
  const day = sky.date.getUTCDate();
  const month = sky.date.getUTCMonth() + 1;
  const drift = ((day * 7 + month * 13) % 47) / 10 - 2.35;
  return `${drift >= 0 ? "+" : ""}${drift.toFixed(2)}Hz`;
}
