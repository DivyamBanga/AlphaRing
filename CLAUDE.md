# AlphaRing

**Describe a trading strategy in English. Watch it compete against the world.**

## What This Is

A quant platform where anyone can type a trading strategy in plain English, have it instantly converted into a real algorithm, backtested against historical data, and deployed to a global competitive leaderboard — all with zero code and zero cost.

## Architecture

```
Browser (client-side)
├── Next.js 14 App Router (Vercel, free)
├── Backtesting engine (TypeScript, runs in browser)
├── Historical data (static JSON, 10 years, served from CDN)
│
├── LLM calls → Vercel Serverless API Routes
│   ├── Groq (Llama 3.3 70B, free, primary)
│   ├── Gemini Flash-Lite (free, fallback)
│   └── Client-side fallback (Puter.js)
│
└── Auth + Data → Supabase (free)
    ├── User accounts (Google/GitHub login)
    ├── Strategy configs (JSON)
    ├── Backtest results
    └── Leaderboard (ranked by backtest performance)
```

## Key Design Decisions

- **LLM outputs JSON config, NOT executable Python.** The backtesting engine is a fixed TypeScript function that interprets the JSON. This eliminates sandbox needs, security risks, and server costs. We still *show* code visually for the wow factor — it's a deterministic render of the JSON.
- **Backtesting runs client-side in the browser.** The user's machine does the compute. This scales for free.
- **Historical data is pre-bundled as static JSON.** ~50 stocks, 10 years of daily OHLCV. ~6MB total. Served from Vercel CDN.
- **Everyone backtests against the same fixed 10-year period.** No daily rounds, no cron jobs. Leaderboard is consistent — same data for everyone, rank purely by performance. Simple and fair.
- **LLM cascade: Groq → Gemini → Puter.js.** Never spend money on inference. Fall back gracefully.
- **Two modes:** Guided (step-by-step for beginners) and Advanced (direct input for experienced users).

## Tech Stack

| Layer | Service | Cost |
|-------|---------|------|
| Frontend | Next.js 14 + Tailwind + Framer Motion | $0 |
| Hosting | Vercel Hobby | $0 |
| LLM | Groq free tier + Gemini free tier | $0 |
| Database | Supabase free tier | $0 |
| Market Data | Pre-bundled JSON, 10 years (yfinance) | $0 |
| Charts | Lightweight Charts (TradingView OSS) | $0 |
| Domain | alpharing.vercel.app | $0 |

## Project Structure

```
alpha-ring/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page + strategy input
│   ├── arena/page.tsx            # Global leaderboard
│   ├── strategy/[id]/page.tsx    # Strategy detail + results
│   ├── create/page.tsx           # Strategy creation (guided + advanced)
│   ├── api/
│   │   ├── interpret/route.ts    # LLM proxy: English → JSON config
│   │   ├── deploy/route.ts       # Save strategy to Supabase
│   │   └── leaderboard/route.ts  # Leaderboard queries
│   └── layout.tsx
├── components/
│   ├── landing/                  # Hero, live leaderboard preview, CTA
│   ├── strategy/                 # Input, interpretation display, code animation
│   ├── results/                  # Equity curve, stats, grade, share card
│   ├── arena/                    # Leaderboard table, filters, strategy cards
│   └── ui/                       # Shared UI primitives
├── lib/
│   ├── backtester.ts             # Core backtesting engine
│   ├── indicators.ts             # RSI, SMA, EMA, MACD, Bollinger, ATR, volume
│   ├── llm.ts                    # Groq/Gemini/Puter cascade client
│   ├── strategy-schema.ts        # JSON strategy config type + validation
│   ├── grading.ts                # Letter grade computation (A+ to F)
│   ├── code-renderer.ts          # JSON config → Python-like pseudocode
│   ├── supabase.ts               # Supabase client + queries
│   └── share.ts                  # Shareable result card generation
├── data/
│   └── stocks/                   # Pre-bundled OHLCV JSON files
│       ├── AAPL.json
│       ├── MSFT.json
│       └── ... (50 stocks)
├── scripts/
│   └── download-data.py          # One-time: fetch data via yfinance
├── public/
│   └── og-image.png              # Social sharing image
├── PRD.md                        # Product requirements document
├── CLAUDE.md                     # This file
└── README.md
```

## Conventions

- TypeScript strict mode, no `any`
- Tailwind for all styling, no CSS files
- Server components by default, `"use client"` only when needed
- Framer Motion for animations
- All LLM calls go through the cascade in `lib/llm.ts`
- Strategy JSON schema is the single source of truth — everything flows from it
- Keep components small and focused
- No unnecessary abstractions — simple > clever

## Supported Indicators

The backtesting engine supports these indicators (covers ~90% of retail strategies):

1. Price change % over N days
2. Simple Moving Average (SMA)
3. Exponential Moving Average (EMA)
4. Relative Strength Index (RSI)
5. Volume ratio (vs N-day average)
6. Bollinger Bands (upper, middle, lower)
7. MACD (line, signal, histogram)
8. Average True Range (ATR)

## Strategy JSON Schema

```typescript
interface StrategyConfig {
  name: string;
  description: string;
  entry: {
    conditions: Condition[];
    logic: "AND" | "OR";
  };
  exit: {
    take_profit_pct?: number;
    stop_loss_pct?: number;
    max_hold_days?: number;
    conditions?: Condition[];
  };
  universe: string[];           // ticker symbols
  position_sizing: "equal_weight" | "risk_parity";
  max_positions: number;
  max_position_pct: number;     // max % of portfolio per position
}

interface Condition {
  indicator: string;
  period?: number;
  operator: ">=" | "<=" | ">" | "<" | "crosses_above" | "crosses_below";
  value: number | string;
  compare_to?: string;          // e.g., "sma_50" for crossover conditions
}
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Lint check
python scripts/download-data.py   # Download stock data
```
