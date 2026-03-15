"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const examples = [
  {
    label: "Dip Buyer",
    text: "Buy tech stocks when they dip 10% and sell when they bounce back",
    tag: "Momentum",
  },
  {
    label: "RSI + MACD",
    text: "Go long when RSI is oversold and MACD crosses bullish",
    tag: "Technical",
  },
  {
    label: "Full Degen",
    text: "YOLO into whatever dropped the most yesterday, diamond hands for 3 days",
    tag: "High Risk",
  },
  {
    label: "Conservative",
    text: "Conservative portfolio: buy blue chips when they're below their 200-day average",
    tag: "Value",
  },
];

export default function ExampleStrategies() {
  return (
    <section className="py-16 px-4 border-t border-surface-border/50">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">Try an Example</h2>
          <p className="text-sm text-gray-500">
            Click any strategy to see it in action
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <Link
                href={`/create?mode=advanced&prompt=${encodeURIComponent(ex.text)}`}
                className="block rounded-xl border border-surface-border bg-surface-card p-4 hover:border-accent/30 hover:bg-surface-elevated/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-accent">
                    {ex.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-600 px-2 py-0.5 rounded-full border border-surface-border">
                    {ex.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  &ldquo;{ex.text}&rdquo;
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
