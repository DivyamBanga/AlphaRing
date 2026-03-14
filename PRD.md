# AlphaRing — Product Requirements Document

> Describe a trading strategy in English. Watch it compete against the world.

---

## Vision

AlphaRing is the first platform that combines zero-code strategy creation (plain English), real algorithmic backtesting, and a competitive social leaderboard. Nothing like this exists. The barrier to entry is zero — anyone can try it in under 60 seconds — and the competitive leaderboard keeps them coming back.

Every strategy is backtested against the same fixed 10-year historical period. Same data, same conditions, best idea wins. No daily rounds, no randomness — pure apples-to-apples comparison.

---

## Core User Journey

```
Land on site → See leaderboard → Type a strategy → Watch it get interpreted →
Watch code generate → See backtest results (10 years of data) → Get a grade →
Deploy to leaderboard → See your rank → Study top strategies → Iterate → Repeat
```

---

## Phase 1: Foundation

### Task 1.1 — Project Setup

- [ ] **1.1.1** Initialize Next.js 14 project with App Router, TypeScript strict mode
- [ ] **1.1.2** Install and configure Tailwind CSS
- [ ] **1.1.3** Install Framer Motion for animations
- [ ] **1.1.4** Install Lightweight Charts (TradingView OSS) for equity curves
- [ ] **1.1.5** Set up project folder structure (`app/`, `components/`, `lib/`, `data/`, `scripts/`)
- [ ] **1.1.6** Set up ESLint + Prettier config
- [ ] **1.1.7** Create `.env.local` template with placeholder keys (Groq, Supabase)
- [ ] **1.1.8** Add `.gitignore` for Next.js + `.env` files

### Task 1.2 — Historical Market Data

- [ ] **1.2.1** Write Python script (`scripts/download-data.py`) to fetch 10 years of daily OHLCV data using `yfinance`
- [ ] **1.2.2** Select the stock universe: top 50 most traded US stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, etc.)
- [ ] **1.2.3** Output data as individual JSON files per ticker in `data/stocks/` (format: `[{date, open, high, low, close, volume}, ...]`)
- [ ] **1.2.4** Verify total data size is reasonable (~6MB for 50 stocks x 10 years)
- [ ] **1.2.5** Create a `data/tickers.json` manifest listing all available tickers with metadata (name, sector)
- [ ] **1.2.6** Add a utility function `lib/data.ts` to lazy-load stock data on demand in the browser
- [ ] **1.2.7** Also download and bundle S&P 500 (SPY) data as the benchmark for all backtests

### Task 1.3 — Strategy JSON Schema

- [ ] **1.3.1** Define the `StrategyConfig` TypeScript interface in `lib/strategy-schema.ts`
- [ ] **1.3.2** Define the `Condition` interface for entry/exit conditions
- [ ] **1.3.3** Define supported indicator enum/types: `price_change_pct`, `sma`, `ema`, `rsi`, `volume_ratio`, `bollinger_upper`, `bollinger_lower`, `macd_line`, `macd_signal`, `macd_histogram`, `atr`
- [ ] **1.3.4** Define supported operators: `>=`, `<=`, `>`, `<`, `crosses_above`, `crosses_below`
- [ ] **1.3.5** Write a `validateStrategy(config)` function that checks for valid tickers, sensible parameter ranges, and required fields
- [ ] **1.3.6** Write 5+ example strategy configs as test fixtures covering different strategy types (momentum, mean reversion, trend following, breakout, dip buying)

---

## Phase 2: Backtesting Engine (Client-Side)

### Task 2.1 — Technical Indicators

- [ ] **2.1.1** Implement `sma(prices, period)` — Simple Moving Average
- [ ] **2.1.2** Implement `ema(prices, period)` — Exponential Moving Average
- [ ] **2.1.3** Implement `rsi(prices, period)` — Relative Strength Index
- [ ] **2.1.4** Implement `macd(prices, fastPeriod, slowPeriod, signalPeriod)` — returns line, signal, histogram
- [ ] **2.1.5** Implement `bollingerBands(prices, period, stdDev)` — returns upper, middle, lower
- [ ] **2.1.6** Implement `atr(highs, lows, closes, period)` — Average True Range
- [ ] **2.1.7** Implement `volumeRatio(volumes, period)` — current volume vs N-day average
- [ ] **2.1.8** Implement `priceChangePct(prices, period)` — % change over N days
- [ ] **2.1.9** Write unit tests for all indicators against known correct values

### Task 2.2 — Backtesting Engine Core

- [ ] **2.2.1** Create `lib/backtester.ts` with main function signature: `backtest(config: StrategyConfig, data: StockData[]) → BacktestResult`
- [ ] **2.2.2** Implement the day-by-day simulation loop: iterate through each trading day, evaluate conditions, manage positions
- [ ] **2.2.3** Implement entry logic: evaluate entry conditions (AND/OR), check position limits, compute position size
- [ ] **2.2.4** Implement exit logic: check take-profit, stop-loss, max hold days, and custom exit conditions
- [ ] **2.2.5** Implement portfolio tracking: cash balance, open positions, portfolio value over time
- [ ] **2.2.6** Implement the `crosses_above` and `crosses_below` operators (requires comparing current and previous indicator values)
- [ ] **2.2.7** Compute result metrics: total return %, annualized return, Sharpe ratio, max drawdown, win rate, total trades, average trade duration
- [ ] **2.2.8** Generate equity curve data: `[{date, portfolioValue, benchmarkValue}, ...]`
- [ ] **2.2.9** Generate trade log: `[{ticker, entryDate, entryPrice, exitDate, exitPrice, returnPct, holdDays, exitReason}, ...]`
- [ ] **2.2.10** Test against example strategy configs — verify results are sensible

### Task 2.3 — Grading System

- [ ] **2.3.1** Create `lib/grading.ts` with function `gradeStrategy(result: BacktestResult) → Grade`
- [ ] **2.3.2** Define grading criteria based on weighted composite score:
  - Total return vs benchmark (40%)
  - Sharpe ratio (30%)
  - Max drawdown penalty (20%)
  - Win rate bonus (10%)
- [ ] **2.3.3** Map composite scores to letter grades: A+ (90+), A (80-89), B+ (70-79), B (60-69), C (50-59), D (40-49), F (<40)
- [ ] **2.3.4** Return grade with color coding (green for A range, yellow for B, orange for C, red for D/F)

---

## Phase 3: LLM Interpretation Layer

### Task 3.1 — LLM Cascade Client

- [ ] **3.1.1** Create `lib/llm.ts` with the cascade logic: try Groq → try Gemini → fallback error message
- [ ] **3.1.2** Write the Groq API integration (Llama 3.3 70B model, `/api/interpret` proxy route)
- [ ] **3.1.3** Write the Gemini Flash-Lite API integration (as fallback)
- [ ] **3.1.4** Implement retry logic: if provider returns 429 (rate limited), try next provider
- [ ] **3.1.5** Implement response validation: ensure the LLM output parses as valid JSON matching the strategy schema
- [ ] **3.1.6** If JSON is invalid, retry once with a correction prompt ("Your output wasn't valid JSON. Here's the error: ...")

### Task 3.2 — System Prompt Engineering

- [ ] **3.2.1** Write the core system prompt for strategy interpretation:
  - Explain the JSON schema in detail
  - List all supported indicators and operators
  - List all available tickers
  - Provide 5+ few-shot examples (English → JSON)
  - Instruct the model to ask for clarification ONLY if truly ambiguous (default to sensible assumptions)
- [ ] **3.2.2** Write a "guided mode" system prompt that generates follow-up questions for beginners:
  - "What stocks or sectors are you interested in?"
  - "How much risk are you comfortable with? (conservative / moderate / aggressive)"
  - "When should the algorithm buy? What signal or event?"
  - "When should it sell? Profit target? Stop loss? Time limit?"
- [ ] **3.2.3** Test with 20+ diverse natural language inputs and verify JSON output quality
- [ ] **3.2.4** Handle edge cases: nonsensical input, non-trading requests, overly vague strategies

### Task 3.3 — API Routes

- [ ] **3.3.1** Create `app/api/interpret/route.ts` — accepts English text + mode (guided/advanced), proxies to LLM, returns JSON strategy config
- [ ] **3.3.2** Create `app/api/deploy/route.ts` — accepts strategy config + backtest results, saves to Supabase, returns strategy ID
- [ ] **3.3.3** Create `app/api/leaderboard/route.ts` — queries Supabase for top strategies, supports pagination and filters
- [ ] **3.3.4** Add rate limiting middleware (simple in-memory counter per IP, prevent abuse of LLM endpoints)

### Task 3.4 — Code Renderer (Visual Only)

- [ ] **3.4.1** Create `lib/code-renderer.ts` that takes a `StrategyConfig` JSON and renders it as Python-like pseudocode
- [ ] **3.4.2** Make the output look like real backtesting code (imports, class definition, entry/exit methods, position sizing)
- [ ] **3.4.3** The code is purely visual — it's a deterministic template filled with values from the JSON config
- [ ] **3.4.4** Include comments in the generated pseudocode that explain each section in plain English

---

## Phase 4: Frontend — Landing Page

### Task 4.1 — Layout & Navigation

- [ ] **4.1.1** Create `app/layout.tsx` with global nav bar: logo (AlphaRing), "Arena" link, "Create" link, auth button
- [ ] **4.1.2** Style nav: clean, minimal, dark theme with accent color (electric blue or green — something that pops)
- [ ] **4.1.3** Mobile responsive nav (hamburger menu on small screens)
- [ ] **4.1.4** Footer: "Not financial advice" disclaimer, GitHub link, made by DivCodes

### Task 4.2 — Hero Section

- [ ] **4.2.1** Big headline: "Describe a trading strategy in English. Watch it compete against the world."
- [ ] **4.2.2** Subtitle: "No code. No money. Just your idea vs theirs."
- [ ] **4.2.3** Two CTA buttons side by side:
  - "Guide Me" (routes to guided mode) — for beginners
  - "I Know What I'm Doing" (routes to advanced mode) — for experienced users
- [ ] **4.2.4** Below CTAs: a small animated demo/preview showing the strategy → algorithm → results flow (can be a looping animation or a short auto-playing sequence)
- [ ] **4.2.5** Subtle background animation (floating grid lines, gentle particle effect, or a low-opacity equity curve animation)

### Task 4.3 — Live Leaderboard Preview

- [ ] **4.3.1** Below the hero: a compact leaderboard showing the top 10 strategies
- [ ] **4.3.2** Each row shows: rank, strategy name, creator, return % (10yr), Sharpe, grade badge
- [ ] **4.3.3** Subtle entrance animation (rows fade/slide in)
- [ ] **4.3.4** "See Full Arena" button linking to `/arena`
- [ ] **4.3.5** On empty state (no strategies yet): show pre-seeded example strategies

### Task 4.4 — "How It Works" Section

- [ ] **4.4.1** Three-step visual: Describe → Backtest → Compete
- [ ] **4.4.2** Each step has an icon, short title, and one sentence
- [ ] **4.4.3** Clean, minimal design — this section exists for people who scroll past the hero before trying it

### Task 4.5 — Example Strategies Showcase

- [ ] **4.5.1** Show 3-4 example strategy descriptions that users can click to auto-fill:
  - "Buy tech stocks when they dip 10% and sell when they bounce back"
  - "Go long when RSI is oversold and MACD crosses bullish"
  - "YOLO into whatever dropped the most yesterday, diamond hands for 3 days"
  - "Conservative portfolio: buy blue chips when they're below their 200-day average"
- [ ] **4.5.2** Clicking an example takes you straight to the creation flow with that text pre-filled

---

## Phase 5: Frontend — Strategy Creation

### Task 5.1 — Guided Mode (`/create?mode=guided`)

- [ ] **5.1.1** Step 1 — "What's your idea?" Big text area. Placeholder: "Tell me your trading idea in plain English... Don't worry about being precise, I'll help you refine it."
- [ ] **5.1.2** Step 2 — Clarification questions. The LLM returns follow-up questions based on what's missing from the user's input. Display as a conversational chat-like interface.
- [ ] **5.1.3** Step 3 — Strategy confirmation. Show the structured breakdown and let the user confirm or adjust before proceeding.
- [ ] **5.1.4** Step progress indicator (Step 1 of 3, Step 2 of 3, etc.)
- [ ] **5.1.5** "Back" button to go to previous step, preserving input
- [ ] **5.1.6** Smooth transitions between steps (Framer Motion slide/fade)

### Task 5.2 — Advanced Mode (`/create?mode=advanced`)

- [ ] **5.2.1** Single large text input with a "Forge Strategy" button
- [ ] **5.2.2** No clarifying questions — the LLM does best-effort interpretation
- [ ] **5.2.3** Below the input: collapsible "Parameters" panel where power users can manually set:
  - Stock universe (multi-select ticker picker)
  - Position sizing (equal weight / risk parity)
  - Max positions
  - Max position size %
- [ ] **5.2.4** These manual parameters override whatever the LLM interprets from the text

### Task 5.3 — The "Algorithm Forge" (Wow Moment)

- [ ] **5.3.1** **Interpretation Display:** After LLM responds, show the structured strategy breakdown in a styled card:
  ```
  STRATEGY: Momentum Dip Buyer
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENTRY:  Buy when price drops 5%+ from 5-day high
          AND daily volume > 1.2x 20-day average
  EXIT:   Sell at +8% profit OR -4% stop loss
  ASSETS: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA
  SIZING: Equal weight, max 25% per position
  ```
- [ ] **5.3.2** **Code Generation Animation:** Stream the Python-like pseudocode onto the screen with a typewriter effect, syntax highlighted. Use a monospace font, dark code editor background (like VS Code). This is NOT real code execution — it's the code-renderer output animated character by character.
- [ ] **5.3.3** **Backtest Execution:** Show a loading state ("Running backtest... Simulating 2,520 trading days across 10 years...") with a progress animation, then reveal results.
- [ ] **5.3.4** The whole sequence should feel dramatic and satisfying. Each stage transitions smoothly into the next.
- [ ] **5.3.5** "Edit Strategy" button that takes you back to modify the English input

### Task 5.4 — Results Display

- [ ] **5.4.1** **Letter grade** — giant, centered, color-coded (A+ in green, F in red). This is the first thing they see.
- [ ] **5.4.2** **Equity curve chart** — portfolio value over time vs S&P 500 benchmark. Using Lightweight Charts. Interactive (hover for values).
- [ ] **5.4.3** **Stats grid** — 2x3 grid of key metrics:
  - Total Return %
  - Sharpe Ratio
  - Max Drawdown %
  - Win Rate %
  - Total Trades
  - Avg Trade Duration (days)
- [ ] **5.4.4** **Trade log** — expandable/collapsible table showing every buy/sell with date, ticker, price, return, exit reason
- [ ] **5.4.5** **"Deploy to Leaderboard" button** — big, prominent, primary action. Saves strategy + results to Supabase, adds to global leaderboard.
- [ ] **5.4.6** **"Share Results" button** — generates a shareable card image (or opens share modal)
- [ ] **5.4.7** **"Try Another Strategy" button** — secondary action to go back to creation

---

## Phase 6: Frontend — Leaderboard

### Task 6.1 — Leaderboard Page (`/arena`)

- [ ] **6.1.1** Full-width leaderboard table with columns:
  - Rank (#)
  - Strategy Name
  - Creator (username)
  - Total Return % (over the fixed 10-year backtest period)
  - Sharpe Ratio
  - Max Drawdown %
  - Win Rate %
  - Grade badge
- [ ] **6.1.2** Top 3 strategies get special visual treatment (gold/silver/bronze highlights, slightly larger)
- [ ] **6.1.3** Filter/sort controls: sort by any column, filter by strategy type (momentum, mean reversion, etc.)
- [ ] **6.1.4** Search bar to find specific strategies or creators
- [ ] **6.1.5** Banner at top: "All strategies ranked on the same 10 years of market data. Same conditions. Best idea wins."
- [ ] **6.1.6** Click any row to navigate to that strategy's detail page
- [ ] **6.1.7** Pagination (or infinite scroll) for browsing beyond top rankings
- [ ] **6.1.8** Default sort: by composite score (weighted blend of return, Sharpe, drawdown) — same formula used for letter grades

### Task 6.2 — Strategy Detail Page (`/strategy/[id]`)

- [ ] **6.2.1** Strategy header: name, creator, grade badge, deploy date
- [ ] **6.2.2** The original English description (the prompt the user typed)
- [ ] **6.2.3** The structured strategy breakdown
- [ ] **6.2.4** Full equity curve (10-year backtest) vs S&P 500 benchmark
- [ ] **6.2.5** Key stats grid (same as results page)
- [ ] **6.2.6** Trade log (expandable)
- [ ] **6.2.7** "Challenge This Strategy" button — runs a head-to-head comparison against one of your strategies on the same data (client-side)
- [ ] **6.2.8** "Create Similar Strategy" button — pre-fills the creation input with this strategy's English description for the user to riff on

---

## Phase 7: Database & Auth

### Task 7.1 — Supabase Setup

- [ ] **7.1.1** Create Supabase project (free tier)
- [ ] **7.1.2** Set up auth providers: Google and GitHub login (one-click sign in)
- [ ] **7.1.3** Create `strategies` table:
  - `id` (uuid, primary key)
  - `user_id` (references auth.users)
  - `name` (text)
  - `english_prompt` (text)
  - `json_config` (jsonb)
  - `return_pct` (float) — 10-year backtest return
  - `sharpe_ratio` (float)
  - `max_drawdown_pct` (float)
  - `win_rate_pct` (float)
  - `total_trades` (int)
  - `grade` (text)
  - `composite_score` (float) — weighted score used for ranking
  - `equity_curve` (jsonb)
  - `trade_log` (jsonb)
  - `is_active` (boolean, default true)
  - `created_at` (timestamp)
- [ ] **7.1.4** Create a database view `leaderboard` that selects active strategies ordered by `composite_score` descending, with a computed `rank` column
- [ ] **7.1.5** Set up Row Level Security (RLS): users can only edit/delete their own strategies, anyone can read
- [ ] **7.1.6** Create Supabase client utility in `lib/supabase.ts` (browser client + server client)

### Task 7.2 — User Profile

- [ ] **7.2.1** Minimal profile: username (editable once), avatar (from auth provider)
- [ ] **7.2.2** "My Strategies" page — list of user's deployed strategies with stats
- [ ] **7.2.3** Strategy management: deactivate/reactivate strategies in the arena

---

## Phase 8: Head-to-Head Comparison

### Task 8.1 — Head-to-Head Feature

- [ ] **8.1.1** From any strategy detail page, click "Challenge" to compare it against one of your strategies
- [ ] **8.1.2** Both strategies are backtested on the same 10-year data (results may already be cached)
- [ ] **8.1.3** Side-by-side equity curves overlaid on the same chart
- [ ] **8.1.4** Stat comparison table (your strategy vs theirs — return, Sharpe, drawdown, win rate, grade)
- [ ] **8.1.5** Declare a "winner" based on composite score
- [ ] **8.1.6** Shareable comparison card for social media
- [ ] **8.1.7** Runs entirely client-side — no server needed

---

## Phase 9: Viral & Social Features

### Task 9.1 — Shareable Result Cards

- [ ] **9.1.1** Generate a shareable image card showing: strategy name, grade, return %, equity curve thumbnail, "Built on AlphaRing" branding
- [ ] **9.1.2** Use Vercel OG image generation or `html-to-image` client-side library
- [ ] **9.1.3** "Share to Twitter/X" button with pre-filled tweet text: "My trading algorithm got an [grade] on AlphaRing! [return]% return. Can you beat it? [link]"
- [ ] **9.1.4** Copy link button for easy sharing anywhere

### Task 9.2 — Social Meta Tags

- [ ] **9.2.1** OG tags on landing page: title, description, preview image
- [ ] **9.2.2** Dynamic OG tags on strategy pages: show that specific strategy's grade and return in the preview card
- [ ] **9.2.3** Twitter card meta tags for large image preview

### Task 9.3 — Pre-Seeded Content

- [ ] **9.3.1** Create 20-30 pre-seeded strategies with fun names:
  - "The Buffett Bot" — buy undervalued blue chips
  - "Diamond Hands" — buy dips, never sell early
  - "WSB Degen" — YOLO into volatile stocks
  - "Boomer Portfolio" — conservative dividend strategy
  - "Momentum Bro" — chase what's running
  - "Mean Reversion Nerd" — buy oversold, sell overbought
  - etc.
- [ ] **9.3.2** Run all pre-seeded strategies through the 10-year backtest to populate the leaderboard before launch
- [ ] **9.3.3** These make the platform feel alive on day one — users land and see a populated leaderboard immediately

---

## Phase 10: Polish & Launch Prep

### Task 10.1 — UI Polish

- [ ] **10.1.1** Loading states for every async operation (skeleton screens, not spinners)
- [ ] **10.1.2** Error states with helpful messages (LLM failed, backtest errored, etc.)
- [ ] **10.1.3** Empty states (no strategies yet, no results yet)
- [ ] **10.1.4** Micro-animations: grade reveal (count up effect), equity curve drawing animation, leaderboard rank change animation
- [ ] **10.1.5** Mobile responsive across all pages
- [ ] **10.1.6** Dark mode only (looks more premium, simpler to design)
- [ ] **10.1.7** Consistent color palette: dark backgrounds, electric accent color, green for profit, red for loss

### Task 10.2 — Performance

- [ ] **10.2.1** Lazy load stock data (only fetch tickers that the strategy needs)
- [ ] **10.2.2** Code-split the backtesting engine (don't load it on the landing page)
- [ ] **10.2.3** Optimize Lighthouse score (target: 90+ on mobile)
- [ ] **10.2.4** Use `next/image` for any images, `next/font` for fonts

### Task 10.3 — Deployment

- [ ] **10.3.1** Deploy to Vercel (connect GitHub repo, auto-deploy on push)
- [ ] **10.3.2** Set environment variables in Vercel dashboard (Groq key, Supabase URL + anon key)
- [ ] **10.3.3** Verify all API routes work in production
- [ ] **10.3.4** Test the full flow end-to-end in production
- [ ] **10.3.5** Set up Vercel Analytics (free) for basic traffic monitoring

### Task 10.4 — Launch Content

- [ ] **10.4.1** Record 60-second screen recording: type a strategy → watch it work → see the leaderboard
- [ ] **10.4.2** Write launch posts for: Twitter/X, Reddit (r/algotrading, r/programming, r/SideProject, r/wallstreetbets), LinkedIn, Hacker News
- [ ] **10.4.3** Product Hunt listing: title, tagline, description, screenshots
- [ ] **10.4.4** DivCodes video: "I built a platform where anyone can create trading algorithms in English"

---

## What to Skip for MVP

These are intentionally deferred to v2 to keep scope manageable:

- Daily arena rounds with rotating historical periods (MVP uses fixed 10-year backtest for all)
- ELO rating system (MVP ranks by composite backtest score)
- GitHub Actions cron job (not needed without daily rounds)
- Themed tournaments ("Crash Survival", "COVID Recovery")
- Code editing by users (power user feature)
- Real-time notifications (strategy rank changes)
- Paper trading with live data
- Strategy marketplace / following
- Advanced charting (candlestick patterns, overlays)
- Multi-timeframe strategies (e.g., daily + hourly)
- Crypto / forex data (stock-only for MVP)
- Strategy comments / social features beyond sharing

---

## Success Metrics

- **Wow metric:** Time from landing to first backtest result < 60 seconds
- **Virality metric:** % of users who share their result card
- **Retention metric:** % of users who deploy a second strategy within 7 days
- **Growth metric:** Daily new strategies deployed

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM generates invalid JSON | Schema validation + one retry with error feedback |
| Groq rate limits hit | Cascade to Gemini, then graceful error message |
| Backtesting gives unrealistic results | Benchmark against S&P 500, flag >500% annual returns with disclaimer |
| Users think this is real trading | Prominent "not financial advice" disclaimers everywhere |
| Someone types something offensive | Strategy names go through basic content filter |
| Vercel bandwidth limits | Client-side processing minimizes server load; stock data cached aggressively |
