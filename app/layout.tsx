import type { Metadata } from "next";
import { Outfit, Syne, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AlphaRing — Describe a trading strategy. Watch it compete.",
  description:
    "Type a trading strategy in plain English. AlphaRing turns it into a real algorithm, backtests it against 10 years of market data, and ranks it on a global leaderboard. No code. No money. Just your idea vs theirs.",
  openGraph: {
    title: "AlphaRing",
    description:
      "Describe a trading strategy in English. Watch it compete against the world.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaRing",
    description:
      "Describe a trading strategy in English. Watch it compete against the world.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-surface text-white antialiased font-body">
        <AuthProvider>
          <Navbar />
          <main className="pt-14">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
