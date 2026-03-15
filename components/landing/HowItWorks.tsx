"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Describe",
    description:
      "Type your trading strategy in plain English. No code, no formulas — just your idea.",
    accent: "from-accent/20 to-accent/0",
  },
  {
    number: "02",
    title: "Backtest",
    description:
      "Your strategy runs against 10 years of real market data. See the results in seconds.",
    accent: "from-cyan-400/20 to-cyan-400/0",
  },
  {
    number: "03",
    title: "Compete",
    description:
      "Deploy to the global leaderboard. See how your idea ranks against everyone else's.",
    accent: "from-emerald-400/20 to-emerald-400/0",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-accent/60 uppercase tracking-[0.2em] mb-3 block">
            HOW IT WORKS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Three steps. Zero complexity.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="group relative rounded-xl border border-surface-border/60 bg-surface-card p-6 hover:border-accent/20 transition-all duration-300"
            >
              {/* Gradient top edge */}
              <div
                className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${step.accent}`}
              />

              {/* Step number */}
              <span className="text-3xl font-mono font-bold text-accent/15 group-hover:text-accent/25 transition-colors">
                {step.number}
              </span>

              <h3 className="font-display text-xl font-semibold mt-3 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
