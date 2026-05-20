/*
  Twenty-eight hand-coded SVG illustrations, one per card.

  Aesthetic: hairline botanical line drawings, single stroke weight,
  no fills. Each piece is composed in a 120 × 140 viewBox so the
  card front can lay it out against the same baseline.

  Strokes use `currentColor` so the parent can recolour them (sage on
  parchment for the daily card, moss on linen for the on-demand
  draw, etc.).
*/

import type { Card } from "@/lib/deck";

const COMMON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 0.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Frame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      width="120"
      height="140"
      {...COMMON}
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

// ─── Root (earth) ────────────────────────────────────────────────────────

function Seed({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <ellipse cx="60" cy="92" rx="14" ry="10" />
      <path d="M60 92 L60 110" />
      <path d="M60 100 L48 112" />
      <path d="M60 100 L72 112" />
      <path d="M60 82 L60 50" />
      <path d="M60 70 C 52 66, 50 56, 56 50" />
      <path d="M60 60 C 70 56, 72 46, 64 40" />
    </Frame>
  );
}

function Mycelium({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 30 L60 70" />
      <path d="M60 70 L40 100" />
      <path d="M60 70 L80 100" />
      <path d="M40 100 L28 116" />
      <path d="M40 100 L46 118" />
      <path d="M80 100 L92 116" />
      <path d="M80 100 L74 118" />
      <circle cx="60" cy="30" r="2" />
      <circle cx="28" cy="116" r="1.5" />
      <circle cx="46" cy="118" r="1.5" />
      <circle cx="92" cy="116" r="1.5" />
      <circle cx="74" cy="118" r="1.5" />
      <path d="M52 84 L60 70" strokeWidth="0.5" />
      <path d="M68 84 L60 70" strokeWidth="0.5" />
    </Frame>
  );
}

function Stone({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M30 92 C 28 70, 44 50, 62 50 C 84 50, 96 72, 92 96 C 88 110, 70 116, 56 114 C 38 112, 32 104, 30 92 Z" />
      <path d="M44 72 L60 90" strokeWidth="0.5" />
      <path d="M70 64 L78 84" strokeWidth="0.5" />
    </Frame>
  );
}

function Bark({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M40 20 L40 120" />
      <path d="M52 22 L50 60 L54 100 L52 120" />
      <path d="M64 22 L66 70 L62 120" />
      <path d="M76 20 L74 50 L78 120" />
      <path d="M88 24 L88 120" />
      <ellipse cx="58" cy="40" rx="4" ry="2.5" />
      <ellipse cx="70" cy="86" rx="3" ry="2" />
    </Frame>
  );
}

function Burrow({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M16 110 C 32 90, 50 88, 60 88 C 70 88, 88 90, 104 110" />
      <path d="M44 110 C 46 96, 54 90, 60 90 C 66 90, 74 96, 76 110 Z" />
      <path d="M16 110 L104 110" />
      <path d="M22 116 L98 116" strokeWidth="0.5" />
      <path d="M50 102 L58 100" strokeWidth="0.5" />
    </Frame>
  );
}

function Decay({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 24 C 40 40, 30 70, 40 100 C 50 116, 70 116, 80 100 C 90 70, 80 40, 60 24 Z" />
      <path d="M60 24 L60 110" />
      <circle cx="48" cy="60" r="3" />
      <circle cx="72" cy="72" r="2" />
      <circle cx="58" cy="86" r="2.5" />
      <path d="M44 50 L52 56" strokeWidth="0.5" />
      <path d="M68 90 L76 94" strokeWidth="0.5" />
    </Frame>
  );
}

function Harvest({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M50 30 L48 100" />
      <path d="M60 26 L60 102" />
      <path d="M70 30 L72 100" />
      <path d="M40 40 L50 50" />
      <path d="M50 38 L60 48" />
      <path d="M60 36 L70 46" />
      <path d="M70 38 L80 48" />
      <path d="M44 60 L52 70" />
      <path d="M60 58 L68 68" />
      <path d="M68 62 L78 72" />
      <path d="M40 110 C 60 100, 80 100, 90 110" />
    </Frame>
  );
}

// ─── Tide (water) ────────────────────────────────────────────────────────

function Current({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M20 50 C 40 38, 60 62, 80 50 C 92 42, 100 48, 100 58" />
      <path d="M20 76 C 40 64, 60 88, 80 76 C 92 68, 100 74, 100 84" />
      <path d="M20 102 C 40 90, 60 114, 80 102 C 92 94, 100 100, 100 110" />
    </Frame>
  );
}

function Depth({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M20 40 L60 120 L100 40" />
      <path d="M30 40 L60 100" strokeWidth="0.5" />
      <path d="M90 40 L60 100" strokeWidth="0.5" />
      <path d="M44 60 L60 92" strokeWidth="0.5" />
      <path d="M76 60 L60 92" strokeWidth="0.5" />
      <circle cx="60" cy="120" r="1.5" />
    </Frame>
  );
}

function Shore({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M16 70 C 30 60, 44 80, 58 70 C 72 60, 86 80, 100 70 C 108 66, 110 70, 108 74" />
      <path d="M16 92 L104 92" />
      <path d="M20 100 L40 100" strokeWidth="0.5" />
      <path d="M52 100 L76 100" strokeWidth="0.5" />
      <path d="M84 100 L100 100" strokeWidth="0.5" />
      <path d="M28 108 L56 108" strokeWidth="0.5" />
      <path d="M64 108 L96 108" strokeWidth="0.5" />
    </Frame>
  );
}

function Mist({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M16 40 L48 40" />
      <path d="M58 40 L92 40" />
      <path d="M22 56 L80 56" />
      <path d="M86 56 L104 56" />
      <path d="M16 72 L40 72" />
      <path d="M50 72 L104 72" />
      <path d="M28 88 L60 88" />
      <path d="M70 88 L98 88" />
      <path d="M16 104 L40 104" />
      <path d="M50 104 L88 104" />
    </Frame>
  );
}

function Rain({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M28 30 L20 50" />
      <path d="M44 28 L36 48" />
      <path d="M60 30 L52 50" />
      <path d="M76 28 L68 48" />
      <path d="M92 30 L84 50" />
      <path d="M36 60 L28 80" />
      <path d="M52 60 L44 80" />
      <path d="M68 60 L60 80" />
      <path d="M84 60 L76 80" />
      <path d="M28 90 L20 110" />
      <path d="M44 90 L36 110" />
      <path d="M60 90 L52 110" />
      <path d="M76 90 L68 110" />
      <path d="M92 90 L84 110" />
    </Frame>
  );
}

function Ice({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 30 L60 110" />
      <path d="M30 70 L90 70" />
      <path d="M40 50 L80 90" />
      <path d="M80 50 L40 90" />
      <path d="M60 30 L52 40" />
      <path d="M60 30 L68 40" />
      <path d="M60 110 L52 100" />
      <path d="M60 110 L68 100" />
      <path d="M30 70 L40 64" />
      <path d="M30 70 L40 76" />
      <path d="M90 70 L80 64" />
      <path d="M90 70 L80 76" />
    </Frame>
  );
}

function Thaw({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M40 28 L60 28 L80 28" />
      <path d="M48 28 L48 60 L60 76 L72 60 L72 28" />
      <path d="M56 28 L56 50" strokeWidth="0.5" />
      <path d="M64 28 L64 50" strokeWidth="0.5" />
      <ellipse cx="60" cy="100" rx="6" ry="8" />
      <path d="M60 90 L60 84" />
    </Frame>
  );
}

// ─── Blade (air) ─────────────────────────────────────────────────────────

function Wind({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M16 50 C 40 40, 70 50, 90 44 C 98 42, 102 46, 100 52" />
      <path d="M16 74 C 50 64, 80 74, 100 70" />
      <path d="M16 96 C 40 86, 60 96, 80 92 C 90 90, 92 94, 88 98" />
    </Frame>
  );
}

function Threshold({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M30 110 L30 60 C 30 36, 50 24, 60 24 C 70 24, 90 36, 90 60 L90 110" />
      <path d="M30 110 L90 110" />
      <path d="M40 110 L40 70 C 40 50, 50 40, 60 40 C 70 40, 80 50, 80 70 L80 110" strokeWidth="0.5" />
    </Frame>
  );
}

function Echo({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="60" cy="70" r="3" />
      <path d="M40 70 A 20 20 0 0 1 80 70" />
      <path d="M30 70 A 30 30 0 0 1 90 70" />
      <path d="M20 70 A 40 40 0 0 1 100 70" />
    </Frame>
  );
}

function Smoke({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M52 110 C 52 100, 64 96, 64 86 C 64 76, 52 72, 52 62 C 52 52, 64 48, 64 38 C 64 30, 60 26, 56 24" />
      <path d="M68 110 C 70 102, 78 98, 78 88 C 78 78, 70 76, 72 66 C 74 56, 84 52, 84 42" />
      <path d="M44 110 L88 110" />
    </Frame>
  );
}

function Flight({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M16 70 C 30 50, 44 50, 60 64 C 76 50, 90 50, 104 70" />
      <path d="M44 64 C 50 56, 70 56, 76 64" strokeWidth="0.5" />
      <path d="M60 64 L60 78" />
      <path d="M56 76 L64 76" />
    </Frame>
  );
}

function Silence({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="60" cy="70" r="32" />
      <path d="M60 38 L60 102" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M28 70 L92 70" strokeWidth="0.5" strokeDasharray="2 2" />
    </Frame>
  );
}

function Storm({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M30 40 L66 40 L48 70 L72 70 L40 116 L56 84 L36 84 L52 40" />
    </Frame>
  );
}

// ─── Ember (fire) ────────────────────────────────────────────────────────

function Spark({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="60" cy="70" r="3" />
      <path d="M60 50 L60 36" />
      <path d="M60 90 L60 104" />
      <path d="M40 70 L26 70" />
      <path d="M80 70 L94 70" />
      <path d="M46 56 L36 46" />
      <path d="M74 56 L84 46" />
      <path d="M46 84 L36 94" />
      <path d="M74 84 L84 94" />
    </Frame>
  );
}

function Flame({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M60 24 C 50 44, 38 56, 38 80 C 38 102, 50 116, 60 116 C 70 116, 82 102, 82 80 C 82 58, 70 50, 64 38 C 62 50, 56 56, 54 64" />
      <path d="M58 80 C 58 88, 62 94, 64 100" strokeWidth="0.5" />
    </Frame>
  );
}

function Ash({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M30 110 C 50 100, 70 100, 90 110" />
      <path d="M30 110 L90 110" />
      <circle cx="44" cy="100" r="1.2" />
      <circle cx="60" cy="96" r="1.5" />
      <circle cx="74" cy="100" r="1.2" />
      <circle cx="52" cy="86" r="1" />
      <circle cx="66" cy="84" r="1" />
      <circle cx="58" cy="72" r="0.8" />
      <circle cx="60" cy="60" r="0.6" />
      <path d="M60 70 C 58 78, 62 84, 60 88" strokeWidth="0.5" />
    </Frame>
  );
}

function Hearth({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M24 110 L96 110" />
      <path d="M24 110 L24 94 L96 94 L96 110" />
      <path d="M24 94 L96 94" />
      <path d="M36 94 L36 110" strokeWidth="0.5" />
      <path d="M60 94 L60 110" strokeWidth="0.5" />
      <path d="M84 94 L84 110" strokeWidth="0.5" />
      <path d="M48 94 C 46 80, 56 76, 56 64 C 56 56, 62 54, 64 60 C 66 70, 60 72, 64 82 C 66 90, 74 86, 76 94" />
      <path d="M70 80 C 70 86, 74 90, 72 94" strokeWidth="0.5" />
    </Frame>
  );
}

function Forge({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M28 100 L92 100" />
      <path d="M36 100 L36 84 L84 84 L84 100" />
      <path d="M30 84 L90 84" />
      <path d="M44 84 C 44 76, 50 70, 60 70 C 70 70, 76 76, 76 84" />
      <path d="M50 64 L52 56" />
      <path d="M60 60 L60 50" />
      <path d="M70 64 L68 56" />
      <path d="M44 72 L40 66" strokeWidth="0.5" />
      <path d="M76 72 L80 66" strokeWidth="0.5" />
    </Frame>
  );
}

function Char({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M20 80 C 30 60, 60 60, 80 80 C 90 90, 100 80, 102 84" />
      <path d="M20 80 C 26 90, 60 96, 80 80" />
      <path d="M30 76 L34 84" strokeWidth="0.5" />
      <path d="M44 70 L48 88" strokeWidth="0.5" />
      <path d="M60 68 L60 90" strokeWidth="0.5" />
      <path d="M74 76 L76 86" strokeWidth="0.5" />
      <path d="M22 110 C 40 102, 60 106, 80 110" />
    </Frame>
  );
}

function Dawn({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M14 100 L106 100" />
      <path d="M30 100 A 30 30 0 0 1 90 100" />
      <path d="M60 60 L60 46" />
      <path d="M38 78 L28 70" />
      <path d="M82 78 L92 70" />
      <path d="M46 64 L40 54" />
      <path d="M74 64 L80 54" />
      <path d="M18 108 L40 108" strokeWidth="0.5" />
      <path d="M80 108 L102 108" strokeWidth="0.5" />
    </Frame>
  );
}

// ─── Dispatch ────────────────────────────────────────────────────────────

const ART: Record<string, React.FC<{ className?: string }>> = {
  Seed,
  Mycelium,
  Stone,
  Bark,
  Burrow,
  Decay,
  Harvest,
  Current,
  Depth,
  Shore,
  Mist,
  Rain,
  Ice,
  Thaw,
  Wind,
  Threshold,
  Echo,
  Smoke,
  Flight,
  Silence,
  Storm,
  Spark,
  Flame,
  Ash,
  Hearth,
  Forge,
  Char,
  Dawn,
};

export function CardArt({
  card,
  className,
}: {
  card: Pick<Card, "name">;
  className?: string;
}) {
  const Component = ART[card.name];
  if (!Component) {
    return <Frame className={className}><circle cx="60" cy="70" r="24" /></Frame>;
  }
  return <Component className={className} />;
}
