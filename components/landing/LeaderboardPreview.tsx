"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const FALLBACK_DATA: LeaderboardEntry[] = [
  { id: "1", rank: 1, name: "Bollinger Breakout", creator: "AlphaRing", returnPct: 739.7, sharpeRatio: 1.58, maxDrawdownPct: 16.74, winRatePct: 59.56, grade: "B+", compositeScore: 79.0 },
  { id: "2", rank: 2, name: "Golden Cross Rider", creator: "AlphaRing", returnPct: 390.22, sharpeRatio: 0.93, maxDrawdownPct: 32.8, winRatePct: 57.69, grade: "C", compositeScore: 50.3 },
  { id: "3", rank: 3, name: "Boomer Portfolio", creator: "AlphaRing", returnPct: 229.56, sharpeRatio: 0.9, maxDrawdownPct: 23.5, winRatePct: 60.31, grade: "D", compositeScore: 47.8 },
  { id: "4", rank: 4, name: "Momentum Dip Buyer", creator: "AlphaRing", returnPct: 115.21, sharpeRatio: 0.59, maxDrawdownPct: 25.98, winRatePct: 50.79, grade: "F", compositeScore: 36.4 },
  { id: "5", rank: 5, name: "Mean Reversion Nerd", creator: "AlphaRing", returnPct: 50.05, sharpeRatio: 0.36, maxDrawdownPct: 33.11, winRatePct: 49.72, grade: "F", compositeScore: 27.2 },
  { id: "6", rank: 6, name: "WSB Degen", creator: "AlphaRing", returnPct: 46.32, sharpeRatio: 0.28, maxDrawdownPct: 72.13, winRatePct: 49.56, grade: "F", compositeScore: 19.1 },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400/10 text-yellow-400 font-mono font-bold text-xs border border-yellow-400/20">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-300/10 text-gray-300 font-mono font-bold text-xs border border-gray-300/20">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-600/10 text-amber-600 font-mono font-bold text-xs border border-amber-600/20">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-gray-500 font-mono text-xs">
      {rank}
    </span>
  );
}

export default function LeaderboardPreview() {
  const router = useRouter();
  const [strategies, setStrategies] =
    useState<LeaderboardEntry[]>(FALLBACK_DATA);

  useEffect(() => {
    fetch("/api/leaderboard?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (data.strategies?.length > 0) {
          setStrategies(data.strategies);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-profit live-dot" />
            <span className="text-xs font-mono text-profit/70 uppercase tracking-[0.2em]">
              LIVE RANKINGS
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Global Leaderboard
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            All strategies ranked on the same 10 years of market data. Same
            conditions. Best idea wins.
          </p>
        </motion.div>

        {/* Table */}
        <div className="rounded-xl border border-surface-border/50 bg-surface-card/80 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_3.5rem] gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-mono border-b border-surface-border/40 bg-surface-elevated/30">
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
              transition={{ delay: i * 0.06, duration: 0.3 }}
              onClick={() => router.push(`/strategy/${entry.id}`)}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem_5rem_3.5rem] gap-2 px-5 py-3.5 items-center text-sm hover:bg-accent/[0.02] transition-colors cursor-pointer ${
                i < strategies.length - 1
                  ? "border-b border-surface-border/30"
                  : ""
              }`}
            >
              <RankBadge rank={i + 1} />
              <div className="min-w-0">
                <span className="font-medium truncate block">
                  {entry.name}
                </span>
                <span className="text-xs text-gray-500 sm:hidden">
                  {entry.returnPct > 0 ? "+" : ""}
                  {entry.returnPct}% return
                </span>
              </div>
              <span
                className={`text-right font-mono text-xs hidden sm:block ${
                  entry.returnPct >= 0 ? "text-profit" : "text-loss"
                }`}
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

        <div className="mt-8 text-center">
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 text-sm text-accent/80 hover:text-accent transition-colors font-mono"
          >
            View Full Arena
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
