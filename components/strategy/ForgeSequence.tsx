"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";
import type { BacktestResult } from "@/lib/backtester";
import type { Grade } from "@/lib/grading";
import { renderStrategyCode } from "@/lib/code-renderer";
import { loadMultipleStocks, loadBenchmark, type StockBar } from "@/lib/data";
import { backtest } from "@/lib/backtester";
import { gradeStrategy } from "@/lib/grading";

type Stage = "interpretation" | "code" | "backtesting";

interface ForgeSequenceProps {
  strategy: StrategyConfig;
  onComplete: (result: BacktestResult, grade: Grade) => void;
  onEdit: () => void;
}

// ─── Simple syntax highlighting ────────────────────────

function highlightCode(line: string): ReactNode {
  if (line.trim() === "") return "\u00A0";

  // Comments
  if (line.trimStart().startsWith("#")) {
    return <span className="text-gray-500 italic">{line}</span>;
  }

  // Docstrings
  if (line.includes('"""')) {
    return <span className="text-emerald-400">{line}</span>;
  }

  // Tokenize the line
  const segments: ReactNode[] = [];
  let key = 0;
  const kwSet = new Set([
    "import", "from", "class", "def", "if", "elif", "else", "for",
    "in", "return", "self", "as", "and", "or", "not", "True", "False", "None",
  ]);

  // Split by string literals first
  const parts = line.split(/(["'][^"']*["'])/);

  for (const part of parts) {
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'"))
    ) {
      segments.push(
        <span key={key++} className="text-emerald-400">{part}</span>
      );
    } else {
      // Split by word boundaries and highlight keywords/numbers
      const tokens = part.split(/(\b\w+\b)/);
      for (const token of tokens) {
        if (kwSet.has(token)) {
          segments.push(
            <span key={key++} className="text-accent">{token}</span>
          );
        } else if (/^\d+\.?\d*$/.test(token)) {
          segments.push(
            <span key={key++} className="text-amber-400">{token}</span>
          );
        } else {
          segments.push(
            <span key={key++} className="text-gray-300">{token}</span>
          );
        }
      }
    }
  }

  return <>{segments}</>;
}

// ─── Main component ────────────────────────────────────

export default function ForgeSequence({
  strategy,
  onComplete,
  onEdit,
}: ForgeSequenceProps) {
  const [stage, setStage] = useState<Stage>("interpretation");
  const [codeLines, setCodeLines] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<{
    stockData: Record<string, StockBar[]>;
    benchmarkData: StockBar[];
  } | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Generate code lines
  useEffect(() => {
    setCodeLines(renderStrategyCode(strategy));
  }, [strategy]);

  // Pre-load stock data immediately
  useEffect(() => {
    let cancelled = false;
    async function preload() {
      try {
        const [stockData, benchmarkData] = await Promise.all([
          loadMultipleStocks(strategy.universe),
          loadBenchmark(),
        ]);
        if (!cancelled) {
          dataRef.current = { stockData, benchmarkData };
        }
      } catch (err) {
        console.error("Failed to preload data:", err);
      }
    }
    preload();
    return () => { cancelled = true; };
  }, [strategy.universe]);

  // Stage 1: Auto-advance after 3s
  useEffect(() => {
    if (stage !== "interpretation") return;
    const timer = setTimeout(() => setStage("code"), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 2: Typewriter animation
  useEffect(() => {
    if (stage !== "code" || codeLines.length === 0) return;

    let lineIdx = 0;
    let charIdx = 0;

    const interval = setInterval(() => {
      if (lineIdx >= codeLines.length) {
        clearInterval(interval);
        setTimeout(() => setStage("backtesting"), 600);
        return;
      }

      const currentLine = codeLines[lineIdx];
      charIdx++;

      if (charIdx > currentLine.length) {
        lineIdx++;
        charIdx = 0;
        setVisibleLines(lineIdx);
        setTypingIndex(0);
      } else {
        setVisibleLines(lineIdx);
        setTypingIndex(charIdx);
      }
    }, 5);

    return () => clearInterval(interval);
  }, [stage, codeLines]);

  // Stage 3: Run backtest
  const runBacktest = useCallback(async () => {
    // Wait for data
    let waitTime = 0;
    while (!dataRef.current && waitTime < 15000) {
      await new Promise((r) => setTimeout(r, 200));
      waitTime += 200;
    }

    if (!dataRef.current) {
      setError("Failed to load market data. Please try again.");
      return;
    }

    const progressInterval = setInterval(() => {
      setBacktestProgress((prev) => Math.min(prev + Math.random() * 12, 85));
    }, 200);

    try {
      // Small delay so the progress bar has time to show
      await new Promise((r) => setTimeout(r, 400));

      const { stockData, benchmarkData } = dataRef.current;
      const result = backtest(strategy, stockData, benchmarkData);
      const grade = gradeStrategy(result);

      clearInterval(progressInterval);
      setBacktestProgress(100);

      // Brief pause at 100%
      await new Promise((r) => setTimeout(r, 700));
      onCompleteRef.current(result, grade);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Backtest error:", err);
      setError("Backtest failed. Please try editing your strategy.");
    }
  }, [strategy]);

  useEffect(() => {
    if (stage !== "backtesting") return;
    runBacktest();
  }, [stage, runBacktest]);

  // Auto-scroll code
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop =
        codeContainerRef.current.scrollHeight;
    }
  }, [visibleLines, typingIndex]);

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-4xl mb-4">&#9888;&#65039;</div>
        <h2 className="text-xl font-display font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={onEdit}
          className="btn-shine px-6 py-3 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors"
        >
          Edit Strategy
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Stage 1: Interpretation Card */}
        {stage === "interpretation" && (
          <motion.div
            key="interpretation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
                <span className="text-xs font-mono text-accent/80">
                  ANALYZING STRATEGY
                </span>
              </div>
              <h2 className="text-2xl font-display font-bold">
                {strategy.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {strategy.description}
              </p>
            </div>

            {/* Strategy breakdown terminal */}
            <div className="rounded-xl border border-accent/20 bg-surface-card overflow-hidden glow-accent">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border/30 bg-surface-elevated/30">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-loss/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-profit/50" />
                </div>
                <span className="text-[10px] font-mono text-gray-600 ml-2 uppercase tracking-[0.2em]">
                  strategy breakdown
                </span>
              </div>
              <div className="p-5 space-y-3 font-mono text-sm">
                {[
                  {
                    label: "STRATEGY",
                    value: strategy.name,
                    color: "text-white",
                  },
                  {
                    label: "ENTRY",
                    value: strategy.entry.conditions
                      .map(
                        (c) =>
                          `${c.indicator}(${c.period ?? 14}) ${c.operator} ${c.compare_to || c.value}`
                      )
                      .join(` ${strategy.entry.logic} `),
                    color: "text-accent",
                  },
                  {
                    label: "EXIT",
                    value:
                      [
                        strategy.exit.take_profit_pct &&
                          `+${strategy.exit.take_profit_pct}% take profit`,
                        strategy.exit.stop_loss_pct &&
                          `-${strategy.exit.stop_loss_pct}% stop loss`,
                        strategy.exit.max_hold_days &&
                          `${strategy.exit.max_hold_days} day max hold`,
                        ...(strategy.exit.conditions || []).map(
                          (c) =>
                            `${c.indicator}(${c.period ?? 14}) ${c.operator} ${c.value}`
                        ),
                      ]
                        .filter(Boolean)
                        .join(" OR ") || "No fixed exit",
                    color: "text-gray-300",
                  },
                  {
                    label: "ASSETS",
                    value: strategy.universe.join(", "),
                    color: "text-gray-300",
                  },
                  {
                    label: "SIZING",
                    value: `${strategy.position_sizing}, max ${strategy.max_positions} positions @ ${strategy.max_position_pct}%`,
                    color: "text-gray-300",
                  },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex"
                  >
                    <span className="text-gray-600 w-24 shrink-0">
                      {row.label}
                    </span>
                    <span className={row.color}>{row.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={onEdit}
                className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
              >
                &larr; Edit strategy
              </button>
              <button
                onClick={() => setStage("code")}
                className="text-sm text-accent/60 hover:text-accent transition-colors"
              >
                Skip &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Stage 2: Code Animation */}
        {stage === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-accent/20 bg-accent/[0.06] mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
                <span className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">
                  GENERATING ALGORITHM
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border/50 bg-[#0A0A12] overflow-hidden glow-accent">
              {/* Editor chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border/30 bg-surface-elevated/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-loss/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-profit/50" />
                </div>
                <span className="text-[10px] font-mono text-gray-600 ml-2">
                  strategy.py
                </span>
              </div>

              {/* Code body */}
              <div
                ref={codeContainerRef}
                className="p-4 max-h-[420px] overflow-y-auto hide-scrollbar"
              >
                <pre className="text-[13px] font-mono leading-6">
                  {codeLines.map((line, i) => {
                    if (i > visibleLines) return null;

                    const isCurrentLine = i === visibleLines;
                    const displayText = isCurrentLine
                      ? line.slice(0, typingIndex)
                      : line;

                    return (
                      <div key={i} className="flex">
                        <span className="w-8 text-right pr-3 text-gray-700 select-none text-xs leading-6">
                          {i + 1}
                        </span>
                        <span>
                          {isCurrentLine ? (
                            <>
                              <span className="text-gray-400">
                                {displayText}
                              </span>
                              <span className="cursor-blink text-accent">
                                &#9610;
                              </span>
                            </>
                          ) : (
                            highlightCode(displayText)
                          )}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                onClick={() => setStage("backtesting")}
                className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
              >
                Skip &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Backtesting */}
        {stage === "backtesting" && (
          <motion.div
            key="backtesting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-profit/10 border border-profit/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-profit live-dot" />
              <span className="text-xs font-mono text-profit/80">
                RUNNING BACKTEST
              </span>
            </div>

            <h2 className="text-2xl font-display font-bold mb-2">
              Simulating 10 years of trading
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Testing {strategy.name} across {strategy.universe.length} stocks,
              ~2,520 trading days...
            </p>

            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-profit rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${backtestProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="mt-3 text-xs font-mono text-gray-600">
                {backtestProgress < 100
                  ? `${Math.round(backtestProgress)}% complete`
                  : "Analyzing results..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
