"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { StrategyConfig } from "@/lib/strategy-schema";
import type { BacktestResult } from "@/lib/backtester";
import type { Grade } from "@/lib/grading";
import GuidedMode from "@/components/strategy/GuidedMode";
import AdvancedMode from "@/components/strategy/AdvancedMode";

// Code-split heavy components — backtesting engine + charts are only loaded
// when the user actually triggers the forge/results phases, never on landing.
const ForgeSequence = dynamic(
  () => import("@/components/strategy/ForgeSequence"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-3xl mx-auto text-center py-20 animate-pulse">
        <div className="h-6 w-48 bg-surface-elevated rounded mx-auto mb-6" />
        <div className="h-48 bg-surface-elevated/50 rounded-xl" />
      </div>
    ),
  }
);

const ResultsDisplay = dynamic(
  () => import("@/components/results/ResultsDisplay"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-3xl mx-auto animate-pulse space-y-6 py-8">
        <div className="w-28 h-28 bg-surface-elevated rounded-2xl mx-auto" />
        <div className="h-48 bg-surface-elevated/50 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-elevated/40 rounded-xl" />
          ))}
        </div>
      </div>
    ),
  }
);

type Phase = "input" | "forge" | "results";

function CreateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode =
    (searchParams.get("mode") as "guided" | "advanced") || "advanced";
  const prefillPrompt = searchParams.get("prompt") || "";

  const [phase, setPhase] = useState<Phase>("input");
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);
  const [englishPrompt, setEnglishPrompt] = useState("");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);

  const handleStrategyReady = useCallback(
    (strat: StrategyConfig, prompt?: string) => {
      setStrategy(strat);
      if (prompt) setEnglishPrompt(prompt);
      setPhase("forge");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const handleForgeComplete = useCallback(
    (res: BacktestResult, gr: Grade) => {
      setResult(res);
      setGrade(gr);
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const handleEdit = useCallback(() => {
    setPhase("input");
    setResult(null);
    setGrade(null);
  }, []);

  const handleTryAnother = useCallback(() => {
    setPhase("input");
    setStrategy(null);
    setEnglishPrompt("");
    setResult(null);
    setGrade(null);
    router.push(`/create?mode=${mode}`);
  }, [mode, router]);

  return (
    <div className="min-h-[85vh] px-4 py-12 sm:py-16">
      {/* Mode toggle (only in input phase) */}
      {phase === "input" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-surface-card border border-surface-border/50 rounded-lg p-1">
            <button
              onClick={() => router.push("/create?mode=guided")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "guided"
                  ? "bg-accent/15 text-accent"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Guided
            </button>
            <button
              onClick={() => router.push("/create?mode=advanced")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "advanced"
                  ? "bg-accent/15 text-accent"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Advanced
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Input Phase */}
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === "guided" ? (
              <GuidedMode
                initialPrompt={prefillPrompt}
                onStrategyReady={handleStrategyReady}
              />
            ) : (
              <AdvancedMode
                initialPrompt={prefillPrompt}
                onStrategyReady={handleStrategyReady}
              />
            )}
          </motion.div>
        )}

        {/* Forge Phase */}
        {phase === "forge" && strategy && (
          <motion.div
            key="forge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ForgeSequence
              strategy={strategy}
              onComplete={handleForgeComplete}
              onEdit={handleEdit}
            />
          </motion.div>
        )}

        {/* Results Phase */}
        {phase === "results" && strategy && result && grade && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResultsDisplay
              strategy={strategy}
              result={result}
              grade={grade}
              englishPrompt={englishPrompt}
              onEdit={handleEdit}
              onTryAnother={handleTryAnother}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] px-4 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto animate-pulse">
            <div className="h-8 w-64 bg-surface-elevated rounded mx-auto mb-8" />
            <div className="h-36 bg-surface-elevated/60 rounded mb-4" />
            <div className="h-12 bg-surface-elevated/40 rounded" />
          </div>
        </div>
      }
    >
      <CreateContent />
    </Suspense>
  );
}
