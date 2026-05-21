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
  title: "The Verdant Oracle",
  description:
    "A reading of the sky as it is, not what it might be. Personal cosmic energy, daily.",
};

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
            variables: {
              colorPrimary: "#2D4A2D",
              colorBackground: "#EAD9BD",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#1F1A12",
              colorText: "#1F1A12",
              colorTextSecondary: "#3D3529",
              colorNeutral: "#1F1A12",
              fontFamily: "var(--font-inter)",
              borderRadius: "2px",
            },
            elements: {
              rootBox: { backgroundColor: "transparent" },
              card: {
                backgroundColor: "rgba(244, 233, 210, 0.6)",
                border: "1px solid rgba(61, 53, 41, 0.3)",
                boxShadow:
                  "0 0 60px rgba(184, 101, 74, 0.1), 0 1px 4px rgba(31, 26, 18, 0.08)",
              },
              headerTitle: {
                color: "#1F1A12",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.08em",
                fontSize: "1.25rem",
                textTransform: "uppercase",
              },
              headerSubtitle: {
                color: "rgba(31, 26, 18, 0.7)",
                fontFamily: "var(--font-cormorant), serif",
                fontStyle: "italic",
                fontSize: "1rem",
              },
              formFieldLabel: {
                color: "#1F1A12",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              },
              formButtonPrimary: {
                backgroundColor: "#B8654A",
                color: "#F2EDE3",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              },
              dividerLine: { backgroundColor: "rgba(61, 53, 41, 0.3)" },
              dividerText: {
                color: "rgba(31, 26, 18, 0.5)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontSize: "0.65rem",
              },
              footerActionText: { color: "rgba(31, 26, 18, 0.65)" },
              footerActionLink: { color: "#B8654A", fontWeight: 500 },
              socialButtonsBlockButton: {
                border: "1px solid rgba(61, 53, 41, 0.35)",
                backgroundColor: "rgba(255, 255, 255, 0.4)",
              },
              identityPreview: {
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                border: "1px solid rgba(61, 53, 41, 0.3)",
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
