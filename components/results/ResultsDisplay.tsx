"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";
import type { BacktestResult, TradeRecord, EquityCurvePoint } from "@/lib/backtester";
import type { Grade } from "@/lib/grading";

// ─── Equity Curve Chart ─────────────────────────────────

function EquityCurve({ data }: { data: EquityCurvePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    let mounted = true;

    async function initChart() {
      const lc = await import("lightweight-charts");
      if (!mounted || !containerRef.current) return;

      // Clean up previous chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 350,
        layout: {
          background: { color: "#0F0F17" },
          textColor: "#555",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          vertLine: {
            color: "rgba(0, 212, 255, 0.3)",
            width: 1,
            style: 2,
          },
          horzLine: {
            color: "rgba(0, 212, 255, 0.3)",
            width: 1,
            style: 2,
          },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: false,
        },
      });

      chartInstanceRef.current = chart;

      // Try v5 API first, fall back to v4
      const areaOptions = {
        lineColor: "#00D4FF",
        topColor: "rgba(0, 212, 255, 0.15)",
        bottomColor: "rgba(0, 212, 255, 0.01)",
        lineWidth: 2 as const,
        title: "Portfolio",
      };

      const lineOptions = {
        color: "rgba(255, 255, 255, 0.2)",
        lineWidth: 1 as const,
        lineStyle: 2,
        title: "S&P 500",
      };

      let portfolioSeries: { setData: (d: { time: string; value: number }[]) => void };
      let benchmarkSeries: { setData: (d: { time: string; value: number }[]) => void };

      if ("AreaSeries" in lc) {
        // v5 API
        portfolioSeries = chart.addSeries(
          lc.AreaSeries as Parameters<typeof chart.addSeries>[0],
          areaOptions
        );
        benchmarkSeries = chart.addSeries(
          lc.LineSeries as Parameters<typeof chart.addSeries>[0],
          lineOptions
        );
      } else {
        // v4 fallback
        const c = chart as unknown as {
          addAreaSeries: (opts: typeof areaOptions) => typeof portfolioSeries;
          addLineSeries: (opts: typeof lineOptions) => typeof benchmarkSeries;
        };
        portfolioSeries = c.addAreaSeries(areaOptions);
        benchmarkSeries = c.addLineSeries(lineOptions);
      }

      portfolioSeries.setData(
        data.map((d) => ({ time: d.date, value: d.portfolioValue }))
      );

      benchmarkSeries.setData(
        data.map((d) => ({ time: d.date, value: d.benchmarkValue }))
      );

      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const cleanup = initChart();

    return () => {
      mounted = false;
      cleanup?.then?.((fn) => fn?.());
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [data]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}

// ─── Stats Grid ──────────────────────────────────────────

function StatsGrid({ result }: { result: BacktestResult }) {
  const stats = [
    {
      label: "Total Return",
      value: `${result.totalReturnPct > 0 ? "+" : ""}${result.totalReturnPct.toFixed(1)}%`,
      color:
        result.totalReturnPct >= 0 ? "text-profit" : "text-loss",
    },
    {
      label: "Sharpe Ratio",
      value: result.sharpeRatio.toFixed(2),
      color:
        result.sharpeRatio >= 1
          ? "text-profit"
          : result.sharpeRatio >= 0
            ? "text-gray-200"
            : "text-loss",
    },
    {
      label: "Max Drawdown",
      value: `-${result.maxDrawdownPct.toFixed(1)}%`,
      color: result.maxDrawdownPct <= 20 ? "text-gray-200" : "text-loss",
    },
    {
      label: "Win Rate",
      value: `${result.winRatePct.toFixed(1)}%`,
      color: result.winRatePct >= 50 ? "text-profit" : "text-gray-200",
    },
    {
      label: "Total Trades",
      value: result.totalTrades.toString(),
      color: "text-gray-200",
    },
    {
      label: "Avg Duration",
      value: `${result.avgTradeDuration.toFixed(0)}d`,
      color: "text-gray-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.1 }}
          className="p-4 rounded-xl bg-surface-card border border-surface-border/30"
        >
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className={`text-xl font-display font-bold ${stat.color}`}>
            {stat.value}
          </p>
        </motion.div>
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
  onEdit: () => void;
  onTryAnother: () => void;
}

export default function ResultsDisplay({
  strategy,
  result,
  grade,
  onEdit,
  onTryAnother,
}: ResultsDisplayProps) {
  const [gradeRevealed, setGradeRevealed] = useState(false);
  const [deployed, setDeployed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGradeRevealed(true), 300);
    return () => clearTimeout(timer);
  }, []);

  async function handleDeploy() {
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          result: {
            totalReturnPct: result.totalReturnPct,
            sharpeRatio: result.sharpeRatio,
            maxDrawdownPct: result.maxDrawdownPct,
            winRatePct: result.winRatePct,
            totalTrades: result.totalTrades,
            grade: grade.letter,
            compositeScore: grade.score,
          },
        }),
      });

      if (response.ok) {
        setDeployed(true);
      }
    } catch {
      // Deploy is stubbed anyway, so silently handle
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
          Score: {grade.score}/100
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
        className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
      >
        <button
          onClick={handleDeploy}
          disabled={deployed}
          className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 btn-shine ${
            deployed
              ? "bg-profit/20 text-profit border border-profit/30 cursor-default"
              : "bg-gradient-to-r from-accent to-cyan-300 text-surface hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.01]"
          }`}
        >
          {deployed ? "Deployed!" : "Deploy to Leaderboard"}
        </button>
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
    </div>
  );
}
