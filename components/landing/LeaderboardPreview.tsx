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

export default function LeaderboardPreview() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<LeaderboardEntry[]>(FALLBACK_DATA);

  useEffect(() => {
    fetch("/api/leaderboard?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (data.strategies?.length > 0) setStrategies(data.strategies);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 px-4 border-t border-[#1A1A1A]">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-profit live-dot" />
              <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em]">
                Live Rankings
              </span>
            </div>
            <h2 className="font-display font-black text-[clamp(2rem,5vw,3.5rem)] uppercase leading-none text-[#F0F0EE] tracking-tight">
              THE ARENA
            </h2>
            <p className="text-[10px] text-[#444] mt-2 uppercase tracking-wider">
              Same 10yr period · Same rules · Best idea wins
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hidden sm:block"
          >
            <Link
              href="/arena"
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555] hover:text-accent transition-colors flex items-center gap-2"
            >
              Full standings
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Table */}
        <div className="border border-[#1E1E1E] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2.5rem_1fr_6rem_5rem_5rem_4rem] gap-px px-4 py-2.5 bg-[#0A0A0A] border-b border-[#1E1E1E]">
            {["#", "STRATEGY", "RETURN", "SHARPE", "WIN RATE", "GRADE"].map((col, i) => (
              <span
                key={col}
                className={`text-[9px] font-mono text-[#3A3A3A] uppercase tracking-[0.2em] ${i >= 2 ? "text-right hidden sm:block" : ""}`}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {strategies.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              onClick={() => router.push(`/strategy/${entry.id}`)}
              className={`data-row grid grid-cols-[2.5rem_1fr_6rem_5rem_5rem_4rem] gap-px px-4 py-3 items-center cursor-pointer transition-colors ${
                i < strategies.length - 1 ? "border-b border-[#131313]" : ""
              }`}
            >
              {/* Rank */}
              <span className={`text-sm font-display font-black ${
                i === 0 ? "text-accent" : i === 1 ? "text-[#888]" : i === 2 ? "text-[#B45309]" : "text-[#3A3A3A]"
              }`}>
                {i + 1}
              </span>

              {/* Name */}
              <div className="min-w-0">
                <span className="text-xs font-mono text-[#C0C0BE] truncate block group-hover:text-white">
                  {entry.name}
                </span>
                <span className="text-[9px] text-[#3A3A3A] sm:hidden">
                  {entry.returnPct > 0 ? "+" : ""}{entry.returnPct}% · {entry.grade}
                </span>
              </div>

              {/* Return */}
              <span className={`hidden sm:block text-right text-sm font-display font-black ${
                entry.returnPct >= 0 ? "text-profit" : "text-loss"
              }`}>
                {entry.returnPct > 0 ? "+" : ""}{entry.returnPct}%
              </span>

              {/* Sharpe */}
              <span className="hidden sm:block text-right text-[10px] font-mono text-[#555]">
                {entry.sharpeRatio}
              </span>

              {/* Win rate */}
              <span className="hidden sm:block text-right text-[10px] font-mono text-[#555]">
                {entry.winRatePct}%
              </span>

              {/* Grade */}
              <div className="flex justify-end">
                <GradeBadge grade={entry.grade} size="sm" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/arena"
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555] hover:text-accent transition-colors"
          >
            View full standings →
          </Link>
        </div>
      </div>
    </section>
  );
}
