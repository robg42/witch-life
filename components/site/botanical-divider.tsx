/*
  A hairline botanical divider — used between sections in long-form
  pages instead of plain <hr>. Six leaves curling outward from a centre
  sprig.
*/
export function BotanicalDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 24"
      className={`text-moss/60 ${className}`}
      width="240"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeLinecap="round"
    >
      <line x1="0" y1="12" x2="92" y2="12" />
      <line x1="148" y1="12" x2="240" y2="12" />
      {/* centre sprig */}
      <path d="M120 4 L120 20" />
      <path d="M120 9 C 115 9, 112 7, 110 5" />
      <path d="M120 9 C 125 9, 128 7, 130 5" />
      <path d="M120 13 C 114 13, 110 11, 107 8" />
      <path d="M120 13 C 126 13, 130 11, 133 8" />
      <path d="M120 17 C 116 17, 113 15, 112 13" />
      <path d="M120 17 C 124 17, 127 15, 128 13" />
    </svg>
  );
}
