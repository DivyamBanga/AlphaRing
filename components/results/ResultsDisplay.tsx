"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";
import type { BacktestResult, TradeRecord } from "@/lib/backtester";
import type { Grade } from "@/lib/grading";
import EquityCurve from "@/components/ui/EquityCurve";
import { useAuth } from "@/components/providers/AuthProvider";

// ─── useCountUp Hook ──────────────────────────────────────

function useCountUp(
  target: number,
  duration: number = 1200,
  delay: number = 0
): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function startAnimation() {
      startTimeRef.current = null;

      function tick(now: number) {
        if (startTimeRef.current === null) {
          startTimeRef.current = now;
        }
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic: 1 - (1 - t)^3
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(eased * target);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setCurrent(target);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, delay]);

  return current;
}

// ─── Share Buttons ────────────────────────────────────

interface ShareButtonsProps {
  strategyName: string;
  grade: string;
  returnPct: number;
  strategyId?: string;
}

function ShareButtons({
  strategyName,
  grade,
  returnPct,
  strategyId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://alpharing.vercel.app";

  const strategyUrl = strategyId
    ? `${siteUrl}/strategy/${strategyId}`
    : siteUrl;

  const returnDisplay =
    returnPct > 0 ? `+${returnPct.toFixed(1)}` : returnPct.toFixed(1);

  const tweetText = `My trading algorithm "${strategyName}" got an ${grade} on AlphaRing — ${returnDisplay}% return over 10 years. Can you beat it? ${strategyUrl} #AlphaRing #AlgoTrading`;

  function handleShare() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(strategyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 border border-[#2A2A2A] text-[10px] font-mono uppercase tracking-wider text-gray-400 hover:border-[#C5FF00] hover:text-[#C5FF00] transition-colors"
      >
        <span className="font-bold">𝕏</span>
        <span>Share</span>
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 border border-[#2A2A2A] text-[10px] font-mono uppercase tracking-wider text-gray-400 hover:border-[#C5FF00] hover:text-[#C5FF00] transition-colors"
      >
        {copied ? (
          <span className="text-[#C5FF00]">Copied!</span>
        ) : (
          <span>Copy Link</span>
        )}
      </button>
    </>
  );
}

// ─── Stats Grid ──────────────────────────────────────────

interface StatCardProps {
  label: string;
  color: string;
  index: number;
  target: number;
  format: (v: number) => string;
}

function StatCard({ label, color, index, target, format }: StatCardProps) {
  const delay = (0.8 + index * 0.1) * 1000;
  const animated = useCountUp(target, 1200, delay);
  return (
    <motion.div
      key={label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 + index * 0.1 }}
      className="p-4 rounded-xl bg-surface-card border border-surface-border/30"
    >
      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl font-display font-bold ${color}`}>
        {format(animated)}
      </p>
    </motion.div>
  );
}

function StatsGrid({ result }: { result: BacktestResult }) {
  const stats: Array<{
    label: string;
    target: number;
    color: string;
    format: (v: number) => string;
  }> = [
    {
      label: "Total Return",
      target: result.totalReturnPct,
      color: result.totalReturnPct >= 0 ? "text-profit" : "text-loss",
      format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
    },
    {
      label: "Sharpe Ratio",
      target: result.sharpeRatio,
      color:
        result.sharpeRatio >= 1
          ? "text-profit"
          : result.sharpeRatio >= 0
            ? "text-gray-200"
            : "text-loss",
      format: (v) => v.toFixed(2),
    },
    {
      label: "Max Drawdown",
      target: result.maxDrawdownPct,
      color: result.maxDrawdownPct <= 20 ? "text-gray-200" : "text-loss",
      format: (v) => `-${v.toFixed(1)}%`,
    },
    {
      label: "Win Rate",
      target: result.winRatePct,
      color: result.winRatePct >= 50 ? "text-profit" : "text-gray-200",
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: "Total Trades",
      target: result.totalTrades,
      color: "text-gray-200",
      format: (v) => `${Math.round(v)}`,
    },
    {
      label: "Avg Duration",
      target: result.avgTradeDuration,
      color: "text-gray-200",
      format: (v) => `${Math.round(v)}d`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          color={stat.color}
          index={i}
          target={stat.target}
          format={stat.format}
        />
      ))}
    </div>
  );
}

// ─── Trade Log ───────────────────────────────────────────

function TradeLog({ trades }: { trades: TradeRecord[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayTrades = showAll ? trades : trades.slice(0, 20);

  const exitReasonLabel: Record<string, string> = {
    take_profit: "Take Profit",
    stop_loss: "Stop Loss",
    max_hold_days: "Max Hold",
    exit_condition: "Indicator",
    end_of_backtest: "End of Period",
  };

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border/30 p-5 text-center text-sm text-gray-600">
        No trades were executed during the backtest period.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between bg-surface-card hover:bg-surface-elevated/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">
          Trade Log ({trades.length} trades)
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-surface-elevated/50 text-gray-600">
                <th className="px-3 py-2 text-left">Ticker</th>
                <th className="px-3 py-2 text-left">Entry</th>
                <th className="px-3 py-2 text-right">Entry $</th>
                <th className="px-3 py-2 text-left">Exit</th>
                <th className="px-3 py-2 text-right">Exit $</th>
                <th className="px-3 py-2 text-right">Return</th>
                <th className="px-3 py-2 text-right">Days</th>
                <th className="px-3 py-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayTrades.map((trade, i) => (
                <tr
                  key={i}
                  className="border-t border-surface-border/20 hover:bg-surface-elevated/30"
                >
                  <td className="px-3 py-2 text-gray-300 font-medium">
                    {trade.ticker}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {trade.entryDate}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-400">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {trade.exitDate}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-400">
                    ${trade.exitPrice.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${trade.returnPct >= 0 ? "text-profit" : "text-loss"}`}
                  >
                    {trade.returnPct > 0 ? "+" : ""}
                    {trade.returnPct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {trade.holdDays}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {exitReasonLabel[trade.exitReason] || trade.exitReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {trades.length > 20 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-xs text-accent hover:text-accent-light transition-colors bg-surface-card border-t border-surface-border/20"
            >
              Show all {trades.length} trades
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Results Display ────────────────────────────────

interface ResultsDisplayProps {
  strategy: StrategyConfig;
  result: BacktestResult;
  grade: Grade;
  englishPrompt?: string;
  onEdit: () => void;
  onTryAnother: () => void;
}

export default function ResultsDisplay({
  strategy,
  result,
  grade,
  englishPrompt,
  onEdit,
  onTryAnother,
}: ResultsDisplayProps) {
  const { user, signInWithGitHub } = useAuth();
  const [gradeRevealed, setGradeRevealed] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deployedId, setDeployedId] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const animatedScore = useCountUp(grade.score, 1000, 600);

  useEffect(() => {
    const timer = setTimeout(() => setGradeRevealed(true), 300);
    return () => clearTimeout(timer);
  }, []);

  async function handleDeploy() {
    if (!user) {
      signInWithGitHub();
      return;
    }

    setDeployError(null);
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          englishPrompt: englishPrompt || strategy.description,
          result: {
            totalReturnPct: result.totalReturnPct,
            sharpeRatio: result.sharpeRatio,
            maxDrawdownPct: result.maxDrawdownPct,
            winRatePct: result.winRatePct,
            totalTrades: result.totalTrades,
            avgTradeDuration: result.avgTradeDuration,
            grade: grade.letter,
            compositeScore: grade.score,
            equityCurve: result.equityCurve,
            tradeLog: result.tradeLog,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.id) setDeployedId(data.id);
        setDeployed(true);
      } else {
        const data = await response.json();
        setDeployError(data.error || "Deploy failed");
      }
    } catch {
      setDeployError("Failed to connect. Please try again.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Grade Reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", damping: 15 }}
        className="text-center"
      >
        <p className="text-sm text-gray-500 font-mono mb-3">STRATEGY GRADE</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={gradeRevealed ? { opacity: 1, scale: 1 } : {}}
          transition={{
            delay: 0.2,
            duration: 0.6,
            type: "spring",
            damping: 12,
          }}
          className="inline-flex items-center justify-center w-28 h-28 rounded-2xl border-2"
          style={{
            borderColor: grade.color,
            background: `${grade.color}15`,
            boxShadow: `0 0 40px ${grade.color}20, 0 0 80px ${grade.color}10`,
          }}
        >
          <span
            className="text-5xl font-display font-black"
            style={{ color: grade.color }}
          >
            {grade.letter}
          </span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-3 text-sm text-gray-500"
        >
          Score: {animatedScore.toFixed(0)}/100
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-xl font-display font-bold"
        >
          {strategy.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-gray-500 mt-1 max-w-lg mx-auto"
        >
          {strategy.description}
        </motion.p>
      </motion.div>

      {/* Equity Curve */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider">
            Equity Curve (10 Years)
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent rounded" />
              <span className="text-gray-500">Portfolio</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-gray-600 rounded" />
              <span className="text-gray-500">S&amp;P 500</span>
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-surface-border/30 overflow-hidden">
          <EquityCurve data={result.equityCurve} />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">
          Performance Metrics
        </h3>
        <StatsGrid result={result} />
      </motion.div>

      {/* Trade Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <TradeLog trades={result.tradeLog} />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        <div className="flex-1 space-y-2">
          <button
            onClick={handleDeploy}
            disabled={deployed}
            className={`btn-shine w-full py-3.5 font-display font-black text-sm uppercase tracking-[0.1em] transition-colors ${
              deployed
                ? "bg-profit/20 text-profit border border-profit/30 cursor-default"
                : "bg-accent text-[#080808] hover:bg-accent-light"
            }`}
          >
            {deployed
              ? "Deployed!"
              : user
                ? "Deploy to Leaderboard"
                : "Sign In to Deploy"}
          </button>
          {deployError && (
            <p className="text-xs text-loss text-center">{deployError}</p>
          )}
        </div>
        <button
          onClick={onTryAnother}
          className="py-3.5 px-6 rounded-xl border border-surface-border/80 text-gray-300 font-semibold text-sm hover:border-accent/30 hover:text-white transition-all"
        >
          Try Another
        </button>
        <button
          onClick={onEdit}
          className="py-3.5 px-6 rounded-xl border border-surface-border/50 text-gray-500 text-sm hover:text-gray-300 transition-all"
        >
          Edit
        </button>
      </motion.div>

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: deployed ? 0.3 : 1.0 }}
        className="pt-4 border-t border-[#1A1A1A] pb-8"
      >
        <p className="text-[9px] font-mono text-[#3A3A3A] uppercase tracking-wider mb-3">
          Share your results
        </p>
        <div className="flex gap-2">
          <ShareButtons
            strategyName={strategy.name}
            grade={grade.letter}
            returnPct={result.totalReturnPct}
            strategyId={deployedId || undefined}
          />
        </div>
      </motion.div>
    </div>
  );
}
