"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
  The dial. 28 detents, pointer-driven rotation, snapping at each
  channel. Keyboard accessible: ← / → step one channel, Home / End
  jump to extremes.

  This is the operator's primary input. The dial replaces what was
  previously "card draw" — but tuning here is unweighted, intentional,
  with audible click and inertial settle. The result is the channel
  index 0..27.

  Visually it's a brass knob with a single ivory pip marking the
  active detent. The ring around it shows the 28 detent positions as
  small ticks; every 7th tick is taller (quartile markers).
*/

interface Props {
  value: number; // 0..27
  onChange: (next: number) => void;
  /** Optional channel labels — shows the chosen one beneath the dial. */
  labelFor?: (channel: number) => string;
  size?: number; // px diameter, default 220
  /** Called when the user lands on a detent (settled, not mid-drag). */
  onSettle?: (channel: number) => void;
  /** Disabled state — visually dimmed, no pointer interaction. */
  disabled?: boolean;
}

const COUNT = 28;
const DEG_PER_DETENT = 360 / COUNT;

export function Dial({
  value,
  onChange,
  labelFor,
  size = 220,
  onSettle,
  disabled = false,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  // angle = current rotation in degrees (0 = channel 0 at the top).
  // We keep an internal float angle while dragging, then snap on release.
  const [angle, setAngle] = useState(value * DEG_PER_DETENT);
  const startRef = useRef<{ x: number; y: number; angle: number } | null>(null);

  // Keep dial angle in sync with externally-controlled value.
  useEffect(() => {
    if (!dragging) setAngle(value * DEG_PER_DETENT);
  }, [value, dragging]);

  const computeAngle = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // atan2 returns 0 along +x, but we want 0 at top.
    const a = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    return (a + 360) % 360;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const a = computeAngle(e.clientX, e.clientY);
    startRef.current = { x: e.clientX, y: e.clientY, angle: a };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    const a = computeAngle(e.clientX, e.clientY);
    setAngle(a);
    const channel = Math.round(a / DEG_PER_DETENT) % COUNT;
    if (channel !== value) onChange(channel);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    const channel = Math.round(angle / DEG_PER_DETENT) % COUNT;
    setAngle(channel * DEG_PER_DETENT);
    onSettle?.(channel);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = (value + 1) % COUNT;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = (value - 1 + COUNT) % COUNT;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = COUNT - 1;
    else return;
    e.preventDefault();
    onChange(next);
    onSettle?.(next);
  };

  // Snap angle for the visible knob — only mid-drag is it unsnapped.
  const visibleAngle = dragging ? angle : value * DEG_PER_DETENT;

  return (
    <div
      className={
        "inline-flex flex-col items-center gap-2 " +
        (disabled ? "opacity-50 pointer-events-none" : "")
      }
    >
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Channel dial"
        aria-valuemin={0}
        aria-valuemax={COUNT - 1}
        aria-valuenow={value}
        aria-valuetext={
          labelFor ? `Channel ${value}, ${labelFor(value)}` : `Channel ${value}`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKey}
        style={{ width: size, height: size }}
        className="relative cursor-grab active:cursor-grabbing select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-brass-glint)] rounded-full"
      >
        {/* Outer detent ring */}
        <svg
          viewBox="-110 -110 220 220"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* faint inner circle for the brass plate area */}
          <circle r="78" fill="none" stroke="var(--fs-brass-dim)" strokeWidth="0.5" opacity="0.4" />
          {/* 28 detent ticks */}
          {Array.from({ length: COUNT }).map((_, i) => {
            const a = (i * DEG_PER_DETENT - 90) * (Math.PI / 180);
            const isQuartile = i % 7 === 0;
            const tickIn = isQuartile ? 86 : 90;
            const tickOut = isQuartile ? 102 : 98;
            const x1 = Math.cos(a) * tickIn;
            const y1 = Math.sin(a) * tickIn;
            const x2 = Math.cos(a) * tickOut;
            const y2 = Math.sin(a) * tickOut;
            const active = i === value;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? "var(--fs-brass-glint)" : "var(--fs-brass-dim)"}
                strokeWidth={active ? 2 : isQuartile ? 1.4 : 1}
                opacity={active ? 1 : 0.85}
              />
            );
          })}
          {/* channel number labels on quartiles */}
          {[0, 7, 14, 21].map((i) => {
            const a = (i * DEG_PER_DETENT - 90) * (Math.PI / 180);
            const r = 72;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            return (
              <text
                key={i}
                x={x}
                y={y}
                fill="var(--fs-brass-dim)"
                fontSize="6"
                fontFamily="var(--fs-font-mono)"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.7"
              >
                {String(i).padStart(2, "0")}
              </text>
            );
          })}
        </svg>

        {/* Knob proper — brushed brass plate, rotates */}
        <div
          className="fs-brass-plate absolute"
          style={{
            inset: "12%",
            borderRadius: "50%",
            transform: `rotate(${visibleAngle}deg)`,
            transition: dragging
              ? "none"
              : "transform 0.32s cubic-bezier(0.22, 1.2, 0.36, 1)",
            boxShadow:
              "0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.35)",
          }}
        >
          {/* Knob pointer — single ivory pip at the top */}
          <span
            className="absolute left-1/2 top-[10%] block h-[14%] w-[6%] -translate-x-1/2 rounded-[2px]"
            style={{
              background: "var(--fs-ivory)",
              boxShadow:
                "0 1px 0 rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.25)",
            }}
          />
          {/* hairline rotation marks */}
          <svg
            viewBox="-50 -50 100 100"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i * 10 - 90) * (Math.PI / 180);
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 32}
                  y1={Math.sin(a) * 32}
                  x2={Math.cos(a) * 38}
                  y2={Math.sin(a) * 38}
                  stroke="var(--fs-brass-dim)"
                  strokeWidth="0.4"
                  opacity="0.55"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="text-center">
        <span className="fs-engraved">DIAL · CH</span>
        <div className="fs-mono mt-1 text-base text-[var(--fs-brass-glint)]">
          {String(value).padStart(2, "0")}
          {labelFor && (
            <span className="ml-3 text-[var(--fs-ivory)] uppercase tracking-[0.18em]">
              {labelFor(value)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
