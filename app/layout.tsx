import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-surface text-white antialiased">
        {children}
      </body>
    </html>
  );
}
