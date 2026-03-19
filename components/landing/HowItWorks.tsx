"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "DESCRIBE",
    description:
      "Type your trading idea in plain English. No formulas, no code. Just say what you'd do.",
    example: '"Buy when RSI dips below 30 and volume is 2x normal"',
  },
  {
    number: "02",
    title: "BACKTEST",
    description:
      "The engine converts your words into an algorithm and runs it against 10 years of real market data in seconds.",
    example: "Runs across 50 stocks · 2,520 trading days · Client-side",
  },
  {
    number: "03",
    title: "COMPETE",
    description:
      "Your result goes on the global leaderboard. Same data for everyone. Ranked by composite score.",
    example: "Sharpe ratio · Max drawdown · Win rate · Return",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 border-t border-[#1A1A1A]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em] block mb-3">
            How It Works
          </span>
          <h2 className="font-display font-black text-[clamp(1.8rem,4vw,3rem)] uppercase leading-none text-[#F0F0EE] tracking-tight">
            Three Steps.<br />Zero Complexity.
          </h2>
        </motion.div>

        {/* Steps — horizontal with connecting lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`relative p-6 md:p-8 border border-[#1A1A1A] ${
                i > 0 ? "md:border-l-0" : ""
              } bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-colors group`}
            >
              {/* Step number */}
              <div className="flex items-start justify-between mb-6">
                <span className="font-display font-black text-[4rem] leading-none text-[#1A1A1A] group-hover:text-[#222] transition-colors">
                  {step.number}
                </span>
                {i < steps.length - 1 && (
                  <div className="hidden md:block text-[#2A2A2A] text-xl mt-2">→</div>
                )}
              </div>

              {/* Accent line */}
              <div className="w-8 h-0.5 bg-accent mb-4" />

              <h3 className="font-display font-black text-xl uppercase tracking-[0.08em] text-[#F0F0EE] mb-3">
                {step.title}
              </h3>
              <p className="text-[11px] font-mono text-[#555] leading-relaxed mb-4">
                {step.description}
              </p>
              <div className="text-[10px] font-mono text-[#3A3A3A] italic">
                {step.example}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
