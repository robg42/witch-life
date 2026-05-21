/*
  Multi-coloured botanical illustration — Witch Life's herbarium plate.
  Three specimens, hand-coded: a moss stem with sage leaves, a tall
  stem with clay-coloured blossoms, and a saffron berry stem.

  Uses explicit token colours rather than currentColor so the plate
  reads as a painted illustration, not a single-tone decoration.
*/
export function HerbariumPlate({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 600"
      width="400"
      height="600"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* ─── Left specimen: moss stem with sage leaves ─────────────────── */}
      <g className="sway" style={{ transformBox: "fill-box" }}>
        <g stroke="var(--color-moss)" strokeWidth="1.2">
        <path d="M80 580 C 78 480, 84 380, 80 280 C 76 200, 86 120, 80 40" />
        <path d="M80 480 C 50 470, 30 478, 14 496 C 36 484, 60 478, 80 480" />
        <path d="M80 420 C 110 410, 130 418, 146 436 C 124 424, 100 418, 80 420" />
        <path d="M80 360 C 50 350, 30 358, 14 376 C 36 364, 60 358, 80 360" />
        <path d="M80 300 C 110 290, 130 298, 146 316 C 124 304, 100 298, 80 300" />
        <path d="M80 240 C 50 230, 30 238, 14 256 C 36 244, 60 238, 80 240" />
        <path d="M80 180 C 110 170, 130 178, 146 196 C 124 184, 100 178, 80 180" />
      </g>
      <g stroke="var(--color-sage)" strokeWidth="0.5">
        <path d="M80 480 C 60 472, 40 470, 22 482" />
        <path d="M80 420 C 100 412, 120 410, 138 422" />
      </g>
      <g stroke="var(--color-moss)" strokeWidth="1">
        <path
          d="M80 40 C 76 32, 78 22, 84 18 C 86 26, 84 34, 80 40 Z"
          fill="var(--color-sage)"
          fillOpacity="0.3"
        />
      </g>
      </g>

      {/* ─── Centre specimen: tall stem with clay flowers ──────────────── */}
      <g className="sway-slow" style={{ transformBox: "fill-box" }}>
      <g stroke="var(--color-bark)" strokeWidth="1.4">
        <path d="M200 580 C 200 480, 204 380, 200 280 C 196 200, 204 120, 200 30" />
      </g>
      <g stroke="var(--color-moss)" strokeWidth="1">
        <path d="M200 460 C 170 450, 150 440, 132 422 C 156 442, 180 458, 200 466" />
        <path d="M200 460 C 230 450, 250 440, 268 422 C 244 442, 220 458, 200 466" />
        <path d="M200 380 C 174 372, 160 360, 150 344 C 168 360, 188 374, 200 384" />
        <path d="M200 320 C 226 312, 240 300, 250 284 C 232 300, 212 314, 200 324" />
      </g>
      <g stroke="var(--color-clay)" strokeWidth="1.3">
        <circle
          cx="200"
          cy="120"
          r="22"
          fill="var(--color-clay)"
          fillOpacity="0.22"
        />
        <circle
          cx="170"
          cy="90"
          r="14"
          fill="var(--color-clay)"
          fillOpacity="0.22"
        />
        <circle
          cx="230"
          cy="90"
          r="14"
          fill="var(--color-clay)"
          fillOpacity="0.22"
        />
        <circle
          cx="200"
          cy="60"
          r="10"
          fill="var(--color-clay)"
          fillOpacity="0.22"
        />
      </g>
      <g stroke="var(--color-bark)" strokeWidth="1.2">
        <circle cx="200" cy="120" r="3.5" fill="var(--color-bark)" />
        <circle cx="170" cy="90" r="2.5" fill="var(--color-bark)" />
        <circle cx="230" cy="90" r="2.5" fill="var(--color-bark)" />
        <circle cx="200" cy="60" r="2" fill="var(--color-bark)" />
      </g>
      <g stroke="var(--color-ember)" strokeWidth="0.6" opacity="0.7">
        <path d="M186 108 L 196 116" />
        <path d="M214 108 L 204 116" />
        <path d="M186 132 L 196 124" />
        <path d="M214 132 L 204 124" />
        <path d="M158 82 L 166 88" />
        <path d="M242 82 L 234 88" />
      </g>
      </g>

      {/* ─── Right specimen: berry stem in saffron ─────────────────────── */}
      <g className="sway-counter" style={{ transformBox: "fill-box" }}>
      <g stroke="var(--color-moss)" strokeWidth="1.2">
        <path d="M320 580 C 322 480, 318 380, 322 280 C 326 200, 318 120, 322 60" />
      </g>
      <g stroke="var(--color-sage)" strokeWidth="0.9">
        <path d="M322 400 C 348 396, 364 388, 376 376 C 360 388, 342 398, 322 406" />
        <path d="M322 340 C 296 336, 280 328, 268 316 C 284 328, 302 338, 322 346" />
        <path d="M322 280 C 348 276, 364 268, 376 256 C 360 268, 342 278, 322 286" />
      </g>
      <g fill="var(--color-saffron)" stroke="var(--color-ochre)" strokeWidth="0.7">
        <circle cx="322" cy="200" r="6" />
        <circle cx="314" cy="208" r="5" />
        <circle cx="330" cy="208" r="5" />
        <circle cx="318" cy="216" r="5" />
        <circle cx="326" cy="216" r="6" />
        <circle cx="322" cy="224" r="5" />

        <circle cx="306" cy="160" r="5" />
        <circle cx="316" cy="160" r="5" />
        <circle cx="338" cy="160" r="5" />
        <circle cx="328" cy="160" r="5" />

        <circle cx="322" cy="120" r="4" />
        <circle cx="314" cy="126" r="4" />
        <circle cx="330" cy="126" r="4" />

        <circle cx="322" cy="84" r="3.5" />
      </g>
      </g>

      {/* Ground line — herbarium mount */}
      <line
        x1="20"
        y1="588"
        x2="380"
        y2="588"
        stroke="var(--color-bark)"
        strokeWidth="0.5"
        opacity="0.35"
        strokeDasharray="2 4"
      />
      {/* Optional Latin label line */}
      <text
        x="200"
        y="600"
        textAnchor="middle"
        fontFamily="var(--font-fell), serif"
        fontSize="9"
        fontStyle="italic"
        fill="var(--color-bark)"
        opacity="0.5"
        letterSpacing="0.1em"
      >
        ex herbario · witch life
      </text>
    </svg>
  );
}
