"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import GradeBadge from "@/components/ui/GradeBadge";

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  creator: string;
  returnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  grade: string;
  compositeScore: number;
}

// Fallback data in case the API isn't available
const FALLBACK_DATA: LeaderboardEntry[] = [
  { id: "1", rank: 1, name: "Bollinger Breakout", creator: "AlphaRing", returnPct: 739.7, sharpeRatio: 1.58, maxDrawdownPct: 16.74, winRatePct: 59.56, grade: "B+", compositeScore: 79.0 },
  { id: "2", rank: 2, name: "Golden Cross Rider", creator: "AlphaRing", returnPct: 390.22, sharpeRatio: 0.93, maxDrawdownPct: 32.8, winRatePct: 57.69, grade: "C", compositeScore: 50.3 },
  { id: "3", rank: 3, name: "Boomer Portfolio", creator: "AlphaRing", returnPct: 229.56, sharpeRatio: 0.9, maxDrawdownPct: 23.5, winRatePct: 60.31, grade: "D", compositeScore: 47.8 },
  { id: "4", rank: 4, name: "Momentum Dip Buyer", creator: "AlphaRing", returnPct: 115.21, sharpeRatio: 0.59, maxDrawdownPct: 25.98, winRatePct: 50.79, grade: "F", compositeScore: 36.4 },
  { id: "5", rank: 5, name: "Mean Reversion Nerd", creator: "AlphaRing", returnPct: 50.05, sharpeRatio: 0.36, maxDrawdownPct: 33.11, winRatePct: 49.72, grade: "F", compositeScore: 27.2 },
  { id: "6", rank: 6, name: "WSB Degen", creator: "AlphaRing", returnPct: 46.32, sharpeRatio: 0.28, maxDrawdownPct: 72.13, winRatePct: 49.56, grade: "F", compositeScore: 19.1 },
];

function rankStyle(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-gray-500";
}

export default function LeaderboardPreview() {
  const [strategies, setStrategies] = useState<LeaderboardEntry[]>(FALLBACK_DATA);

  useEffect(() => {
    fetch("/api/leaderboard?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (data.strategies?.length > 0) {
          setStrategies(data.strategies);
        }
      })
      .catch(() => {
        // Use fallback data
      });
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center mb-2">
            Live Leaderboard
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            All strategies ranked on the same 10 years of market data. Same
            conditions. Best idea wins.
          </p>
        </motion.div>

        {/* Table */}
        <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_3.5rem] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 border-b border-surface-border">
            <span>#</span>
            <span>Strategy</span>
            <span className="text-right">Return</span>
            <span className="text-right">Sharpe</span>
            <span className="text-right">Win Rate</span>
            <span className="text-right">Grade</span>
          </div>

          {/* Rows */}
          {strategies.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem_5rem_3.5rem] gap-2 px-4 py-3 items-center text-sm hover:bg-surface-elevated/50 transition-colors ${
                i < strategies.length - 1 ? "border-b border-surface-border/50" : ""
              }`}
            >
              <span className={`font-mono font-bold ${rankStyle(i + 1)}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className="font-medium truncate block">{entry.name}</span>
                <span className="text-xs text-gray-500 sm:hidden">
                  {entry.returnPct > 0 ? "+" : ""}{entry.returnPct}% return
                </span>
              </div>
              <span
                className={`text-right font-mono text-xs hidden sm:block ${entry.returnPct >= 0 ? "text-profit" : "text-loss"}`}
              >
                {entry.returnPct > 0 ? "+" : ""}
                {entry.returnPct}%
              </span>
              <span className="text-right font-mono text-xs text-gray-400 hidden sm:block">
                {entry.sharpeRatio}
              </span>
              <span className="text-right font-mono text-xs text-gray-400 hidden sm:block">
                {entry.winRatePct}%
              </span>
              <span className="text-right">
                <GradeBadge grade={entry.grade} size="sm" />
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/arena"
            className="inline-block text-sm text-accent hover:text-accent-light transition-colors"
          >
            See Full Arena &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
