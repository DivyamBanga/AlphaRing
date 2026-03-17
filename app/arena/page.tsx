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

// ── Rank Badge ──────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/25 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
        <span className="text-yellow-400 font-mono font-bold text-sm">1</span>
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-300/10 border border-gray-400/25">
        <span className="text-gray-300 font-mono font-bold text-sm">2</span>
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-600/25">
        <span className="text-amber-500 font-mono font-bold text-sm">3</span>
      </div>
    );
  return (
    <div className="flex items-center justify-center w-9 h-9">
      <span className="text-gray-600 font-mono text-sm">{rank}</span>
    </div>
  );
}

// ── Sort Header ─────────────────────────────────────────

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
      className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-mono transition-colors group ${
        isActive ? "text-accent" : "text-gray-500 hover:text-gray-300"
      } ${className || ""}`}
    >
      {label}
      <svg
        className={`w-3 h-3 transition-transform ${
          isActive && currentDir === "asc" ? "rotate-180" : ""
        } ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
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
      {/* Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-profit live-dot" />
              <span className="text-xs font-mono text-profit/70 uppercase tracking-[0.2em]">
                LIVE RANKINGS
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black mb-4 tracking-tight">
              The Arena
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              All strategies ranked on the same 10 years of market data. Same
              conditions. Best idea wins.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search strategies or creators..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-card border border-surface-border/50 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent/30 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as StrategyType | "");
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border/50 text-sm text-gray-300 focus:outline-none focus:border-accent/30 transition-colors appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">All Types</option>
            {Object.entries(STRATEGY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border border-surface-border/50 bg-surface-card/80 backdrop-blur-sm overflow-hidden"
        >
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[3.5rem_1fr_6rem_6rem_7rem_6rem_4rem] gap-3 px-5 py-3 border-b border-surface-border/40 bg-surface-elevated/30">
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-mono">
              #
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-mono">
              Strategy
            </span>
            <SortHeader
              label="Return"
              sortKey="returnPct"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={handleSort}
              className="justify-end"
            />
            <SortHeader
              label="Sharpe"
              sortKey="sharpeRatio"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={handleSort}
              className="justify-end"
            />
            <SortHeader
              label="Drawdown"
              sortKey="maxDrawdownPct"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={handleSort}
              className="justify-end"
            />
            <SortHeader
              label="Win Rate"
              sortKey="winRatePct"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={handleSort}
              className="justify-end"
            />
            <SortHeader
              label="Grade"
              sortKey="compositeScore"
              currentSort={sortBy}
              currentDir={sortDir}
              onSort={handleSort}
              className="justify-end"
            />
          </div>

          {/* Loading skeleton */}
          {loading && strategies.length === 0 && (
            <div className="divide-y divide-surface-border/20">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-4 flex gap-4 items-center animate-pulse"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-surface-elevated rounded" />
                    <div className="h-3 w-24 bg-surface-elevated/50 rounded" />
                  </div>
                  <div className="h-5 w-14 bg-surface-elevated rounded hidden sm:block" />
                  <div className="h-5 w-10 bg-surface-elevated rounded hidden sm:block" />
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
                className="px-5 py-16 text-center"
              >
                <p className="text-gray-500 text-sm">
                  No strategies found. Try adjusting your search or filters.
                </p>
              </motion.div>
            )}

            {strategies.map((entry, i) => {
              const isTop3 = entry.rank <= 3;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  onClick={() => router.push(`/strategy/${entry.id}`)}
                  className={`grid grid-cols-1 lg:grid-cols-[3.5rem_1fr_6rem_6rem_7rem_6rem_4rem] gap-2 lg:gap-3 px-5 py-4 items-center cursor-pointer transition-all duration-200 hover:bg-accent/[0.03] ${
                    i < strategies.length - 1
                      ? "border-b border-surface-border/20"
                      : ""
                  } ${isTop3 ? "bg-surface-elevated/20" : ""}`}
                >
                  {/* Rank + Name (mobile: single row) */}
                  <div className="flex items-center gap-3 lg:contents">
                    <RankBadge rank={entry.rank} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium truncate ${
                            isTop3 ? "text-white" : "text-gray-200"
                          }`}
                        >
                          {entry.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-gray-600 border border-surface-border/40 rounded px-1.5 py-0.5 hidden sm:inline-block">
                          {STRATEGY_TYPE_LABELS[entry.type]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        by {entry.creator}
                      </span>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex items-center gap-3 lg:hidden">
                      <span
                        className={`font-mono text-xs ${
                          entry.returnPct >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {entry.returnPct > 0 ? "+" : ""}
                        {entry.returnPct.toFixed(1)}%
                      </span>
                      <GradeBadge grade={entry.grade} size="sm" />
                    </div>
                  </div>

                  {/* Desktop columns */}
                  <span
                    className={`text-right font-mono text-sm hidden lg:block ${
                      entry.returnPct >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {entry.returnPct > 0 ? "+" : ""}
                    {entry.returnPct.toFixed(1)}%
                  </span>
                  <span className="text-right font-mono text-sm text-gray-400 hidden lg:block">
                    {entry.sharpeRatio.toFixed(2)}
                  </span>
                  <span className="text-right font-mono text-sm text-gray-400 hidden lg:block">
                    -{entry.maxDrawdownPct.toFixed(1)}%
                  </span>
                  <span className="text-right font-mono text-sm text-gray-400 hidden lg:block">
                    {entry.winRatePct.toFixed(1)}%
                  </span>
                  <span className="text-right hidden lg:block">
                    <GradeBadge grade={entry.grade} size="sm" />
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-surface-border/50 text-sm text-gray-400 hover:text-white hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-mono transition-all ${
                  page === i + 1
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-surface-border/50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-surface-border/50 text-sm text-gray-400 hover:text-white hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </motion.div>
        )}

        {/* Total count */}
        <div className="text-center mt-4">
          <span className="text-xs text-gray-600 font-mono">
            {total} strategies ranked
          </span>
        </div>
      </div>
    </div>
  );
}
