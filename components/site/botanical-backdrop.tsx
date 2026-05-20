/*
  Large, faded botanical watermark SVG — sits behind sections as
  decorative texture. Composes a single ink-drawing herb stem with a
  flowering top, traced at hairline thickness. Used at very low opacity
  so it reads as background grain, not illustration.

  Variants control which way it leans and a rough proportional aspect.
*/
export function BotanicalBackdrop({
  variant = "left",
  className = "",
}: {
  variant?: "left" | "right" | "center";
  className?: string;
}) {
  const flip = variant === "right";
  return (
    <svg
      viewBox="0 0 400 800"
      width="400"
      height="800"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* Stem */}
      <path d="M200 780 C 196 720, 204 660, 200 600 C 196 540, 204 480, 200 420 C 196 360, 204 300, 200 240 C 196 180, 204 120, 200 40" />

      {/* Lower large leaf — left */}
      <path d="M200 700 C 150 700, 100 720, 60 750 C 90 740, 140 720, 200 720" />
      <path d="M200 700 C 160 690, 130 680, 110 660" strokeWidth="0.4" />

      {/* Lower right leaf */}
      <path d="M200 640 C 240 640, 280 660, 320 690 C 280 670, 240 660, 200 660" />

      {/* Mid leaves */}
      <path d="M200 540 C 160 535, 130 525, 100 510 C 140 525, 175 535, 200 545" />
      <path d="M200 460 C 240 455, 270 445, 295 430 C 260 445, 225 455, 200 465" />

      {/* Upper leaves */}
      <path d="M200 380 C 170 375, 145 370, 125 360 C 155 370, 180 380, 200 388" />
      <path d="M200 320 C 230 315, 255 308, 275 295 C 250 308, 220 315, 200 322" />

      {/* Buds */}
      <path d="M200 250 C 195 244, 192 236, 196 230 C 200 234, 206 234, 210 230 C 212 238, 208 246, 200 250 Z" />
      <path d="M200 200 C 196 196, 192 190, 194 184 C 200 186, 208 186, 214 184 C 214 192, 208 198, 200 200 Z" />

      {/* Crowning flowers (small cluster) */}
      <circle cx="200" cy="120" r="14" strokeWidth="0.5" />
      <circle cx="200" cy="120" r="3" />
      <path d="M200 106 L 200 134" strokeWidth="0.4" />
      <path d="M186 120 L 214 120" strokeWidth="0.4" />
      <path d="M188 110 L 212 130" strokeWidth="0.4" />
      <path d="M188 130 L 212 110" strokeWidth="0.4" />

      <circle cx="178" cy="84" r="9" strokeWidth="0.5" />
      <circle cx="222" cy="84" r="9" strokeWidth="0.5" />
      <circle cx="178" cy="84" r="2" />
      <circle cx="222" cy="84" r="2" />

      <circle cx="200" cy="56" r="6" strokeWidth="0.5" />

      {/* Tiny seedling at root */}
      <path d="M200 780 C 180 780, 168 778, 156 774" strokeWidth="0.4" />
      <path d="M200 780 C 220 780, 232 778, 244 774" strokeWidth="0.4" />
    </svg>
  );
}
