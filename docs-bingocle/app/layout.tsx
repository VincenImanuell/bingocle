import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DocsShell } from "@/components/docs/DocsShell";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bingocle Docs",
    template: "%s · Bingocle Docs",
  },
  description:
    "Developer documentation for Bingocle — an AI-refereed community bingo prediction market on Mantle. Smart contracts, AI agent service, Minds Capability, and the web app.",
  applicationName: "Bingocle Docs",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
