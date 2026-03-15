"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── Typewriter Terminal Demo ──────────────────────── */

const demoSteps = [
  {
    label: "YOU TYPE",
    text: '"Buy tech stocks when they dip 10% and sell when they bounce back"',
  },
  {
    label: "ALPHARING GENERATES",
    text: "entry: price_change_pct(10) <= -10 AND volume_ratio(20) >= 1.2",
  },
  {
    label: "BACKTEST RESULT",
    text: "+215% return  \u00B7  Sharpe 1.12  \u00B7  Grade: A",
  },
];

const LABEL_STYLES = [
  "text-gray-500",
  "text-accent/60",
  "text-profit/60",
];

const TEXT_STYLES = [
  "text-gray-300",
  "text-accent",
  "text-profit",
];

const TYPING_SPEEDS = [40, 25, 20];

function DemoTerminal() {
  const [lines, setLines] = useState(["", "", ""]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [cursorStep, setCursorStep] = useState(-1);

  // Start typing after mount delay
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentStep(0);
      setCursorStep(0);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Typewriter engine
  useEffect(() => {
    if (currentStep < 0 || currentStep >= demoSteps.length) return;

    const fullText = demoSteps[currentStep].text;
    let i = 0;
    let nextStepTimeout: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      i++;
      setLines((prev) => {
        const next = [...prev];
        next[currentStep] = fullText.slice(0, i);
        return next;
      });

      if (i >= fullText.length) {
        clearInterval(interval);
        setCursorStep(-1);

        if (currentStep < 2) {
          nextStepTimeout = setTimeout(() => {
            setCurrentStep((s) => s + 1);
            setCursorStep(currentStep + 1);
          }, 600);
        }
      }
    }, TYPING_SPEEDS[currentStep]);

    return () => {
      clearInterval(interval);
      clearTimeout(nextStepTimeout);
    };
  }, [currentStep]);

  return (
    <div className="rounded-xl border border-surface-border/50 bg-surface-card/80 backdrop-blur-sm overflow-hidden glow-accent">
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border/30 bg-surface-elevated/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-loss/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-profit/50" />
        </div>
        <span className="text-[10px] font-mono text-gray-600 ml-2 uppercase tracking-[0.2em]">
          alpharing terminal
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-5 sm:p-6 space-y-4">
        {demoSteps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 transition-all duration-500 ${
              currentStep >= i
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <span
              className={`text-[10px] uppercase tracking-[0.15em] w-28 sm:w-36 shrink-0 pt-0.5 font-mono font-medium ${LABEL_STYLES[i]}`}
            >
              {step.label}
            </span>
            <span className={`text-sm font-mono leading-relaxed ${TEXT_STYLES[i]}`}>
              {lines[i]}
              {cursorStep === i && (
                <span className="cursor-blink ml-0.5 text-accent">
                  &#9610;
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Hero Section ──────────────────────────────────── */

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 pt-24 pb-20 grid-bg overflow-hidden">
      {/* Atmospheric radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/[0.035] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 text-center max-w-4xl"
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/20 bg-accent/[0.06] mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
          <span className="text-xs font-mono text-accent/80 tracking-wide">
            STRATEGIES COMPETING NOW
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight">
          Describe a trading strategy.
          <br />
          <span className="text-gradient">Watch it compete.</span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-lg mx-auto leading-relaxed"
        >
          No code. No money. Just your idea vs the world.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/create?mode=guided"
            className="btn-shine w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent to-cyan-300 text-surface font-semibold text-sm hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] transition-all duration-300 text-center"
          >
            Start Building
          </Link>
          <Link
            href="/create?mode=advanced"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-surface-border/80 text-gray-300 font-semibold text-sm hover:border-accent/30 hover:text-white hover:bg-accent/[0.04] transition-all duration-300 text-center"
          >
            I Know What I&apos;m Doing
          </Link>
        </motion.div>
      </motion.div>

      {/* Demo Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.9,
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="relative z-10 mt-16 w-full max-w-2xl"
      >
        <DemoTerminal />
      </motion.div>
    </section>
  );
}
