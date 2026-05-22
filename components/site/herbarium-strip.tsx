/*
  A narrow vertical herbarium specimen — sits alongside the hub doors
  as a decorative botanical column. Two specimens: a flowering sprig
  at the top, a mushroom and root network at the bottom, connected by
  a faint vertical thread of "soil line".

  Hidden on small viewports, present from md+ where there's room.
*/
export function HerbariumStrip({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 600"
      width="80"
      height="600"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {/* ─── Top: flowering sprig ──────────────────────────────────────── */}
      <g className="sway-slow" style={{ transformBox: "fill-box" }}>
        <g stroke="var(--color-moss)" strokeWidth="1.1">
          {/* Main stem */}
          <path d="M40 240 C 42 200, 38 160, 40 120 C 42 90, 38 60, 40 30" />
          {/* Leaves */}
          <path d="M40 200 C 24 196, 14 188, 8 174 C 18 184, 28 192, 40 200" />
          <path d="M40 180 C 56 176, 66 168, 72 154 C 62 164, 52 172, 40 180" />
          <path d="M40 150 C 24 146, 14 138, 8 124 C 18 134, 28 142, 40 150" />
          <path d="M40 130 C 56 126, 66 118, 72 104 C 62 114, 52 122, 40 130" />
          <path d="M40 100 C 28 96, 22 88, 18 76 C 26 84, 34 92, 40 100" />
        </g>
        {/* Flower cluster */}
        <g stroke="var(--color-clay)" strokeWidth="1">
          <circle cx="40" cy="50" r="9" fill="var(--color-clay)" fillOpacity="0.25" />
          <circle cx="26" cy="36" r="6" fill="var(--color-clay)" fillOpacity="0.25" />
          <circle cx="54" cy="36" r="6" fill="var(--color-clay)" fillOpacity="0.25" />
          <circle cx="40" cy="22" r="4.5" fill="var(--color-clay)" fillOpacity="0.25" />
        </g>
        <g stroke="var(--color-bark)" strokeWidth="0.9">
          <circle cx="40" cy="50" r="2" fill="var(--color-bark)" />
          <circle cx="26" cy="36" r="1.4" fill="var(--color-bark)" />
          <circle cx="54" cy="36" r="1.4" fill="var(--color-bark)" />
          <circle cx="40" cy="22" r="1.2" fill="var(--color-bark)" />
        </g>
        {/* Petal hatching for warmth */}
        <g stroke="var(--color-ember)" strokeWidth="0.5" opacity="0.7">
          <path d="M32 44 L 38 48" />
          <path d="M48 44 L 42 48" />
          <path d="M32 56 L 38 52" />
          <path d="M48 56 L 42 52" />
        </g>
      </g>

      {/* Soil line — broken, decorative */}
      <line
        x1="10"
        y1="280"
        x2="70"
        y2="280"
        stroke="var(--color-bark)"
        strokeWidth="0.5"
        opacity="0.45"
        strokeDasharray="2 4"
      />

      {/* ─── Middle: a quiet hand-set Latin caption ───────────────────── */}
      <text
        x="40"
        y="298"
        textAnchor="middle"
        fontFamily="var(--font-fell), serif"
        fontSize="8"
        fontStyle="italic"
        fill="var(--color-bark)"
        opacity="0.5"
        letterSpacing="0.15em"
      >
        ex herbario
      </text>

      {/* ─── Bottom: mushrooms + mycelium ──────────────────────────────── */}
      <g className="sway-counter" style={{ transformBox: "fill-box" }}>
        {/* Mushroom cap */}
        <g stroke="var(--color-bark)" strokeWidth="1.1" fill="var(--color-bone)">
          <path d="M28 360 C 28 348, 36 342, 40 342 C 44 342, 52 348, 52 360 C 46 364, 34 364, 28 360 Z" />
        </g>
        <line x1="40" y1="360" x2="40" y2="378" stroke="var(--color-bark)" strokeWidth="1" />
        <path
          d="M36 378 L 36 388 L 44 388 L 44 378"
          stroke="var(--color-bark)"
          strokeWidth="0.7"
          opacity="0.65"
        />
        {/* Cap freckles */}
        <g fill="var(--color-clay)" opacity="0.6">
          <circle cx="34" cy="354" r="1.2" />
          <circle cx="42" cy="350" r="1.4" />
          <circle cx="48" cy="354" r="1" />
        </g>
        {/* Cap gills underneath */}
        <g stroke="var(--color-bark)" strokeWidth="0.4" opacity="0.5">
          <line x1="32" y1="361" x2="34" y2="364" />
          <line x1="36" y1="361" x2="36" y2="364" />
          <line x1="40" y1="361" x2="40" y2="364" />
          <line x1="44" y1="361" x2="44" y2="364" />
          <line x1="48" y1="361" x2="46" y2="364" />
        </g>

        {/* Second smaller mushroom */}
        <g stroke="var(--color-bark)" strokeWidth="0.9" fill="var(--color-bone)">
          <path d="M58 388 C 58 380, 63 376, 66 376 C 69 376, 74 380, 74 388 C 70 391, 62 391, 58 388 Z" />
        </g>
        <line x1="66" y1="388" x2="66" y2="400" stroke="var(--color-bark)" strokeWidth="0.8" />

        {/* Mycelial network */}
        <g stroke="var(--color-moss)" strokeWidth="0.6">
          <path d="M40 388 L 40 410" />
          <path d="M40 410 L 28 422" />
          <path d="M40 410 L 52 422" />
          <path d="M28 422 L 18 434" />
          <path d="M28 422 L 26 438" />
          <path d="M52 422 L 62 434" />
          <path d="M52 422 L 54 438" />
          <path d="M40 410 L 38 426" strokeWidth="0.5" opacity="0.7" />
          <path d="M18 434 L 12 444" strokeWidth="0.4" opacity="0.6" />
          <path d="M62 434 L 68 444" strokeWidth="0.4" opacity="0.6" />
        </g>
        <g fill="var(--color-moss)" opacity="0.8">
          <circle cx="40" cy="410" r="1.4" />
          <circle cx="28" cy="422" r="1.2" />
          <circle cx="52" cy="422" r="1.2" />
          <circle cx="18" cy="434" r="0.9" />
          <circle cx="62" cy="434" r="0.9" />
        </g>

        {/* A small fern unfurling at the foot */}
        <g stroke="var(--color-sage)" strokeWidth="0.8">
          <path d="M40 460 C 40 480, 44 500, 50 520" />
          <path d="M44 480 C 38 482, 32 480, 28 474" strokeWidth="0.5" />
          <path d="M46 500 C 40 502, 34 500, 30 494" strokeWidth="0.5" />
          <path d="M48 516 C 56 514, 60 510, 60 504" strokeWidth="0.5" />
          {/* Fiddlehead curl */}
          <path d="M50 520 C 56 522, 58 518, 56 514 C 54 512, 52 514, 54 516" strokeWidth="0.7" />
        </g>
      </g>

      {/* Ground line at the foot */}
      <line
        x1="10"
        y1="580"
        x2="70"
        y2="580"
        stroke="var(--color-bark)"
        strokeWidth="0.5"
        opacity="0.4"
        strokeDasharray="1 3"
      />
    </svg>
  );
}
