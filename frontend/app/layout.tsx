import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond } from "next/font/google";
import Web3Provider from "@/components/Web3Provider";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Bingocle",
  description:
    "Predict the words. Build the card. Play with the crowd. A social bingo experience where the community decides which words deserve to appear on the board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cinzelDecorative.variable} ${cormorant.variable}`}
    >
      <body className="antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
