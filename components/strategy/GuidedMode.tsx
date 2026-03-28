"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";

const STARTER_CHIPS = [
  { label: "RSI dip buy", prompt: "Buy when RSI drops below 30 and sell when it rises above 70" },
  { label: "Golden cross", prompt: "Buy when the 50-day moving average crosses above the 200-day moving average" },
  { label: "Volume breakout", prompt: "Buy when volume spikes to 3x the 20-day average and price is near a 52-week high" },
  { label: "Dip buyer", prompt: "Buy popular tech stocks when they drop 10% in a week, sell when up 20%" },
  { label: "Mean reversion", prompt: "Buy S&P 500 stocks when they fall 15% below their 200-day moving average" },
  { label: "MACD momentum", prompt: "Buy when MACD line crosses above the signal line and RSI is above 50" },
];

const SECTORS: Record<string, { tickers: string[]; color: string }> = {
  Technology: {
    tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AMD", "INTC", "NFLX", "CRM", "ADBE", "ORCL", "AVGO", "QCOM"],
    color: "text-blue-400",
  },
  Finance: {
    tickers: ["JPM", "BAC", "WFC", "GS", "MS", "V", "MA"],
    color: "text-emerald-400",
  },
  Healthcare: {
    tickers: ["JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY"],
    color: "text-pink-400",
  },
  Consumer: {
    tickers: ["WMT", "HD", "KO", "PEP", "MCD", "NKE", "SBUX", "DIS"],
    color: "text-orange-400",
  },
  Energy: {
    tickers: ["XOM", "CVX", "BA", "CAT", "GE", "UPS"],
    color: "text-yellow-400",
  },
  Fintech: {
    tickers: ["PYPL", "SHOP", "UBER", "COIN", "SNAP", "PLTR", "SOFI"],
    color: "text-purple-400",
  },
};

interface GuidedModeProps {
  initialPrompt: string;
  onStrategyReady: (strategy: StrategyConfig, prompt?: string) => void;
}

export default function GuidedMode({
  initialPrompt,
  onStrategyReady,
}: GuidedModeProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visual controls
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(15);
  const [maxHoldDays, setMaxHoldDays] = useState(30);
  const [riskLevel, setRiskLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  function toggleSector(sector: string) {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  }

  function getSelectedTickers(): string[] {
    if (selectedSectors.length === 0) return [];
    return selectedSectors.flatMap((s) => SECTORS[s]?.tickers ?? []);
  }

  function buildEnhancedPrompt(): string {
    let enhanced = prompt.trim();

    if (selectedSectors.length > 0) {
      enhanced += ` Focus on ${selectedSectors.join(", ")} stocks.`;
    }
    enhanced += ` Use a ${stopLoss}% stop loss and ${takeProfit}% take profit.`;
    if (maxHoldDays < 365) {
      enhanced += ` Hold positions for a maximum of ${maxHoldDays} days.`;
    }

    return enhanced;
  }

  async function handleSubmit() {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    const enhancedPrompt = buildEnhancedPrompt();

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedPrompt, mode: "advanced" }),
      });

      const result = await response.json();

      if (result.type === "strategy") {
        const strategy: StrategyConfig = { ...result.data };

        // Override with visual controls
        const tickers = getSelectedTickers();
        if (tickers.length > 0) strategy.universe = tickers;
        strategy.exit = {
          ...strategy.exit,
          stop_loss_pct: stopLoss,
          take_profit_pct: takeProfit,
          max_hold_days: maxHoldDays,
        };

        // Adjust position sizing by risk level
        if (riskLevel === "conservative") {
          strategy.max_positions = 10;
          strategy.max_position_pct = 15;
        } else if (riskLevel === "aggressive") {
          strategy.max_positions = 3;
          strategy.max_position_pct = 40;
        } else {
          strategy.max_positions = 5;
          strategy.max_position_pct = 25;
        }

        onStrategyReady(strategy, prompt.trim());
      } else if (result.type === "error" || result.error) {
        setError(result.message || result.error);
      } else {
        setError("Could not generate a strategy. Try providing more detail.");
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const Spinner = () => (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
  );

  const riskConfig = {
    conservative: { label: "Conservative", desc: "More positions, less risk each", color: "text-blue-400", border: "border-blue-400/40", bg: "bg-blue-400/10" },
    moderate: { label: "Moderate", desc: "Balanced risk & reward", color: "text-accent", border: "border-accent/40", bg: "bg-accent/10" },
    aggressive: { label: "Aggressive", desc: "Fewer positions, bigger bets", color: "text-loss", border: "border-loss/40", bg: "bg-loss/10" },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-display font-bold mb-1">
          Build Your Strategy
        </h2>
        <p className="text-sm text-gray-500">
          Describe your idea, tune the controls, and hit forge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Main input area */}
        <div>
          {/* Strategy description */}
          <div className="border border-[#222] bg-[#0D0D0D]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
              <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em]">
                Your Trading Idea
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe your strategy in plain English...\n\ne.g. "Buy stocks that dropped a lot recently and sell them when they recover"`}
              className="w-full h-32 bg-transparent p-4 text-[#C0C0BE] placeholder-[#2A2A2A] resize-none focus:outline-none font-mono text-sm leading-relaxed"
              disabled={isLoading}
              autoFocus
            />

            {/* Quick-start chips */}
            <div className="px-4 pb-3 pt-2 border-t border-[#141414]">
              <p className="text-[9px] font-mono text-[#2A2A2A] uppercase tracking-wider mb-2">
                Quick start
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setPrompt(chip.prompt)}
                    disabled={isLoading}
                    className="text-[9px] font-mono text-[#3A3A3A] border border-[#1E1E1E] px-2.5 py-1 hover:border-accent/50 hover:text-accent transition-all uppercase tracking-wider disabled:opacity-30"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk level */}
          <div className="mt-4">
            <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] mb-2">Risk Level</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(riskConfig) as Array<keyof typeof riskConfig>).map((level) => {
                const cfg = riskConfig[level];
                const active = riskLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setRiskLevel(level)}
                    className={`p-3 border text-left transition-all ${
                      active
                        ? `${cfg.border} ${cfg.bg}`
                        : "border-[#1E1E1E] hover:border-[#333]"
                    }`}
                  >
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${active ? cfg.color : "text-[#555]"}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[9px] text-[#444] block mt-0.5">
                      {cfg.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 px-4 py-3 border border-loss/20 bg-loss/5 text-loss text-[11px] font-mono"
              >
                ERROR: {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="btn-shine mt-4 w-full py-4 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.15em] hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Building your strategy...
              </span>
            ) : (
              "Forge Strategy →"
            )}
          </button>
        </div>

        {/* Right: Visual controls sidebar */}
        <div className="space-y-5">
          {/* Sector picker */}
          <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-4">
            <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] mb-3">
              Industries {selectedSectors.length > 0 && (
                <span className="text-accent">({selectedSectors.length})</span>
              )}
            </p>
            <div className="space-y-1.5">
              {Object.entries(SECTORS).map(([sector, { tickers, color }]) => {
                const active = selectedSectors.includes(sector);
                return (
                  <button
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all ${
                      active
                        ? "border border-accent/30 bg-accent/5"
                        : "border border-[#1A1A1A] hover:border-[#2A2A2A]"
                    }`}
                  >
                    <span className={`text-[11px] font-mono uppercase tracking-wider ${active ? color : "text-[#555]"}`}>
                      {sector}
                    </span>
                    <span className="text-[9px] font-mono text-[#333]">
                      {tickers.length} stocks
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedSectors.length === 0 && (
              <p className="text-[9px] text-[#333] mt-2 font-mono">
                None selected = all stocks
              </p>
            )}
          </div>

          {/* Stop Loss slider */}
          <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em]">Stop Loss</p>
              <span className="text-[13px] font-mono font-bold text-loss">{stopLoss}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[8px] font-mono text-[#333]">1%</span>
              <span className="text-[8px] font-mono text-[#333]">25%</span>
            </div>
          </div>

          {/* Take Profit slider */}
          <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em]">Take Profit</p>
              <span className="text-[13px] font-mono font-bold text-profit">{takeProfit}%</span>
            </div>
            <input
              type="range"
              min={2}
              max={100}
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[8px] font-mono text-[#333]">2%</span>
              <span className="text-[8px] font-mono text-[#333]">100%</span>
            </div>
          </div>

          {/* Max Hold Days slider */}
          <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em]">Max Hold</p>
              <span className="text-[13px] font-mono font-bold text-[#C0C0BE]">
                {maxHoldDays >= 365 ? "No limit" : `${maxHoldDays}d`}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={365}
              step={5}
              value={maxHoldDays}
              onChange={(e) => setMaxHoldDays(Number(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[8px] font-mono text-[#333]">5 days</span>
              <span className="text-[8px] font-mono text-[#333]">1 year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
