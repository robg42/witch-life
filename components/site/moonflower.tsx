/*
  Hero botanical — a stylised single-line moonflower with bud, leaves
  and tendrils, anchored to a vertical axis. Larger than the inline
  dividers; meant to be a present visual centerpiece on the landing.

  Hairline strokes only, currentColor so the parent controls tone.
*/
export function Moonflower({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 400"
      width="240"
      height="400"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Stem */}
      <path d="M120 396 C 120 340, 116 280, 120 220 C 124 170, 116 110, 120 50" />

      {/* Lower leaves — pair */}
      <path d="M120 320 C 90 320, 70 332, 56 348 C 76 346, 100 340, 120 330" />
      <path d="M120 320 C 150 320, 170 332, 184 348 C 164 346, 140 340, 120 330" />
      <path d="M88 336 L 70 344" strokeWidth="0.5" />
      <path d="M152 336 L 170 344" strokeWidth="0.5" />

      {/* Mid leaves — single right */}
      <path d="M120 250 C 152 250, 174 262, 188 282 C 168 280, 144 270, 122 262" />
      <path d="M156 268 L 178 274" strokeWidth="0.5" />

      {/* Mid leaves — single left */}
      <path d="M120 200 C 90 200, 70 210, 56 226 C 76 224, 100 218, 120 210" />
      <path d="M86 214 L 66 220" strokeWidth="0.5" />

      {/* Small leaves higher up */}
      <path d="M120 150 C 134 144, 144 134, 150 120 C 138 124, 128 134, 120 144" />
      <path d="M120 130 C 106 126, 96 118, 92 106 C 102 110, 112 120, 120 128" />

      {/* Bud below blossom */}
      <path d="M120 90 C 112 88, 108 80, 110 70 C 116 78, 124 80, 130 76 C 128 84, 124 90, 120 90 Z" />

      {/* Blossom */}
      <circle cx="120" cy="46" r="34" strokeWidth="0.75" />
      {/* Six radiating petals */}
      <path d="M120 12 C 116 22, 116 36, 120 46 C 124 36, 124 22, 120 12 Z" />
      <path d="M86 32 C 96 30, 110 36, 118 46 C 110 50, 96 46, 86 32 Z" />
      <path d="M154 32 C 144 30, 130 36, 122 46 C 130 50, 144 46, 154 32 Z" />
      <path d="M86 60 C 96 62, 110 56, 118 46 C 110 42, 96 46, 86 60 Z" />
      <path d="M154 60 C 144 62, 130 56, 122 46 C 130 42, 144 46, 154 60 Z" />
      <path d="M120 80 C 116 70, 116 56, 120 46 C 124 56, 124 70, 120 80 Z" />
      {/* Central pistil */}
      <circle cx="120" cy="46" r="3.5" />
      <path d="M120 42.5 L 120 49.5" strokeWidth="0.5" />
      <path d="M116.5 46 L 123.5 46" strokeWidth="0.5" />

      {/* Tendril */}
      <path d="M120 380 C 100 388, 70 384, 56 374" strokeWidth="0.5" />
      <path d="M120 380 C 140 388, 170 384, 184 374" strokeWidth="0.5" />
    </svg>
  );
}
