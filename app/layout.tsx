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
            baseTheme: dark,
            variables: {
              colorPrimary: "#7A9E7E",
              colorBackground: "#1C1A14",
              colorInputBackground: "#2A251C",
              colorInputText: "#F2EDE3",
              colorText: "#F2EDE3",
              colorTextSecondary: "#C4B89E",
              colorNeutral: "#F2EDE3",
              fontFamily: "var(--font-inter)",
              borderRadius: "2px",
            },
            elements: {
              rootBox: { backgroundColor: "transparent" },
              card: {
                backgroundColor: "rgba(28, 26, 20, 0.85)",
                border: "1px solid rgba(45, 74, 45, 0.5)",
                boxShadow:
                  "0 0 80px rgba(196, 135, 42, 0.15), 0 1px 3px rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
              },
              headerTitle: {
                color: "#F2EDE3",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.08em",
                fontSize: "1.5rem",
                textTransform: "uppercase",
              },
              headerSubtitle: {
                color: "rgba(242, 237, 227, 0.75)",
                fontFamily: "var(--font-cormorant), serif",
                fontStyle: "italic",
                fontSize: "1.1rem",
              },
              formFieldLabel: {
                color: "#F2EDE3",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              },
              formButtonPrimary: {
                backgroundColor: "#7A9E7E",
                color: "#1C1A14",
                fontFamily: "var(--font-inter)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              },
              dividerLine: { backgroundColor: "rgba(122, 158, 126, 0.3)" },
              dividerText: {
                color: "rgba(242, 237, 227, 0.55)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontSize: "0.65rem",
              },
              footerActionText: {
                color: "rgba(242, 237, 227, 0.7)",
              },
              footerActionLink: { color: "#C4872A" },
              socialButtonsBlockButton: {
                border: "1px solid rgba(122, 158, 126, 0.4)",
                backgroundColor: "rgba(61, 53, 41, 0.4)",
              },
              identityPreview: {
                backgroundColor: "rgba(61, 53, 41, 0.4)",
                border: "1px solid rgba(122, 158, 126, 0.3)",
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
