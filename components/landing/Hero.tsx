"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── Ticker bar data ─────────────────────────────── */
const tickerItems = [
  { label: "AAPL", value: "+12.4%", up: true },
  { label: "TSLA", value: "-3.2%", up: false },
  { label: "NVDA", value: "+28.7%", up: true },
  { label: "SPY", value: "+9.1%", up: true },
  { label: "QQQ", value: "+14.3%", up: true },
  { label: "MSFT", value: "+18.9%", up: true },
  { label: "AMZN", value: "+7.6%", up: true },
  { label: "GOOG", value: "-1.8%", up: false },
  { label: "META", value: "+22.1%", up: true },
  { label: "BRK.B", value: "+5.4%", up: true },
];

/* ── Terminal demo ────────────────────────────────── */
const demoSteps = [
  {
    prompt: "$ strategy.describe",
    text: '"Buy tech stocks when they dip 10% and volume spikes"',
    color: "#F0F0EE",
  },
  {
    prompt: "$ algorithm.compile",
    text: "price_change_pct(10) <= -10 AND volume_ratio(20) >= 1.2",
    color: "#C5FF00",
  },
  {
    prompt: "$ backtest.run --years=10",
    text: "RETURN: +215.4%  |  SHARPE: 1.12  |  GRADE: A",
    color: "#00E57A",
  },
];

const TYPING_SPEEDS = [28, 18, 14];

function DemoTerminal() {
  const [lines, setLines] = useState(["", "", ""]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [cursorStep, setCursorStep] = useState(-1);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentStep(0);
      setCursorStep(0);
    }, 800);
    return () => clearTimeout(t);
  }, []);

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
        if (currentStep < demoSteps.length - 1) {
          nextStepTimeout = setTimeout(() => {
            setCurrentStep((s) => s + 1);
            setCursorStep(currentStep + 1);
          }, 500);
        }
      }
    }, TYPING_SPEEDS[currentStep]);

    return () => {
      clearInterval(interval);
      clearTimeout(nextStepTimeout);
    };
  }, [currentStep]);

  return (
    <div className="border border-[#222] bg-[#0D0D0D] overflow-hidden">
      {/* Terminal chrome */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF3D3D]/60" />
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]/60" />
          <div className="w-2 h-2 rounded-full bg-[#00E57A]/60" />
        </div>
        <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em]">
          ALPHARING TERMINAL v2.0
        </span>
        <div className="w-12" />
      </div>

      {/* Terminal body */}
      <div className="p-5 space-y-5 min-h-[200px]">
        {demoSteps.map((step, i) => (
          <div
            key={i}
            className={`transition-all duration-300 ${
              currentStep >= i ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-[10px] text-[#444] mb-1 font-mono uppercase tracking-wider">
              {step.prompt}
            </div>
            <div
              className="text-sm font-mono leading-relaxed"
              style={{ color: step.color }}
            >
              {lines[i]}
              {cursorStep === i && (
                <span className="cursor-blink ml-0.5 text-accent">█</span>
              )}
            </div>
          </div>
        ))}
        {currentStep >= 2 && lines[2].length >= demoSteps[2].text.length && (
          <div className="pt-2 border-t border-[#1A1A1A]">
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">
              $ arena.deploy --submit
            </div>
            <div className="text-xs font-mono text-accent mt-1">
              ✓ Strategy submitted to global leaderboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hero Section ────────────────────────────────── */
export default function Hero() {
  return (
    <section className="relative grid-bg overflow-hidden">
      {/* Ticker bar */}
      <div className="border-b border-[#1A1A1A] bg-[#0A0A0A] overflow-hidden h-8 flex items-center">
        <div className="shrink-0 px-4 border-r border-[#1A1A1A] h-full flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
            <span className="text-[9px] font-mono text-accent uppercase tracking-[0.3em]">LIVE</span>
          </div>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex gap-8 px-6">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="text-[10px] font-mono shrink-0 flex items-center gap-2">
                <span className="text-[#555]">{item.label}</span>
                <span className={item.up ? "text-profit" : "text-loss"}>{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main hero content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[75vh]">
          {/* Left: Headline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-accent live-dot" />
              <span className="text-[10px] font-mono text-[#555] uppercase tracking-[0.3em]">
                Open Arena — Compete Now
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-display font-black uppercase leading-[0.88] tracking-tight">
              <span
                className="block text-[clamp(3.5rem,8vw,6.5rem)] text-[#F0F0EE]"
              >
                DESCRIBE
              </span>
              <span
                className="block text-[clamp(3.5rem,8vw,6.5rem)] text-[#F0F0EE]"
              >
                A TRADE.
              </span>
              <span
                className="block text-[clamp(3.5rem,8vw,6.5rem)]"
                style={{ color: "var(--accent)" }}
              >
                WATCH IT
              </span>
              <span
                className="block text-[clamp(3.5rem,8vw,6.5rem)]"
                style={{ color: "var(--accent)" }}
              >
                FIGHT.
              </span>
            </h1>

            {/* Horizontal rule */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#1E1E1E]" />
              <div className="w-1 h-1 bg-accent" />
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-[#555] uppercase tracking-[0.15em] leading-relaxed max-w-sm">
              Type plain English → Algorithm generated → Backtested on 10yrs of real data → Ranked globally
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/create?mode=guided"
                className="btn-shine inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-[#080808] font-display font-black text-sm uppercase tracking-[0.1em] hover:bg-accent-light transition-colors"
              >
                Enter the Arena
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/arena"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#333] text-[#888] font-mono text-[10px] uppercase tracking-[0.15em] hover:border-accent/40 hover:text-[#F0F0EE] transition-all"
              >
                View Leaderboard
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-12 flex items-center gap-6 pt-6 border-t border-[#1A1A1A]">
              {[
                { value: "10", label: "Years of data" },
                { value: "50+", label: "Stocks covered" },
                { value: "$0", label: "Cost forever" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display font-black text-xl text-[#F0F0EE] leading-none">{stat.value}</div>
                  <div className="text-[9px] text-[#444] uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Terminal label */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-mono text-[#444] uppercase tracking-[0.3em]">
                LIVE DEMO
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-accent live-dot" />
                <span className="text-[9px] font-mono text-[#444]">running</span>
              </div>
            </div>
            <DemoTerminal />

            {/* Subtle note */}
            <p className="mt-3 text-[9px] font-mono text-[#3A3A3A] uppercase tracking-wider text-right">
              No signup required to try it
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(197,255,0,0.15), transparent)" }} />
    </section>
  );
}
