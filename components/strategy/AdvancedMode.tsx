"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";

const TICKERS_BY_SECTOR: Record<string, string[]> = {
  Technology: [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "AMD", "INTC", "AVGO", "CRM", "ADBE", "ORCL", "NFLX", "QCOM",
  ],
  Finance: ["JPM", "BAC", "WFC", "GS", "MS", "V", "MA"],
  Healthcare: ["JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY"],
  Consumer: ["WMT", "HD", "KO", "PEP", "MCD", "NKE", "SBUX", "DIS"],
  "Industrial & Energy": ["XOM", "CVX", "BA", "CAT", "GE", "UPS"],
  Fintech: ["PYPL", "SHOP", "UBER", "COIN", "SNAP", "PLTR", "SOFI"],
};

interface AdvancedModeProps {
  initialPrompt: string;
  onStrategyReady: (strategy: StrategyConfig, prompt?: string) => void;
}

export default function AdvancedMode({
  initialPrompt,
  onStrategyReady,
}: AdvancedModeProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParams, setShowParams] = useState(false);

  // Manual override params
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [maxPositions, setMaxPositions] = useState(5);
  const [maxPositionPct, setMaxPositionPct] = useState(25);

  function toggleTicker(ticker: string) {
    setSelectedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  }

  async function handleSubmit() {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), mode: "advanced" }),
      });

      const result = await response.json();

      if (result.type === "strategy") {
        const strategy: StrategyConfig = { ...result.data };
        if (selectedTickers.length > 0) strategy.universe = selectedTickers;
        if (showParams) {
          strategy.max_positions = maxPositions;
          strategy.max_position_pct = maxPositionPct;
        }
        onStrategyReady(strategy, prompt.trim());
      } else if (result.type === "error" || result.error) {
        setError(result.message || result.error);
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Input area */}
      <div className="gradient-border rounded-2xl">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe your trading strategy in plain English...\n\ne.g. "Buy tech stocks when they dip 10% with high volume, sell at 8% profit or 4% stop loss"`}
          className="w-full h-40 bg-transparent p-5 text-gray-200 placeholder-gray-600 resize-none focus:outline-none font-body text-sm leading-relaxed"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 px-4 py-3 rounded-lg bg-loss/10 border border-loss/20 text-loss text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parameters panel toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowParams(!showParams)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showParams ? "rotate-90" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6 6L14 10L6 14V6Z" />
          </svg>
          Advanced Parameters
        </button>

        <AnimatePresence>
          {showParams && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-5 rounded-xl bg-surface-card border border-surface-border/50 space-y-5">
                {/* Ticker picker */}
                <div>
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                    Stock Universe
                    {selectedTickers.length > 0 &&
                      ` (${selectedTickers.length} selected)`}
                  </label>
                  {Object.entries(TICKERS_BY_SECTOR).map(
                    ([sector, tickers]) => (
                      <div key={sector} className="mt-2">
                        <span className="text-[10px] text-gray-600 font-mono">
                          {sector}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tickers.map((ticker) => (
                            <button
                              key={ticker}
                              onClick={() => toggleTicker(ticker)}
                              className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                                selectedTickers.includes(ticker)
                                  ? "bg-accent/20 text-accent border border-accent/30"
                                  : "bg-surface-elevated text-gray-500 border border-surface-border/30 hover:text-gray-300"
                              }`}
                            >
                              {ticker}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Position sizing controls */}
                <div className="flex gap-6">
                  <div>
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      Max Positions
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxPositions}
                      onChange={(e) => setMaxPositions(Number(e.target.value))}
                      className="mt-1 w-20 px-3 py-1.5 bg-surface-elevated border border-surface-border/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      Max Position %
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxPositionPct}
                      onChange={(e) =>
                        setMaxPositionPct(Number(e.target.value))
                      }
                      className="mt-1 w-20 px-3 py-1.5 bg-surface-elevated border border-surface-border/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/30"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-accent to-cyan-300 text-surface font-semibold text-sm hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-shine"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-25"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            Interpreting your strategy...
          </span>
        ) : (
          "Forge Strategy"
        )}
      </motion.button>

      <p className="mt-3 text-center text-xs text-gray-600">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-surface-elevated rounded text-gray-500 font-mono text-[10px]">
          Ctrl
        </kbd>{" "}
        +{" "}
        <kbd className="px-1.5 py-0.5 bg-surface-elevated rounded text-gray-500 font-mono text-[10px]">
          Enter
        </kbd>{" "}
        to submit
      </p>
    </div>
  );
}
