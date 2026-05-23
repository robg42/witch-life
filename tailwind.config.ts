import type { Config } from "tailwindcss";

/*
  Tailwind config maps to the broadsheet CSS custom properties.
  Existing colour utility names are kept as legacy aliases so old
  references resolve correctly during the design migration.
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
        // Witch Life broadsheet tokens
        paper: "var(--c-paper)",
        "paper-2": "var(--c-paper-2)",
        "paper-3": "var(--c-paper-3)",
        ink: "var(--c-ink)",
        rule: "var(--c-rule)",
        vermilion: "var(--c-vermilion)",
        rust: "var(--c-rust)",
        bone: "var(--c-bone)",
        sage: "var(--c-sage)",
        ash: "var(--c-ash)",
        marginalia: "var(--c-marginalia)",
        // Legacy aliases → tokens
        earth: "var(--color-earth)",
        wax: "var(--color-wax)",
        gold: "var(--color-gold)",
        smoke: "var(--color-smoke)",
        forest: "var(--color-forest)",
        parchment: "var(--color-parchment)",
        linen: "var(--color-linen)",
        clay: "var(--color-clay)",
        ember: "var(--color-ember)",
        ochre: "var(--color-ochre)",
        saffron: "var(--color-saffron)",
        moss: "var(--color-moss)",
        bark: "var(--color-bark)",
        aubergine: "var(--color-aubergine)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        accent: ["var(--font-accent)"],
        sans: ["var(--font-mono)"], // legacy: anything that asked for "sans" now gets the mono used as labels
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
        "6xl": "4rem",
        "7xl": "5rem",
        "8xl": "6.5rem",
        "9xl": "8rem",
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
        none: "0",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionDuration: {
        base: "350ms",
      },
      transitionTimingFunction: {
        base: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
