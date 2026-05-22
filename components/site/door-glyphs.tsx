/*
  Hand-drawn botanical / organic glyphs for the four hub doors. Each
  reads as a specimen pulled from a herbarium drawer — not a UI icon.
  Strokes use currentColor so the parent can recolour them on hover.
*/

interface GlyphProps {
  className?: string;
}

const COMMON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** The reading — a sprouting seedling pushing through soil. */
export function SeedlingGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" {...COMMON} className={className} aria-hidden>
      {/* Soil line */}
      <path
        d="M8 56 C 20 54, 30 58, 40 56 C 50 54, 60 58, 72 56"
        strokeWidth="0.6"
        strokeDasharray="2 3"
        opacity="0.6"
      />
      {/* Roots */}
      <path d="M40 56 L 40 70" strokeWidth="0.6" opacity="0.7" />
      <path d="M40 60 C 36 64, 30 66, 24 68" strokeWidth="0.5" opacity="0.6" />
      <path d="M40 60 C 44 64, 50 66, 56 68" strokeWidth="0.5" opacity="0.6" />
      <path d="M40 64 C 36 67, 32 70, 28 73" strokeWidth="0.5" opacity="0.5" />
      <path d="M40 64 C 44 67, 48 70, 52 73" strokeWidth="0.5" opacity="0.5" />

      {/* Stem rising */}
      <path d="M40 56 L 40 22" />

      {/* Cotyledon leaves at top */}
      <path d="M40 24 C 30 22, 24 18, 22 10 C 30 12, 38 16, 40 24 Z" />
      <path d="M40 24 C 50 22, 56 18, 58 10 C 50 12, 42 16, 40 24 Z" />
      {/* Leaf veins */}
      <path d="M40 24 L 26 14" strokeWidth="0.5" opacity="0.6" />
      <path d="M40 24 L 54 14" strokeWidth="0.5" opacity="0.6" />

      {/* Tiny shoot tip */}
      <circle cx="40" cy="22" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** The card — a pressed botanical specimen, labelled. */
export function PressedLeafGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" {...COMMON} className={className} aria-hidden>
      {/* Specimen card outline */}
      <rect x="14" y="8" width="52" height="64" strokeWidth="0.7" />
      {/* Label box at the foot */}
      <rect x="22" y="58" width="36" height="9" strokeWidth="0.5" opacity="0.6" />
      <line x1="26" y1="62.5" x2="54" y2="62.5" strokeWidth="0.4" opacity="0.5" />
      <line x1="26" y1="64.5" x2="48" y2="64.5" strokeWidth="0.4" opacity="0.4" />

      {/* Pressed leaf — sage shape with veins */}
      <path d="M40 16 C 28 22, 22 32, 22 44 C 22 50, 28 54, 32 54 C 36 54, 40 50, 40 44 L 40 16 Z" />
      <path d="M40 16 C 52 22, 58 32, 58 44 C 58 50, 52 54, 48 54 C 44 54, 40 50, 40 44 Z" />
      {/* Central vein */}
      <path d="M40 18 L 40 52" strokeWidth="0.6" />
      {/* Side veins */}
      <path d="M40 26 L 30 30" strokeWidth="0.4" opacity="0.7" />
      <path d="M40 26 L 50 30" strokeWidth="0.4" opacity="0.7" />
      <path d="M40 34 L 28 38" strokeWidth="0.4" opacity="0.7" />
      <path d="M40 34 L 52 38" strokeWidth="0.4" opacity="0.7" />
      <path d="M40 42 L 30 46" strokeWidth="0.4" opacity="0.6" />
      <path d="M40 42 L 50 46" strokeWidth="0.4" opacity="0.6" />

      {/* Pin marks */}
      <circle cx="22" cy="14" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="58" cy="14" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** The journal — a feather and a single ink drop. */
export function FeatherGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" {...COMMON} className={className} aria-hidden>
      {/* Shaft */}
      <path d="M22 64 C 30 50, 40 32, 56 14" strokeWidth="1.2" />
      {/* Plume — barbs along the shaft */}
      <path d="M48 22 C 44 22, 42 24, 42 28" strokeWidth="0.6" />
      <path d="M52 18 C 50 18, 48 20, 48 24" strokeWidth="0.6" />
      <path d="M43 30 C 38 30, 35 32, 35 38" strokeWidth="0.6" />
      <path d="M47 24 C 40 24, 36 26, 35 32" strokeWidth="0.6" />
      <path d="M38 38 C 32 38, 28 40, 28 46" strokeWidth="0.6" />
      <path d="M42 32 C 34 32, 30 34, 30 40" strokeWidth="0.6" />
      <path d="M32 46 C 26 46, 22 48, 22 54" strokeWidth="0.6" />
      <path d="M36 40 C 28 40, 24 42, 24 48" strokeWidth="0.6" />

      {/* Outer feather curve, suggesting the plume outline */}
      <path d="M56 14 C 48 22, 38 36, 28 50" strokeWidth="0.5" opacity="0.6" />
      <path d="M56 14 C 52 16, 48 22, 44 30" strokeWidth="0.5" opacity="0.5" />

      {/* Nib tip — sharper */}
      <path d="M22 64 L 18 68" strokeWidth="1.2" />

      {/* Ink drop falling */}
      <path
        d="M28 72 C 26 70, 26 67, 28 65 C 30 67, 30 70, 28 72 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.4"
      />
    </svg>
  );
}

/** Your chart — a mycelial root network, the underground system. */
export function MyceliumGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 80 80" width="72" height="72" {...COMMON} className={className} aria-hidden>
      {/* Mushroom cap above the soil */}
      <path
        d="M30 28 C 30 22, 36 18, 40 18 C 44 18, 50 22, 50 28 C 46 30, 34 30, 30 28 Z"
        strokeWidth="0.9"
      />
      <line x1="40" y1="28" x2="40" y2="38" strokeWidth="0.9" />
      <path d="M37 38 L 37 44 L 43 44 L 43 38" strokeWidth="0.6" opacity="0.7" />

      {/* Soil line */}
      <path
        d="M6 46 C 20 44, 30 48, 40 46 C 50 44, 60 48, 74 46"
        strokeWidth="0.5"
        strokeDasharray="2 2.5"
        opacity="0.55"
      />

      {/* Mycelial network beneath */}
      <path d="M40 44 L 40 56" strokeWidth="0.7" />
      <path d="M40 52 L 30 58" strokeWidth="0.6" />
      <path d="M40 52 L 50 58" strokeWidth="0.6" />
      <path d="M30 58 L 22 64" strokeWidth="0.5" />
      <path d="M30 58 L 32 66" strokeWidth="0.5" />
      <path d="M50 58 L 58 64" strokeWidth="0.5" />
      <path d="M50 58 L 48 66" strokeWidth="0.5" />
      <path d="M22 64 L 14 70" strokeWidth="0.4" opacity="0.7" />
      <path d="M22 64 L 24 72" strokeWidth="0.4" opacity="0.7" />
      <path d="M58 64 L 66 70" strokeWidth="0.4" opacity="0.7" />
      <path d="M58 64 L 56 72" strokeWidth="0.4" opacity="0.7" />
      <path d="M40 56 L 38 68" strokeWidth="0.4" opacity="0.6" />

      {/* Tiny secondary mushroom heads */}
      <circle cx="14" cy="70" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="66" cy="70" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="24" cy="72" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="56" cy="72" r="1" fill="currentColor" opacity="0.5" />

      {/* Nodes on the network */}
      <circle cx="40" cy="52" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="58" r="1.2" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="58" r="1.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
