"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const examples = [
  {
    id: "01",
    label: "DIP BUYER",
    text: "Buy tech stocks when they dip 10% and sell when they bounce back",
    tag: "MOMENTUM",
    returnEstimate: "+215%",
    grade: "A",
  },
  {
    id: "02",
    label: "RSI + MACD",
    text: "Go long when RSI is oversold and MACD crosses bullish",
    tag: "TECHNICAL",
    returnEstimate: "+143%",
    grade: "B+",
  },
  {
    id: "03",
    label: "FULL DEGEN",
    text: "YOLO into whatever dropped the most yesterday, diamond hands for 3 days",
    tag: "HIGH RISK",
    returnEstimate: "+891%",
    grade: "C",
  },
  {
    id: "04",
    label: "BOOMER PICKS",
    text: "Conservative portfolio: buy blue chips when they're below their 200-day average",
    tag: "VALUE",
    returnEstimate: "+87%",
    grade: "D",
  },
];

export default function ExampleStrategies() {
  return (
    <section className="py-20 px-4 border-t border-[#1A1A1A]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em] block mb-3">
              Get Inspired
            </span>
            <h2 className="font-display font-black text-[clamp(1.8rem,4vw,3rem)] uppercase leading-none text-[#F0F0EE] tracking-tight">
              Try an Example
            </h2>
          </div>
          <span className="hidden sm:block text-[10px] font-mono text-[#3A3A3A] uppercase tracking-wider">
            Click to run →
          </span>
        </motion.div>

        {/* Strategy cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1A1A1A]">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <Link
                href={`/create?mode=advanced&prompt=${encodeURIComponent(ex.text)}`}
                className="group block bg-[#080808] hover:bg-[#0D0D0D] p-6 transition-colors h-full"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#2A2A2A]">{ex.id}</span>
                    <span className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em] border-l border-[#1E1E1E] pl-3">
                      {ex.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-[#444] uppercase tracking-wider">run</span>
                    <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>

                {/* Label */}
                <div className="font-display font-black text-xl uppercase tracking-[0.05em] text-[#F0F0EE] group-hover:text-white mb-3 transition-colors">
                  {ex.label}
                </div>

                {/* Quote */}
                <p className="text-[11px] font-mono text-[#555] leading-relaxed group-hover:text-[#777] transition-colors mb-5">
                  &ldquo;{ex.text}&rdquo;
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-[#131313]">
                  <div>
                    <div className="text-[9px] font-mono text-[#333] uppercase tracking-wider mb-0.5">Est. Return</div>
                    <div className="text-sm font-display font-black text-profit">{ex.returnEstimate}</div>
                  </div>
                  <div className="w-px h-6 bg-[#1A1A1A]" />
                  <div>
                    <div className="text-[9px] font-mono text-[#333] uppercase tracking-wider mb-0.5">Grade</div>
                    <div className="text-sm font-display font-black text-accent">{ex.grade}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 flex items-center gap-4"
        >
          <div className="flex-1 h-px bg-[#131313]" />
          <Link
            href="/create?mode=guided"
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#444] hover:text-accent transition-colors"
          >
            Or describe your own strategy →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
