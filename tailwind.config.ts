import type { Config } from "tailwindcss";

/*
  Tailwind config maps directly to the CSS custom properties in globals.css.
  All theme values are derived from the tokens — changing a token reskins
  the entire app.
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
        earth: "var(--color-earth)",
        parchment: "var(--color-parchment)",
        moss: "var(--color-moss)",
        sage: "var(--color-sage)",
        ochre: "var(--color-ochre)",
        ash: "var(--color-ash)",
        bark: "var(--color-bark)",
        linen: "var(--color-linen)",
        energy: {
          expand: "var(--color-energy-expand)",
          flow: "var(--color-energy-flow)",
          inward: "var(--color-energy-inward)",
          contract: "var(--color-energy-contract)",
          friction: "var(--color-energy-friction)",
        },
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
