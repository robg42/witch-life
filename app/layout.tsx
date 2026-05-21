import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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
  Clerk appearance — dark theme with the Witch Life palette. Targets
  every visible element so labels, headers, dividers, and buttons all
  read clearly against the aged-ink surface.
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
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#A88543",
              colorBackground: "#14110D",
              colorInputBackground: "#1E211B",
              colorInputText: "#E8DAB5",
              colorText: "#E8DAB5",
              colorTextSecondary: "#D8CCAB",
              colorNeutral: "#E8DAB5",
              fontFamily: "var(--font-inter)",
              borderRadius: "2px",
            },
            elements: {
              rootBox: { backgroundColor: "transparent" },
              card: {
                backgroundColor: "rgba(30, 33, 27, 0.7)",
                border: "1px solid rgba(58, 51, 40, 0.7)",
                boxShadow:
                  "0 0 80px rgba(168, 133, 67, 0.08), 0 1px 4px rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
              },
              headerTitle: {
                color: "#E8DAB5",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.1em",
                fontSize: "1.25rem",
                textTransform: "uppercase",
                fontWeight: 500,
              },
              headerSubtitle: {
                color: "rgba(216, 204, 171, 0.65)",
                fontFamily: "var(--font-cormorant), serif",
                fontStyle: "italic",
                fontSize: "1rem",
              },
              formFieldLabel: {
                color: "rgba(232, 218, 181, 0.8)",
                fontSize: "0.7rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "var(--font-inter)",
              },
              formFieldInput: {
                backgroundColor: "rgba(30, 33, 27, 0.8)",
                borderColor: "rgba(58, 51, 40, 0.8)",
                color: "#E8DAB5",
              },
              formButtonPrimary: {
                backgroundColor: "#A88543",
                color: "#14110D",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 500,
                border: "none",
              },
              dividerLine: { backgroundColor: "rgba(58, 51, 40, 0.7)" },
              dividerText: {
                color: "rgba(216, 204, 171, 0.5)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontSize: "0.65rem",
              },
              footerActionText: { color: "rgba(216, 204, 171, 0.6)" },
              footerActionLink: { color: "#A88543", fontWeight: 500 },
              socialButtonsBlockButton: {
                border: "1px solid rgba(58, 51, 40, 0.8)",
                backgroundColor: "rgba(30, 33, 27, 0.4)",
                color: "#E8DAB5",
              },
              identityPreview: {
                backgroundColor: "rgba(30, 33, 27, 0.6)",
                border: "1px solid rgba(58, 51, 40, 0.7)",
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
