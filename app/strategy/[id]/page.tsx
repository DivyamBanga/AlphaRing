"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import GradeBadge from "@/components/ui/GradeBadge";
import EquityCurve from "@/components/ui/EquityCurve";
import type { StrategyConfig, Condition } from "@/lib/strategy-schema";
import type { EquityCurvePoint, TradeRecord } from "@/lib/backtester";
import {
  STRATEGY_TYPE_LABELS,
  type StrategyType,
} from "@/lib/mock-strategies";

// ── Share Buttons ────────────────────────────────────

interface ShareButtonsProps {
  strategyName: string;
  grade: string;
  returnPct: number;
  strategyId: string;
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

  const strategyUrl = `${siteUrl}/strategy/${strategyId}`;

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
      // fallback
    }
  }

  return (
    <div className="flex gap-2">
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
    </div>
  );
}

// ── Types ───────────────────────────────────────────────

interface StrategyDetail {
  id: string;
  name: string;
  creator: string;
  englishPrompt: string;
  type: StrategyType;
  config: StrategyConfig;
  returnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  avgTradeDuration: number;
  grade: string;
  compositeScore: number;
  createdAt: string;
  equityCurve: EquityCurvePoint[];
  tradeLog: TradeRecord[];
}

// ── Strategy Breakdown ──────────────────────────────────

function conditionToReadable(c: Condition): string {
  const indicatorNames: Record<string, string> = {
    price_change_pct: "Price Change %",
    sma: "SMA",
    ema: "EMA",
    rsi: "RSI",
    volume_ratio: "Volume Ratio",
    bollinger_upper: "Bollinger Upper",
    bollinger_lower: "Bollinger Lower",
    bollinger_middle: "Bollinger Middle",
    macd_line: "MACD Line",
    macd_signal: "MACD Signal",
    macd_histogram: "MACD Histogram",
    atr: "ATR",
  };

  const opNames: Record<string, string> = {
    ">=": ">=",
    "<=": "<=",
    ">": ">",
    "<": "<",
    crosses_above: "crosses above",
    crosses_below: "crosses below",
  };

  const name = indicatorNames[c.indicator] || c.indicator;
  const period = c.period ? `(${c.period})` : "";
  const op = opNames[c.operator] || c.operator;

  if (c.compare_to) {
    return `${name}${period} ${op} ${c.compare_to.toUpperCase().replace("_", " ")}`;
  }
  return `${name}${period} ${op} ${c.value}`;
}

function StrategyBreakdown({ config }: { config: StrategyConfig }) {
  return (
    <div className="rounded-xl border border-surface-border/30 bg-surface-card overflow-hidden font-mono text-sm">
      <div className="px-5 py-3 border-b border-surface-border/20 bg-surface-elevated/30">
        <span className="text-accent font-bold tracking-wider text-xs uppercase">
          STRATEGY: {config.name}
        </span>
      </div>
      <div className="px-5 py-4 space-y-3">
        {/* Entry */}
        <div>
          <span className="text-gray-500 text-xs">ENTRY</span>
          <div className="mt-1 text-gray-300">
            {config.entry.conditions.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                {i > 0 && (
                  <span className="text-accent/60 text-xs mt-0.5">
                    {config.entry.logic}
                  </span>
                )}
                <span>{conditionToReadable(c)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exit */}
        <div>
          <span className="text-gray-500 text-xs">EXIT</span>
          <div className="mt-1 text-gray-300 space-y-0.5">
            {config.exit.take_profit_pct && (
              <div>Take Profit: +{config.exit.take_profit_pct}%</div>
            )}
            {config.exit.stop_loss_pct && (
              <div>Stop Loss: -{config.exit.stop_loss_pct}%</div>
            )}
            {config.exit.max_hold_days && (
              <div>Max Hold: {config.exit.max_hold_days} days</div>
            )}
            {config.exit.conditions?.map((c, i) => (
              <div key={i}>{conditionToReadable(c)}</div>
            ))}
          </div>
        </div>

        {/* Assets */}
        <div>
          <span className="text-gray-500 text-xs">ASSETS</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {config.universe.map((t) => (
              <span
                key={t}
                className="text-xs px-1.5 py-0.5 rounded bg-accent/5 text-accent/80 border border-accent/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Sizing */}
        <div>
          <span className="text-gray-500 text-xs">SIZING</span>
          <div className="mt-1 text-gray-300">
            {config.position_sizing === "equal_weight"
              ? "Equal weight"
              : "Risk parity"}
            , max {config.max_positions} positions, max{" "}
            {config.max_position_pct}% per position
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats Grid ──────────────────────────────────────────

function StatsGrid({ strategy }: { strategy: StrategyDetail }) {
  const stats = [
    {
      label: "Total Return",
      value: `${strategy.returnPct > 0 ? "+" : ""}${strategy.returnPct.toFixed(1)}%`,
      color: strategy.returnPct >= 0 ? "text-profit" : "text-loss",
    },
    {
      label: "Sharpe Ratio",
      value: strategy.sharpeRatio.toFixed(2),
      color:
        strategy.sharpeRatio >= 1
          ? "text-profit"
          : strategy.sharpeRatio >= 0
            ? "text-gray-200"
            : "text-loss",
    },
    {
      label: "Max Drawdown",
      value: `-${strategy.maxDrawdownPct.toFixed(1)}%`,
      color: strategy.maxDrawdownPct <= 20 ? "text-gray-200" : "text-loss",
    },
    {
      label: "Win Rate",
      value: `${strategy.winRatePct.toFixed(1)}%`,
      color: strategy.winRatePct >= 50 ? "text-profit" : "text-gray-200",
    },
    {
      label: "Total Trades",
      value: strategy.totalTrades.toString(),
      color: "text-gray-200",
    },
    {
      label: "Avg Duration",
      value: `${strategy.avgTradeDuration}d`,
      color: "text-gray-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="p-4 rounded-xl bg-surface-card border border-surface-border/30"
        >
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className={`text-xl font-display font-bold ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Trade Log ───────────────────────────────────────────

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
        No trades in sample.
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
          Trade Log ({trades.length} sample trades)
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
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
                    className={`px-3 py-2 text-right font-medium ${
                      trade.returnPct >= 0 ? "text-profit" : "text-loss"
                    }`}
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

// ── Grade Color ─────────────────────────────────────────

function gradeToColor(grade: string): string {
  if (grade.startsWith("A")) return "#22C55E";
  if (grade.startsWith("B")) return "#EAB308";
  if (grade === "C") return "#F97316";
  if (grade === "D") return "#F97316";
  return "#EF4444";
}

// ── Main Strategy Detail Page ───────────────────────────

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const res = await fetch(`/api/strategy/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = await res.json();
        setStrategy(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStrategy();
  }, [id]);

  if (loading) {
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

  if (error || !strategy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-lg">Strategy not found</p>
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
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
            Back to Arena
          </Link>
        </div>
      </div>
    );
  }

  const color = gradeToColor(strategy.grade);

  return (
    <div className="min-h-screen pb-20">
      {/* Back link */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/arena"
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
          Back to Arena
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          {/* Grade */}
          <div
            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0"
            style={{
              borderColor: color,
              background: `${color}15`,
              boxShadow: `0 0 30px ${color}15`,
            }}
          >
            <span
              className="text-3xl font-display font-black"
              style={{ color }}
            >
              {strategy.grade}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                {strategy.name}
              </h1>
              <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 border border-surface-border/40 rounded px-1.5 py-0.5">
                {STRATEGY_TYPE_LABELS[strategy.type]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>by {strategy.creator}</span>
              <span className="text-surface-border">|</span>
              <span>{strategy.createdAt}</span>
              <span className="text-surface-border">|</span>
              <span>Score: {strategy.compositeScore}/100</span>
            </div>
          </div>
        </motion.div>

        {/* English Description */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-xl border border-surface-border/30 bg-surface-card/50 px-5 py-4"
        >
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">
            ORIGINAL PROMPT
          </p>
          <p className="text-gray-300 text-sm leading-relaxed italic">
            &ldquo;{strategy.englishPrompt}&rdquo;
          </p>
        </motion.div>

        {/* Strategy Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <StrategyBreakdown config={strategy.config} />
        </motion.div>

        {/* Equity Curve */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
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
            <EquityCurve data={strategy.equityCurve} />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h3 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-3">
            Performance Metrics
          </h3>
          <StatsGrid strategy={strategy} />
        </motion.div>

        {/* Trade Log */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <TradeLog trades={strategy.tradeLog} />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <button
            onClick={() =>
              router.push(
                `/create?mode=advanced&prompt=${encodeURIComponent(
                  strategy.englishPrompt
                )}`
              )
            }
            className="btn-shine flex-1 py-3.5 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors"
          >
            Create Similar Strategy
          </button>
          <button
            onClick={() => router.push(`/compare/${strategy.id}`)}
            className="py-3.5 px-6 rounded-xl border border-accent/25 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent/40 transition-all"
          >
            Challenge This Strategy
          </button>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="pt-4 border-t border-[#1A1A1A] pb-8"
        >
          <p className="text-[9px] font-mono text-[#3A3A3A] uppercase tracking-wider mb-3">
            Share this strategy
          </p>
          <ShareButtons
            strategyName={strategy.name}
            grade={strategy.grade}
            returnPct={strategy.returnPct}
            strategyId={strategy.id}
          />
        </motion.div>
      </div>
    </div>
  );
}
