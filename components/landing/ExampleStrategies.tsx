"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const examples = [
  {
    label: "Dip Buyer",
    text: "Buy tech stocks when they dip 10% and sell when they bounce back",
    tag: "Momentum",
    tagColor: "text-cyan-400 border-cyan-400/20 bg-cyan-400/[0.06]",
  },
  {
    label: "RSI + MACD",
    text: "Go long when RSI is oversold and MACD crosses bullish",
    tag: "Technical",
    tagColor: "text-violet-400 border-violet-400/20 bg-violet-400/[0.06]",
  },
  {
    label: "Full Degen",
    text: "YOLO into whatever dropped the most yesterday, diamond hands for 3 days",
    tag: "High Risk",
    tagColor: "text-rose-400 border-rose-400/20 bg-rose-400/[0.06]",
  },
  {
    label: "Conservative",
    text: "Conservative portfolio: buy blue chips when they're below their 200-day average",
    tag: "Value",
    tagColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]",
  },
];

export default function ExampleStrategies() {
  return (
    <section className="py-24 px-4 relative">
      {/* Section top gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-border/60 to-transparent" />

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="text-xs font-mono text-accent/60 uppercase tracking-[0.2em] mb-3 block">
            GET INSPIRED
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Try an Example
          </h2>
          <p className="text-sm text-gray-500">
            Click any strategy to see it in action
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <Link
                href={`/create?mode=advanced&prompt=${encodeURIComponent(
                  ex.text
                )}`}
                className="group block rounded-xl border border-surface-border/50 bg-surface-card p-5 hover:border-accent/20 hover:bg-surface-elevated/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono font-medium text-accent/80 group-hover:text-accent transition-colors">
                    {ex.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${ex.tagColor}`}
                  >
                    {ex.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">
                  &ldquo;{ex.text}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-accent/0 group-hover:text-accent/60 transition-all font-mono">
                  Try this strategy
                  <svg
                    className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
