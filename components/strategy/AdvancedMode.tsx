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
      {/* Terminal input */}
      <div className="border border-[#222] bg-[#0D0D0D]">
        {/* Terminal chrome */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF3D3D]/50" />
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]/50" />
              <div className="w-2 h-2 rounded-full bg-[#00E57A]/50" />
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#333] uppercase tracking-[0.3em]">
            strategy.input
          </span>
          <div className="w-14" />
        </div>

        {/* Prompt line */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-accent shrink-0">$</span>
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-wider">describe</span>
        </div>

        {/* Textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`"Buy tech stocks when they dip 10% with high volume,\nsell at 8% profit or 4% stop loss"`}
          className="w-full h-36 bg-transparent px-4 pb-4 pt-1 text-[#C0C0BE] placeholder-[#2A2A2A] resize-none focus:outline-none font-mono text-sm leading-relaxed"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />

        {/* Char count */}
        <div className="px-4 pb-2 flex items-center justify-end gap-4 border-t border-[#111]">
          <span className="text-[9px] font-mono text-[#2A2A2A]">
            {prompt.length} chars
          </span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#131313] border border-[#222] text-[#333] font-mono text-[9px]">⌘</kbd>
            <span className="text-[9px] font-mono text-[#2A2A2A]">+</span>
            <kbd className="px-1.5 py-0.5 bg-[#131313] border border-[#222] text-[#333] font-mono text-[9px]">↵</kbd>
            <span className="text-[9px] font-mono text-[#2A2A2A] ml-1">to run</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 px-4 py-3 border border-loss/20 bg-loss/5 text-loss text-[11px] font-mono"
          >
            ERROR: {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parameters toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowParams(!showParams)}
          className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#888] transition-colors uppercase tracking-[0.15em]"
        >
          <span className="text-accent">{showParams ? "−" : "+"}</span>
          Advanced Parameters
          {selectedTickers.length > 0 && (
            <span className="text-accent ml-1">({selectedTickers.length} tickers)</span>
          )}
        </button>

        <AnimatePresence>
          {showParams && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 border border-[#1A1A1A] bg-[#0A0A0A] space-y-4">
                {/* Ticker picker */}
                <div>
                  <label className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] block mb-2">
                    Stock Universe {selectedTickers.length > 0 && <span className="text-accent">({selectedTickers.length} selected)</span>}
                  </label>
                  {Object.entries(TICKERS_BY_SECTOR).map(([sector, tickers]) => (
                    <div key={sector} className="mb-3">
                      <span className="text-[9px] font-mono text-[#333] uppercase tracking-wider block mb-1">
                        {sector}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tickers.map((ticker) => (
                          <button
                            key={ticker}
                            onClick={() => toggleTicker(ticker)}
                            className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                              selectedTickers.includes(ticker)
                                ? "bg-accent text-[#080808] font-bold"
                                : "border border-[#1E1E1E] text-[#444] hover:text-[#888] hover:border-[#333]"
                            }`}
                          >
                            {ticker}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Position controls */}
                <div className="flex gap-6 pt-2 border-t border-[#131313]">
                  <div>
                    <label className="text-[9px] font-mono text-[#444] uppercase tracking-wider block mb-1">
                      Max Positions
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxPositions}
                      onChange={(e) => setMaxPositions(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-[#0D0D0D] border border-[#1E1E1E] text-[11px] font-mono text-[#C0C0BE] focus:outline-none focus:border-accent/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[#444] uppercase tracking-wider block mb-1">
                      Max Position %
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxPositionPct}
                      onChange={(e) => setMaxPositionPct(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-[#0D0D0D] border border-[#1E1E1E] text-[11px] font-mono text-[#C0C0BE] focus:outline-none focus:border-accent/30"
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
        whileTap={{ scale: 0.99 }}
        className="btn-shine mt-4 w-full py-4 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.15em] hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Interpreting...
          </span>
        ) : (
          "Forge Strategy →"
        )}
      </motion.button>
    </div>
  );
}
