"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GradeBadge from "@/components/ui/GradeBadge";
import {
  STRATEGY_TYPE_LABELS,
  type StrategyType,
} from "@/lib/mock-strategies";

// ── Types ───────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  creator: string;
  type: StrategyType;
  returnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  grade: string;
  compositeScore: number;
}

type SortKey =
  | "compositeScore"
  | "returnPct"
  | "sharpeRatio"
  | "maxDrawdownPct"
  | "winRatePct";

// ── Sort Header ──────────────────────────────────────────

function SortHeader({
  label,
  sortKey: key,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentSort === key;
  return (
    <button
      onClick={() => onSort(key)}
      className={`flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] font-mono transition-colors ${
        isActive ? "text-accent" : "text-[#444] hover:text-[#888]"
      } ${className || ""}`}
    >
      {label}
      <span className={`transition-all text-[8px] ${isActive ? "opacity-100" : "opacity-0"}`}>
        {isActive && currentDir === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );
}

// ── Main Arena Page ─────────────────────────────────────

export default function ArenaPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("compositeScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<StrategyType | "">("");
  const limit = 20;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortDir,
    });
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);

    try {
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      setStrategies(data.strategies || []);
      setTotal(data.total || 0);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, search, typeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen pb-20">
      {/* Page header */}
      <div className="border-b border-[#1A1A1A] grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-profit live-dot" />
              <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em]">
                Global Rankings
              </span>
            </div>
            <div className="flex items-end justify-between">
              <h1 className="font-display font-black uppercase leading-none text-[#F0F0EE] text-[clamp(2.5rem,6vw,4.5rem)] tracking-tight">
                THE ARENA
              </h1>
              <div className="hidden sm:block text-right">
                <div className="text-2xl font-display font-black text-accent">{total}</div>
                <div className="text-[9px] font-mono text-[#444] uppercase tracking-wider">Strategies ranked</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-mono text-[#444] uppercase tracking-wider">
              Same 10-year period · Same conditions · Best idea wins
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search strategies..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#0D0D0D] border border-[#1E1E1E] text-[11px] font-mono text-[#C0C0BE] placeholder-[#333] focus:outline-none focus:border-accent/30 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as StrategyType | ""); setPage(1); }}
            className="px-4 py-2 bg-[#0D0D0D] border border-[#1E1E1E] text-[11px] font-mono text-[#888] focus:outline-none focus:border-accent/30 transition-colors cursor-pointer"
          >
            <option value="">All Types</option>
            {Object.entries(STRATEGY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="border border-[#1E1E1E] overflow-hidden"
        >
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[3rem_1fr_6rem_5.5rem_7rem_5.5rem_4rem] gap-2 px-4 py-2.5 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <span className="text-[9px] font-mono text-[#333] uppercase tracking-[0.2em]">#</span>
            <span className="text-[9px] font-mono text-[#333] uppercase tracking-[0.2em]">Strategy</span>
            <SortHeader label="Return" sortKey="returnPct" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="justify-end" />
            <SortHeader label="Sharpe" sortKey="sharpeRatio" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="justify-end" />
            <SortHeader label="Drawdown" sortKey="maxDrawdownPct" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="justify-end" />
            <SortHeader label="Win Rate" sortKey="winRatePct" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="justify-end" />
            <SortHeader label="Grade" sortKey="compositeScore" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="justify-end" />
          </div>

          {/* Loading skeleton */}
          {loading && strategies.length === 0 && (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex gap-4 items-center animate-pulse border-b border-[#111]">
                  <div className="w-8 h-5 bg-[#131313]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-36 bg-[#131313]" />
                    <div className="h-2.5 w-20 bg-[#0D0D0D]" />
                  </div>
                  <div className="h-4 w-14 bg-[#131313] hidden sm:block" />
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          <AnimatePresence mode="wait">
            {!loading && strategies.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-16 text-center"
              >
                <p className="text-[11px] font-mono text-[#444] uppercase tracking-wider">
                  No strategies found. Adjust filters.
                </p>
              </motion.div>
            )}

            {strategies.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => router.push(`/strategy/${entry.id}`)}
                className={`data-row grid grid-cols-1 lg:grid-cols-[3rem_1fr_6rem_5.5rem_7rem_5.5rem_4rem] gap-2 px-4 py-3.5 items-center cursor-pointer transition-colors ${
                  i < strategies.length - 1 ? "border-b border-[#111]" : ""
                }`}
              >
                {/* Rank */}
                <span className={`font-display font-black text-lg leading-none ${
                  entry.rank === 1 ? "text-accent" :
                  entry.rank === 2 ? "text-[#888]" :
                  entry.rank === 3 ? "text-[#B45309]" :
                  "text-[#2A2A2A]"
                }`}>
                  {entry.rank}
                </span>

                {/* Name + mobile stats */}
                <div className="flex items-center justify-between lg:block min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-[#C0C0BE] truncate">
                        {entry.name}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-wider text-[#333] border border-[#1E1E1E] px-1.5 py-0.5 hidden sm:inline-block shrink-0">
                        {STRATEGY_TYPE_LABELS[entry.type]}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#3A3A3A]">
                      {entry.creator}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 lg:hidden">
                    <span className={`text-sm font-display font-black ${entry.returnPct >= 0 ? "text-profit" : "text-loss"}`}>
                      {entry.returnPct > 0 ? "+" : ""}{entry.returnPct.toFixed(1)}%
                    </span>
                    <GradeBadge grade={entry.grade} size="sm" />
                  </div>
                </div>

                {/* Desktop columns */}
                <span className={`hidden lg:block text-right font-display font-black text-base ${entry.returnPct >= 0 ? "text-profit" : "text-loss"}`}>
                  {entry.returnPct > 0 ? "+" : ""}{entry.returnPct.toFixed(1)}%
                </span>
                <span className="hidden lg:block text-right text-[11px] font-mono text-[#555]">
                  {entry.sharpeRatio.toFixed(2)}
                </span>
                <span className="hidden lg:block text-right text-[11px] font-mono text-[#555]">
                  -{entry.maxDrawdownPct.toFixed(1)}%
                </span>
                <span className="hidden lg:block text-right text-[11px] font-mono text-[#555]">
                  {entry.winRatePct.toFixed(1)}%
                </span>
                <span className="hidden lg:flex justify-end">
                  <GradeBadge grade={entry.grade} size="sm" />
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-1.5 border border-[#1E1E1E] text-[10px] font-mono text-[#555] hover:text-[#F0F0EE] hover:border-accent/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 text-[10px] font-mono transition-all ${
                  page === i + 1
                    ? "bg-accent text-[#080808] font-bold"
                    : "text-[#444] hover:text-[#F0F0EE] border border-[#1A1A1A] hover:border-[#333]"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-1.5 border border-[#1E1E1E] text-[10px] font-mono text-[#555] hover:text-[#F0F0EE] hover:border-accent/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
            >
              Next
            </button>
          </div>
        )}

        <div className="text-center mt-3">
          <span className="text-[9px] font-mono text-[#2A2A2A] uppercase tracking-wider">
            {total} strategies in the arena
          </span>
        </div>
      </div>
    </div>
  );
}
