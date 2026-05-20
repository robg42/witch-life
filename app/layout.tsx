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
              colorInputBackground: "#3D3529",
              colorInputText: "#F2EDE3",
              colorText: "#F2EDE3",
              colorTextSecondary: "#8A8478",
              colorNeutral: "#F2EDE3",
              fontFamily: "var(--font-inter)",
              borderRadius: "2px",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
