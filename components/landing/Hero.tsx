"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-20 pb-16 grid-bg overflow-hidden">
      {/* Radial glow behind headline */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-3xl"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          Describe a trading strategy in English.{" "}
          <span className="text-accent">
            Watch it compete against the world.
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 text-lg sm:text-xl text-gray-400 max-w-xl mx-auto"
        >
          No code. No money. Just your idea vs theirs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/create?mode=guided"
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-accent text-surface font-semibold text-sm hover:bg-accent-light transition-colors text-center"
          >
            Guide Me
          </Link>
          <Link
            href="/create?mode=advanced"
            className="w-full sm:w-auto px-8 py-3 rounded-lg border border-surface-border text-gray-300 font-semibold text-sm hover:border-gray-500 hover:text-white transition-colors text-center"
          >
            I Know What I&apos;m Doing
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated demo preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="relative z-10 mt-12 w-full max-w-2xl"
      >
        <div className="rounded-xl border border-surface-border bg-surface-card/80 backdrop-blur-sm p-5 glow-accent">
          <DemoAnimation />
        </div>
      </motion.div>
    </section>
  );
}

function DemoAnimation() {
  const steps = [
    {
      label: "You type",
      text: '"Buy tech stocks when they dip 10% and sell when they bounce back"',
      color: "text-gray-300",
    },
    {
      label: "AlphaRing generates",
      text: "entry: price_change_pct(10) <= -10 AND volume_ratio(20) >= 1.2",
      color: "text-accent",
    },
    {
      label: "Backtest result",
      text: "+215% return | Sharpe 1.12 | Grade: A",
      color: "text-profit",
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 + i * 0.4, duration: 0.4 }}
          className="flex items-start gap-3"
        >
          <span className="text-[10px] uppercase tracking-wider text-gray-500 w-28 shrink-0 pt-1">
            {step.label}
          </span>
          <span className={`text-sm font-mono ${step.color}`}>
            {step.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
