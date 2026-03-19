"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GradeBadge from "@/components/ui/GradeBadge";
import CompareChart from "@/components/ui/CompareChart";
import type { EquityCurvePoint } from "@/lib/backtester";
import { type StrategyType } from "@/lib/mock-strategies";

// ── Types ────────────────────────────────────────────────

interface StrategyData {
  id: string;
  name: string;
  creator: string;
  type: StrategyType;
  returnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  avgTradeDuration: number;
  grade: string;
  compositeScore: number;
  equityCurve: EquityCurvePoint[];
}

interface PickerEntry {
  id: string;
  name: string;
  creator: string;
  type: StrategyType;
  returnPct: number;
  sharpeRatio: number;
  grade: string;
  compositeScore: number;
}

// ── Helpers ──────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#22C55E";
  if (grade.startsWith("B")) return "#EAB308";
  if (grade === "C" || grade === "D") return "#F97316";
  return "#EF4444";
}

// ── Mini Strategy Card (for the challenged header) ───────

function StrategyHeaderCard({
  strategy,
  accentColor,
  label,
}: {
  strategy: StrategyData;
  accentColor: string;
  label: string;
}) {
  const color = gradeColor(strategy.grade);
  return (
    <div
      className="rounded-xl border p-5 flex-1 relative"
      style={{
        borderColor: `${accentColor}30`,
        background: `${accentColor}05`,
      }}
    >
      <div
        className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
        style={{
          color: accentColor,
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        {label}
      </div>
      <div className="mt-5 flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0"
          style={{
            borderColor: color,
            background: `${color}15`,
          }}
        >
          <span className="text-xl font-display font-black" style={{ color }}>
            {strategy.grade}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base leading-tight truncate">
            {strategy.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            by {strategy.creator}
          </p>
          <p className="text-xs font-mono text-gray-600 mt-1">
            Score: <span className="text-gray-400">{strategy.compositeScore}/100</span>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-surface-elevated/50 rounded-lg px-3 py-2">
          <p className="text-[9px] font-mono text-gray-600 uppercase">Return</p>
          <p
            className={`text-sm font-display font-bold ${
              strategy.returnPct >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            {strategy.returnPct > 0 ? "+" : ""}
            {strategy.returnPct.toFixed(1)}%
          </p>
        </div>
        <div className="bg-surface-elevated/50 rounded-lg px-3 py-2">
          <p className="text-[9px] font-mono text-gray-600 uppercase">Sharpe</p>
          <p className="text-sm font-display font-bold text-gray-200">
            {strategy.sharpeRatio.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Stats Comparison Table ────────────────────────────────

interface StatRowProps {
  label: string;
  aFormatted: string;
  bFormatted: string;
  aRaw: number;
  bRaw: number;
  lowerBetter?: boolean;
}

function StatRow({
  label,
  aFormatted,
  bFormatted,
  aRaw,
  bRaw,
  lowerBetter = false,
}: StatRowProps) {
  const aWins = lowerBetter ? aRaw < bRaw : aRaw > bRaw;
  const bWins = lowerBetter ? bRaw < aRaw : bRaw > aRaw;

  return (
    <tr className="border-t border-surface-border/15">
      <td className="px-4 py-3 text-[10px] font-mono text-gray-600 uppercase tracking-wider">
        {label}
      </td>
      <td
        className={`px-4 py-3 text-sm font-display font-bold text-right transition-colors ${
          aWins ? "text-accent" : "text-gray-400"
        }`}
      >
        {aFormatted}
        {aWins && (
          <span className="ml-1.5 text-[10px] text-accent font-mono">✓</span>
        )}
      </td>
      <td
        className={`px-4 py-3 text-sm font-display font-bold text-right transition-colors ${
          bWins ? "text-amber-400" : "text-gray-400"
        }`}
      >
        {bFormatted}
        {bWins && (
          <span className="ml-1.5 text-[10px] text-amber-400 font-mono">✓</span>
        )}
      </td>
    </tr>
  );
}

// ── Picker Card ───────────────────────────────────────────

function PickerCard({
  strategy,
  onSelect,
  loading,
}: {
  strategy: PickerEntry;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const color = gradeColor(strategy.grade);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(strategy.id)}
      disabled={loading}
      className="w-full text-left rounded-xl border border-surface-border/20 bg-surface-card p-4 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
          style={{ borderColor: `${color}40`, background: `${color}10` }}
        >
          <span
            className="text-base font-display font-black"
            style={{ color }}
          >
            {strategy.grade}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-white transition-colors">
            {strategy.name}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {strategy.creator} &middot;{" "}
            <span
              className={
                strategy.returnPct >= 0 ? "text-profit/70" : "text-loss/70"
              }
            >
              {strategy.returnPct > 0 ? "+" : ""}
              {strategy.returnPct.toFixed(1)}%
            </span>
          </p>
        </div>
        <span className="text-[10px] font-mono text-gray-600 shrink-0 mt-1">
          {strategy.compositeScore.toFixed(0)}/100
        </span>
      </div>
    </motion.button>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [challenged, setChallenged] = useState<StrategyData | null>(null);
  const [challenger, setChallenger] = useState<StrategyData | null>(null);
  const [leaderboard, setLeaderboard] = useState<PickerEntry[]>([]);
  const [phase, setPhase] = useState<"pick" | "compare">("pick");
  const [loadingChallenged, setLoadingChallenged] = useState(true);
  const [loadingChallenger, setLoadingChallenger] = useState(false);
  const [errorChallenged, setErrorChallenged] = useState(false);
  const [shared, setShared] = useState(false);

  // Load challenged strategy
  useEffect(() => {
    async function fetchChallenged() {
      try {
        const res = await fetch(`/api/strategy/${id}`);
        if (!res.ok) {
          setErrorChallenged(true);
          return;
        }
        const data = await res.json();
        setChallenged(data);
      } catch {
        setErrorChallenged(true);
      } finally {
        setLoadingChallenged(false);
      }
    }
    fetchChallenged();
  }, [id]);

  // Load leaderboard for picker
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard?limit=20");
        if (!res.ok) return;
        const data = await res.json();
        // Exclude the challenged strategy itself
        setLeaderboard(
          (data.strategies as PickerEntry[]).filter((s) => s.id !== id)
        );
      } catch {}
    }
    fetchLeaderboard();
  }, [id]);

  // Pick a challenger
  async function handlePick(challengerId: string) {
    setLoadingChallenger(true);
    try {
      const res = await fetch(`/api/strategy/${challengerId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setChallenger(data);
      setPhase("compare");
    } catch {
      // silently handle
    } finally {
      setLoadingChallenger(false);
    }
  }

  // Share result
  function handleShare() {
    if (!challenged || !challenger) return;
    const winner =
      challenged.compositeScore >= challenger.compositeScore
        ? challenged
        : challenger;
    const loser =
      challenged.compositeScore >= challenger.compositeScore
        ? challenger
        : challenged;
    const text = `"${winner.name}" beat "${loser.name}" on AlphaRing! Score: ${winner.compositeScore.toFixed(0)} vs ${loser.compositeScore.toFixed(0)}. Can you build better?`;
    const url = `${window.location.origin}/compare/${id}`;

    if (navigator.share) {
      navigator
        .share({ title: "AlphaRing Head-to-Head", text, url })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      });
    }
  }

  // Winner determination
  const winner =
    challenged && challenger
      ? challenged.compositeScore >= challenger.compositeScore
        ? challenged
        : challenger
      : null;
  const loser =
    challenged && challenger
      ? challenged.compositeScore >= challenger.compositeScore
        ? challenger
        : challenged
      : null;
  const scoreDiff =
    challenged && challenger
      ? Math.abs(challenged.compositeScore - challenger.compositeScore)
      : 0;

  // ── Loading ──────────────────────────────────────────────

  if (loadingChallenged) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-20 h-20 rounded-2xl bg-surface-elevated mx-auto" />
          <div className="h-4 w-48 bg-surface-elevated rounded mx-auto" />
          <div className="h-3 w-32 bg-surface-elevated/50 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (errorChallenged || !challenged) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Strategy not found</p>
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
          >
            Back to Arena
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Back link */}
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <Link
          href={`/strategy/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Strategy
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-4 space-y-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">
            Head-to-Head Challenge
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            {phase === "pick"
              ? "Pick Your Challenger"
              : `${challenged.name} vs ${challenger?.name}`}
          </h1>
        </motion.div>

        {/* Phase: PICK */}
        <AnimatePresence mode="wait">
          {phase === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* Challenged strategy preview */}
              <div className="flex flex-col sm:flex-row items-stretch gap-4">
                <StrategyHeaderCard
                  strategy={challenged}
                  accentColor="#00D4FF"
                  label="Challenged"
                />
                {/* VS divider */}
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-2xl font-display font-black text-surface-border/50 sm:px-4 py-2">
                    VS
                  </span>
                </div>
                {/* Placeholder for challenger */}
                <div className="rounded-xl border border-surface-border/15 border-dashed flex-1 flex items-center justify-center py-8 sm:py-0 min-h-[140px]">
                  <p className="text-sm text-gray-600 font-mono">
                    ← Pick a strategy below
                  </p>
                </div>
              </div>

              {/* Picker grid */}
              <div>
                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4">
                  Available Strategies — click to challenge
                </p>
                {leaderboard.length === 0 ? (
                  <div className="rounded-xl border border-surface-border/20 p-6 text-center text-sm text-gray-600">
                    Loading strategies...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {leaderboard.map((s) => (
                      <PickerCard
                        key={s.id}
                        strategy={s}
                        onSelect={handlePick}
                        loading={loadingChallenger}
                      />
                    ))}
                  </div>
                )}
                {loadingChallenger && (
                  <div className="mt-4 text-center text-sm text-gray-500 font-mono animate-pulse">
                    Loading challenger data...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase: COMPARE */}
          {phase === "compare" && challenger && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Strategy Header Cards */}
              <div className="flex flex-col sm:flex-row items-stretch gap-4">
                <StrategyHeaderCard
                  strategy={challenged}
                  accentColor="#00D4FF"
                  label="Challenged"
                />
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-2xl font-display font-black text-surface-border/40 sm:px-4">
                    VS
                  </span>
                </div>
                <StrategyHeaderCard
                  strategy={challenger}
                  accentColor="#F59E0B"
                  label="Challenger"
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 text-xs font-mono pl-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-accent rounded" />
                  <span className="text-gray-500">{challenged.name}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-400 rounded" />
                  <span className="text-gray-500">{challenger.name}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-white/20 rounded" style={{ borderTop: "1px dashed rgba(255,255,255,0.2)" }} />
                  <span className="text-gray-600">S&amp;P 500</span>
                </span>
              </div>

              {/* Equity Curve Chart */}
              <div className="rounded-xl border border-surface-border/30 overflow-hidden">
                <CompareChart
                  seriesA={challenged.equityCurve}
                  seriesB={challenger.equityCurve}
                  labelA={challenged.name}
                  labelB={challenger.name}
                />
              </div>

              {/* Stats Comparison Table */}
              <div className="rounded-xl border border-surface-border/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border/20 bg-surface-card">
                  <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
                    Performance Comparison
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-elevated/30">
                        <th className="px-4 py-2.5 text-left text-[9px] font-mono text-gray-600 uppercase tracking-wider">
                          Metric
                        </th>
                        <th className="px-4 py-2.5 text-right text-[9px] font-mono uppercase tracking-wider" style={{ color: "#00D4FF" }}>
                          {challenged.name}
                        </th>
                        <th className="px-4 py-2.5 text-right text-[9px] font-mono uppercase tracking-wider text-amber-400">
                          {challenger.name}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <StatRow
                        label="Total Return"
                        aFormatted={`${challenged.returnPct > 0 ? "+" : ""}${challenged.returnPct.toFixed(1)}%`}
                        bFormatted={`${challenger.returnPct > 0 ? "+" : ""}${challenger.returnPct.toFixed(1)}%`}
                        aRaw={challenged.returnPct}
                        bRaw={challenger.returnPct}
                      />
                      <StatRow
                        label="Sharpe Ratio"
                        aFormatted={challenged.sharpeRatio.toFixed(2)}
                        bFormatted={challenger.sharpeRatio.toFixed(2)}
                        aRaw={challenged.sharpeRatio}
                        bRaw={challenger.sharpeRatio}
                      />
                      <StatRow
                        label="Max Drawdown"
                        aFormatted={`${challenged.maxDrawdownPct.toFixed(1)}%`}
                        bFormatted={`${challenger.maxDrawdownPct.toFixed(1)}%`}
                        aRaw={challenged.maxDrawdownPct}
                        bRaw={challenger.maxDrawdownPct}
                        lowerBetter
                      />
                      <StatRow
                        label="Win Rate"
                        aFormatted={`${challenged.winRatePct.toFixed(1)}%`}
                        bFormatted={`${challenger.winRatePct.toFixed(1)}%`}
                        aRaw={challenged.winRatePct}
                        bRaw={challenger.winRatePct}
                      />
                      <StatRow
                        label="Total Trades"
                        aFormatted={challenged.totalTrades.toString()}
                        bFormatted={challenger.totalTrades.toString()}
                        aRaw={challenged.totalTrades}
                        bRaw={challenger.totalTrades}
                      />
                      <StatRow
                        label="Composite Score"
                        aFormatted={`${challenged.compositeScore.toFixed(1)}/100`}
                        bFormatted={`${challenger.compositeScore.toFixed(1)}/100`}
                        aRaw={challenged.compositeScore}
                        bRaw={challenger.compositeScore}
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Winner Declaration */}
              {winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: `${gradeColor(winner.grade)}30`,
                    background: `${gradeColor(winner.grade)}06`,
                  }}
                >
                  <div className="px-6 py-6 text-center">
                    <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                      Winner
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <span className="text-3xl">🏆</span>
                      <h2
                        className="text-2xl sm:text-3xl font-display font-black"
                        style={{ color: gradeColor(winner.grade) }}
                      >
                        {winner.name}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Score{" "}
                      <span className="font-mono text-gray-300">
                        {winner.compositeScore.toFixed(1)}
                      </span>{" "}
                      vs{" "}
                      <span className="font-mono text-gray-500">
                        {loser?.compositeScore.toFixed(1)}
                      </span>{" "}
                      &mdash;{" "}
                      <span
                        className="font-mono"
                        style={{ color: gradeColor(winner.grade) }}
                      >
                        +{scoreDiff.toFixed(1)} pts ahead
                      </span>
                    </p>
                    <div className="mt-3 flex justify-center">
                      <GradeBadge grade={winner.grade} size="lg" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex-1 py-3.5 rounded-xl border border-accent/25 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent/40 transition-all flex items-center justify-center gap-2"
                >
                  {shared ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied to clipboard!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Result
                    </>
                  )}
                </button>

                {/* Try Different */}
                <button
                  onClick={() => {
                    setChallenger(null);
                    setPhase("pick");
                  }}
                  className="flex-1 py-3.5 rounded-xl border border-surface-border/30 text-gray-400 font-semibold text-sm hover:border-surface-border/60 hover:text-gray-200 transition-all"
                >
                  Try Different Strategy
                </button>

                {/* Create Yours */}
                <button
                  onClick={() => router.push("/create?mode=advanced")}
                  className="btn-shine flex-1 py-3.5 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors"
                >
                  Build a Better One
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
