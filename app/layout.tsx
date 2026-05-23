import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, EB_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Witch Life · An Almanac for Daily Practice",
  description:
    "A modern almanac of practices, drawn from the moon, the season, the land, and your chart. Gather. Do. Reflect.",
  openGraph: {
    title: "Witch Life",
    description:
      "An almanac of daily practice, drawn from the moon, the season, the land, and your chart.",
    type: "website",
  },
};

/*
  Witch Life — broadsheet almanac theme. Aged-ivory paper with deep ink
  type, single vermilion accent, ruled architecture throughout. Clerk
  chrome themed to match (printed labels, vermilion primary).
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${garamond.variable} ${mono.variable}`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#B83A2E",
              colorBackground: "#F5EFDF",
              colorInputBackground: "#FBF7EC",
              colorInputText: "#14110A",
              colorText: "#14110A",
              colorTextSecondary: "#6B5E50",
              colorNeutral: "#14110A",
              fontFamily: "var(--font-garamond)",
              borderRadius: "0px",
            },
            elements: {
              rootBox: { backgroundColor: "transparent" },
              card: {
                backgroundColor: "rgba(251, 247, 236, 0.92)",
                border: "1px solid #2A1F12",
                boxShadow: "6px 6px 0 -1px #14110A",
                borderRadius: 0,
              },
              headerTitle: {
                color: "#14110A",
                fontFamily: "var(--font-fraunces), serif",
                letterSpacing: "-0.01em",
                fontSize: "2rem",
                fontWeight: 700,
              },
              headerSubtitle: {
                color: "rgba(20, 17, 10, 0.7)",
                fontFamily: "var(--font-garamond), serif",
                fontStyle: "italic",
                fontSize: "1.05rem",
              },
              formFieldLabel: {
                color: "#14110A",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 500,
              },
              formButtonPrimary: {
                backgroundColor: "#B83A2E",
                color: "#F5EFDF",
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontSize: "0.7rem",
                fontWeight: 500,
                border: "1px solid #14110A",
                borderRadius: 0,
              },
              dividerLine: { backgroundColor: "#2A1F12" },
              dividerText: {
                color: "#6B5E50",
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontSize: "0.6rem",
              },
              footerActionText: { color: "rgba(20, 17, 10, 0.7)" },
              footerActionLink: {
                color: "#B83A2E",
                fontWeight: 600,
                textDecoration: "underline",
              },
              socialButtonsBlockButton: {
                border: "1px solid #2A1F12",
                backgroundColor: "rgba(251, 247, 236, 0.6)",
                color: "#14110A",
                borderRadius: 0,
              },
              identityPreview: {
                backgroundColor: "rgba(251, 247, 236, 0.6)",
                border: "1px solid #2A1F12",
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
