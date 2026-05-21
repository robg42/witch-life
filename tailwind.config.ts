import type { Config } from "tailwindcss";

/*
  Tailwind config maps directly to the CSS custom properties in globals.css.
  All theme values are derived from the tokens — changing a token reskins
  the entire app.

  Witch Life palette: aged ink (ink), forest floor (forest), smoke
  (smoke), warm cream (wax/bone), tarnished gold (gold), ember rust
  (ember), deep moss (moss), warm smoke-grey (ash).

  Legacy alias colours (earth, parchment, ochre, clay, linen) are kept
  so existing utility classes resolve to the right new token without
  rewriting every page.
*/
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Witch Life surface tokens
        ink: "var(--color-ink)",
        forest: "var(--color-forest)",
        smoke: "var(--color-smoke)",
        wax: "var(--color-wax)",
        bone: "var(--color-bone)",
        gold: "var(--color-gold)",
        ember: "var(--color-ember)",
        moss: "var(--color-moss)",
        sage: "var(--color-sage)",
        ash: "var(--color-ash)",
        bark: "var(--color-bark)",
        // Legacy aliases — resolve to the new palette so older utility
        // classes keep working.
        earth: "var(--color-earth)",
        parchment: "var(--color-parchment)",
        ochre: "var(--color-ochre)",
        clay: "var(--color-clay)",
        linen: "var(--color-linen)",
        saffron: "var(--color-saffron)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        accent: ["var(--font-accent)"],
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        24: "var(--space-24)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionDuration: {
        base: "400ms",
      },
      transitionTimingFunction: {
        base: "ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
