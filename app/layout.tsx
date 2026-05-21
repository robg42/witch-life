import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import {
  Cinzel,
  Cormorant_Garamond,
  IM_Fell_English,
  Inter,
} from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  variable: "--font-fell",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Witch Life",
  description:
    "A reading of the sky as it is, not what it might be. A daily oracle, against your chart.",
  openGraph: {
    title: "Witch Life",
    description:
      "A reading of the sky as it is, not what it might be. A daily oracle, against your chart.",
    type: "website",
  },
};

/*
  Clerk appearance — Witch Life cream herbarium theme. Light surface,
  warm-dark ink text, clay terracotta primary, moss accents.
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${cormorant.variable} ${fell.variable} ${inter.variable}`}
      >
        {/*
          Two additional drifting washes that ride above body::after.
          Together with body's own background gradients, this gives the
          surface four layers of motion at four different speeds.
        */}
        <span aria-hidden className="wl-wash" />
        <span aria-hidden className="wl-trail" />
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#2E4326",
              colorBackground: "#F4E9CC",
              colorInputBackground: "#FFFAEC",
              colorInputText: "#1F1810",
              colorText: "#1F1810",
              colorTextSecondary: "#4A3F30",
              colorNeutral: "#1F1810",
              fontFamily: "var(--font-inter)",
              borderRadius: "2px",
            },
            elements: {
              rootBox: { backgroundColor: "transparent" },
              card: {
                backgroundColor: "rgba(244, 233, 204, 0.85)",
                border: "1px solid rgba(74, 63, 48, 0.35)",
                boxShadow:
                  "0 0 60px rgba(184, 92, 58, 0.12), 0 1px 4px rgba(31, 24, 16, 0.08)",
              },
              headerTitle: {
                color: "#1F1810",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.1em",
                fontSize: "1.25rem",
                textTransform: "uppercase",
                fontWeight: 500,
              },
              headerSubtitle: {
                color: "rgba(31, 24, 16, 0.65)",
                fontFamily: "var(--font-cormorant), serif",
                fontStyle: "italic",
                fontSize: "1rem",
              },
              formFieldLabel: {
                color: "#1F1810",
                fontSize: "0.7rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "var(--font-inter)",
              },
              formButtonPrimary: {
                backgroundColor: "#B85C3A",
                color: "#F4E9CC",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 500,
                border: "none",
              },
              dividerLine: { backgroundColor: "rgba(74, 63, 48, 0.35)" },
              dividerText: {
                color: "rgba(31, 24, 16, 0.5)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontSize: "0.65rem",
              },
              footerActionText: { color: "rgba(31, 24, 16, 0.6)" },
              footerActionLink: { color: "#B85C3A", fontWeight: 500 },
              socialButtonsBlockButton: {
                border: "1px solid rgba(74, 63, 48, 0.35)",
                backgroundColor: "rgba(255, 250, 236, 0.5)",
                color: "#1F1810",
              },
              identityPreview: {
                backgroundColor: "rgba(255, 250, 236, 0.5)",
                border: "1px solid rgba(74, 63, 48, 0.35)",
              },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
