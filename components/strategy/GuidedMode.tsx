"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategyConfig } from "@/lib/strategy-schema";

interface GuidedModeProps {
  initialPrompt: string;
  onStrategyReady: (strategy: StrategyConfig, prompt?: string) => void;
}

type Step = 1 | 2 | 3;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export default function GuidedMode({
  initialPrompt,
  onStrategyReady,
}: GuidedModeProps) {
  const [step, setStep] = useState<Step>(1);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [partialUnderstanding, setPartialUnderstanding] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);

  // Step 3 state
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);

  async function handleStep1Submit() {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), mode: "guided" }),
      });

      const result = await response.json();

      if (result.type === "guided") {
        setQuestions(result.data.questions);
        setPartialUnderstanding(result.data.partial_understanding);
        setAnswers(new Array(result.data.questions.length).fill(""));
        setConversationHistory([
          { role: "user", content: prompt.trim() },
          { role: "assistant", content: JSON.stringify(result.data) },
        ]);
        setStep(2);
      } else if (result.type === "strategy") {
        setStrategy(result.data);
        setStep(3);
      } else if (result.type === "error" || result.error) {
        setError(result.message || result.error);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStep2Submit() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const answersText = questions
      .map((q, i) => `${q}\nAnswer: ${answers[i] || "No preference"}`)
      .join("\n\n");

    const newHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: "user", content: answersText },
    ];

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: answersText,
          mode: "guided",
          conversationHistory: newHistory,
        }),
      });

      const result = await response.json();

      if (result.type === "strategy") {
        setStrategy(result.data);
        setStep(3);
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

  function handleBack() {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                s === step
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : s < step
                    ? "bg-profit/20 text-profit border border-profit/40"
                    : "bg-surface-elevated text-gray-600 border border-surface-border/30"
              }`}
            >
              {s < step ? "\u2713" : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-px ${s < step ? "bg-profit/40" : "bg-surface-border/30"}`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Describe your idea */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-display font-bold mb-2">
              What&apos;s your trading idea?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Don&apos;t worry about being precise — I&apos;ll help you refine
              it.
            </p>

            <div className="border border-[#222] bg-[#0D0D0D]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Tell me your trading idea in plain English...\n\ne.g. "I want to buy stocks that dropped a lot and sell them when they recover"`}
                className="w-full h-36 bg-transparent p-5 text-[#C0C0BE] placeholder-[#2A2A2A] resize-none focus:outline-none font-mono text-sm leading-relaxed"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-loss/10 border border-loss/20 text-loss text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStep1Submit}
              disabled={!prompt.trim() || isLoading}
              className="btn-shine mt-6 w-full py-4 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Understanding your idea...
                </span>
              ) : (
                "Next"
              )}
            </button>
          </motion.div>
        )}

        {/* Step 2: Answer questions */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-display font-bold mb-2">
              Let me understand better
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {partialUnderstanding ||
                "I have a few questions to build the best strategy for you."}
            </p>

            <div className="space-y-4">
              {questions.map((question, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-surface-card border border-surface-border/50"
                >
                  <p className="text-sm text-gray-300 mb-3">{question}</p>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[i] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-surface-elevated border border-surface-border/30 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/30"
                    disabled={isLoading}
                  />
                </motion.div>
              ))}
            </div>

            {error && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-loss/10 border border-loss/20 text-loss text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl border border-surface-border/80 text-gray-400 text-sm hover:text-white hover:border-accent/30 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleStep2Submit}
                disabled={isLoading}
                className="btn-shine flex-1 py-3 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors disabled:opacity-30"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Building your strategy...
                  </span>
                ) : (
                  "Generate Strategy"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm strategy */}
        {step === 3 && strategy && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-display font-bold mb-2">
              Your strategy is ready
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Review the details below, then forge it to see how it performs.
            </p>

            <div className="rounded-xl border border-surface-border/50 bg-surface-card overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border/30 bg-surface-elevated/30">
                <span className="text-[10px] font-mono text-accent/60 uppercase tracking-[0.15em]">
                  Strategy Config
                </span>
              </div>
              <div className="p-5 space-y-3 font-mono text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-20 shrink-0">NAME</span>
                  <span className="text-white">{strategy.name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-20 shrink-0">ENTRY</span>
                  <span className="text-accent">
                    {strategy.entry.conditions
                      .map(
                        (c) =>
                          `${c.indicator}(${c.period ?? 14}) ${c.operator} ${c.compare_to || c.value}`
                      )
                      .join(` ${strategy.entry.logic} `)}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-20 shrink-0">EXIT</span>
                  <span className="text-gray-300">
                    {[
                      strategy.exit.take_profit_pct &&
                        `+${strategy.exit.take_profit_pct}% TP`,
                      strategy.exit.stop_loss_pct &&
                        `-${strategy.exit.stop_loss_pct}% SL`,
                      strategy.exit.max_hold_days &&
                        `${strategy.exit.max_hold_days}d max`,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "No fixed exit rules"}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-20 shrink-0">ASSETS</span>
                  <span className="text-gray-300">
                    {strategy.universe.join(", ")}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-20 shrink-0">SIZING</span>
                  <span className="text-gray-300">
                    {strategy.position_sizing}, max {strategy.max_positions} @{" "}
                    {strategy.max_position_pct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl border border-surface-border/80 text-gray-400 text-sm hover:text-white hover:border-accent/30 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => onStrategyReady(strategy, prompt.trim())}
                className="btn-shine flex-1 py-3 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors"
              >
                Forge It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
