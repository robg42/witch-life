"use client";

import { useState } from "react";
import type { SkyState, Sign } from "@/lib/astro";
import { SIGN_GLYPH } from "@/lib/zodiac";

/*
  A live, interactive circular sky chart showing today's planetary
  positions against the twelve sign segments.

  The wheel uses the traditional Western convention: Aries 0° is on the
  left horizon (9 o'clock), and signs run counter-clockwise (Taurus
  below Aries, Cancer at the top, etc.). Each planet is plotted at its
  current ecliptic longitude. Hover or tap a planet for a small label.
*/

const SIGNS_ORDER: readonly Sign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

interface Body {
  key: string;
  glyph: string;
  label: string;
  longitude: number;
  detail: string;
  highlight?: boolean;
}

const CX = 260;
const CY = 260;
const RING_OUTER = 240;
const RING_INNER = 184;
const PLANET_R = 154;

/** Convert an ecliptic longitude to (x, y) on the wheel at the given radius. */
function place(longitude: number, r: number): { x: number; y: number } {
  // SVG y is flipped; we want Aries (0°) at 9 o'clock (SVG angle 180°)
  // and signs to run counter-clockwise (Cancer at top, etc.).
  const svgAngle = ((180 + longitude) % 360) * (Math.PI / 180);
  return {
    x: CX + r * Math.cos(svgAngle),
    y: CY + r * Math.sin(svgAngle),
  };
}

function longitudeFromPosition(sign: Sign, degree: number): number {
  return SIGNS_ORDER.indexOf(sign) * 30 + degree;
}

export function SkyWheel({ sky }: { sky: SkyState }) {
  const [hovered, setHovered] = useState<Body | null>(null);

  // The moon's longitude isn't directly exposed on SkyState; derive it
  // from its sign + cycle position. Close enough for the wheel.
  const moonLongitude = SIGNS_ORDER.indexOf(sky.moon.sign) * 30 + 15;
  const sunLongitude = longitudeFromPosition(sky.sun.sign, sky.sun.degree);

  const bodies: Body[] = [
    {
      key: "sun",
      glyph: "☉",
      label: "Sun",
      longitude: sunLongitude,
      detail: `Sun in ${sky.sun.sign}, ${Math.round(sky.sun.degree)}°`,
      highlight: true,
    },
    {
      key: "moon",
      glyph: sky.moon.phaseSymbol,
      label: "Moon",
      longitude: moonLongitude,
      detail: `${sky.moon.phaseName} moon in ${sky.moon.sign}`,
      highlight: true,
    },
    {
      key: "mercury",
      glyph: "☿",
      label: "Mercury",
      longitude: longitudeFromPosition(
        sky.planets.mercury.sign,
        sky.planets.mercury.degree,
      ),
      detail: `Mercury in ${sky.planets.mercury.sign}, ${Math.round(
        sky.planets.mercury.degree,
      )}°${sky.planets.mercury.retrograde ? " · retrograde" : ""}`,
    },
    {
      key: "venus",
      glyph: "♀",
      label: "Venus",
      longitude: longitudeFromPosition(
        sky.planets.venus.sign,
        sky.planets.venus.degree,
      ),
      detail: `Venus in ${sky.planets.venus.sign}, ${Math.round(
        sky.planets.venus.degree,
      )}°`,
    },
    {
      key: "mars",
      glyph: "♂",
      label: "Mars",
      longitude: longitudeFromPosition(
        sky.planets.mars.sign,
        sky.planets.mars.degree,
      ),
      detail: `Mars in ${sky.planets.mars.sign}, ${Math.round(
        sky.planets.mars.degree,
      )}°`,
    },
    {
      key: "jupiter",
      glyph: "♃",
      label: "Jupiter",
      longitude: longitudeFromPosition(
        sky.planets.jupiter.sign,
        sky.planets.jupiter.degree,
      ),
      detail: `Jupiter in ${sky.planets.jupiter.sign}, ${Math.round(
        sky.planets.jupiter.degree,
      )}°`,
    },
    {
      key: "saturn",
      glyph: "♄",
      label: "Saturn",
      longitude: longitudeFromPosition(
        sky.planets.saturn.sign,
        sky.planets.saturn.degree,
      ),
      detail: `Saturn in ${sky.planets.saturn.sign}, ${Math.round(
        sky.planets.saturn.degree,
      )}°`,
    },
  ];

  // Resolve crowding: bodies within 6° of each other get nudged outward
  // along the radius so glyphs don't stack on top of one another.
  const placed = bodies.map((b, i) => {
    const nearby = bodies.filter(
      (other, j) =>
        j !== i &&
        Math.abs(((other.longitude - b.longitude + 540) % 360) - 180) > 174,
    );
    const offset = nearby.length > 0 && i % 2 === 0 ? -16 : 0;
    return { body: b, ...place(b.longitude, PLANET_R + offset) };
  });

  return (
    <figure className="relative mx-auto w-full max-w-[520px]">
      <svg
        viewBox="0 0 520 520"
        className="w-full text-sage"
        role="img"
        aria-label={`Today's sky. Sun in ${sky.sun.sign}, moon in ${sky.moon.sign}.`}
      >
        {/* Outer ring */}
        <circle
          cx={CX}
          cy={CY}
          r={RING_OUTER}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.7"
        />
        <circle
          cx={CX}
          cy={CY}
          r={RING_INNER}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.4"
        />

        {/* Twelve sign segments */}
        {SIGNS_ORDER.map((sign, i) => {
          const startLng = i * 30;
          const startOuter = place(startLng, RING_OUTER);
          const startInner = place(startLng, RING_INNER);
          const midpoint = place(startLng + 15, (RING_OUTER + RING_INNER) / 2);
          const nameSpot = place(startLng + 15, RING_OUTER + 18);
          const isCurrentSun = sign === sky.sun.sign;
          const isCurrentMoon = sign === sky.moon.sign;

          return (
            <g key={sign}>
              {/* Radial divider */}
              <line
                x1={startInner.x}
                y1={startInner.y}
                x2={startOuter.x}
                y2={startOuter.y}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.5"
              />
              {/* Sign glyph */}
              <text
                x={midpoint.x}
                y={midpoint.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={
                  isCurrentSun
                    ? "fill-ochre"
                    : isCurrentMoon
                      ? "fill-parchment"
                      : "fill-sage"
                }
                fontSize="20"
                fontFamily="serif"
              >
                {SIGN_GLYPH[sign]}
              </text>
              {/* Sign name, just outside ring */}
              <text
                x={nameSpot.x}
                y={nameSpot.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-ash"
                fontSize="8"
                fontFamily="var(--font-inter), sans-serif"
                letterSpacing="0.15em"
                style={{ textTransform: "uppercase" }}
              >
                {sign.slice(0, 3)}
              </text>
            </g>
          );
        })}

        {/* Center mark — small cross */}
        <line
          x1={CX - 4}
          y1={CY}
          x2={CX + 4}
          y2={CY}
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.5"
        />
        <line
          x1={CX}
          y1={CY - 4}
          x2={CX}
          y2={CY + 4}
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.5"
        />

        {/* Planets */}
        {placed.map(({ body, x, y }) => (
          <g
            key={body.key}
            onMouseEnter={() => setHovered(body)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(body)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
            className="cursor-pointer outline-none"
            role="button"
            aria-label={body.detail}
          >
            <circle
              cx={x}
              cy={y}
              r={18}
              className="fill-earth"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className={body.highlight ? "fill-ochre" : "fill-parchment"}
              fontSize={body.key === "moon" ? 18 : 16}
              fontFamily="serif"
            >
              {body.glyph}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover/focus detail */}
      <figcaption
        className="mt-4 min-h-[24px] text-center font-sans text-xs uppercase tracking-[0.25em] text-ash transition-base"
        aria-live="polite"
      >
        {hovered
          ? hovered.detail
          : "Hover a planet · the sky as it is right now"}
      </figcaption>

    </figure>
  );
}
