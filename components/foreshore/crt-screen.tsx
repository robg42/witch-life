import type { ReactNode } from "react";

/*
  The CRT — the universal output surface for Station 28.

  Everything the operator reads happens inside this rectangle:
  transmissions, the dial channel card, the tape, the operator file,
  and (in paper mode) the weekly letter.

  Behaviour notes:
    - Always renders the scanline overlay and slow refresh band
      (see .fs-crt::before / ::after in globals.css).
    - Has an idle waveform pinned to the foot, which is a low-power
      "the station is alive" affordance even when no panel is open.
    - The `mode` prop switches the surface between phosphor (default,
      the regular console) and paper (for opened letters from the
      Foreshore). The transition wash is applied automatically when
      mode changes via a key prop in the parent.
*/

interface Props {
  children: ReactNode;
  mode?: "phosphor" | "paper";
  /** Show idle sine wave at the foot. Default true. */
  waveform?: boolean;
  /** Apply the rare horizontal-slip glitch (one shot). */
  glitch?: boolean;
  className?: string;
}

export function CRTScreen({
  children,
  mode = "phosphor",
  waveform = true,
  glitch = false,
  className = "",
}: Props) {
  const surface = mode === "paper" ? "fs-paper" : "fs-crt fs-flicker";
  return (
    <div
      className={
        "relative w-full overflow-hidden " +
        surface +
        (glitch ? " fs-glitch" : "") +
        " " +
        className
      }
      data-mode={mode}
    >
      {/* Inner padding wrapper, so children don't sit against the bezel.
          Min-height keeps the CRT a substantial focal element. */}
      <div className="relative z-[1] min-h-[28rem] px-7 py-7 md:px-10 md:py-9">
        {children}
      </div>

      {mode === "phosphor" && waveform && <IdleWaveform />}
    </div>
  );
}

/**
 * A thin sine wave drifting at the bottom of the CRT. Animated by
 * CSS transform translateX on a longer SVG so the wave appears to
 * scroll endlessly. Purely decorative — proves the station is on
 * even when no panel is active.
 */
function IdleWaveform() {
  // Build the path procedurally so we don't ship a long literal.
  const points: string[] = [];
  const amp = 5;
  const cycles = 12;
  const width = 1200;
  for (let i = 0; i <= 240; i++) {
    const x = (i / 240) * width;
    const y = Math.sin((i / 240) * cycles * Math.PI * 2) * amp + amp + 2;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const d = "M" + points.join(" L");
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${amp * 2 + 6}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-3 h-3 w-full opacity-50"
    >
      <path d={d} className="fs-waveform" />
    </svg>
  );
}
