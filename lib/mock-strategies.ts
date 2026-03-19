// ============================================================
// Mock Strategy Data for pre-launch leaderboard
// Will be replaced by Supabase queries in Phase 7
// ============================================================

import type { StrategyConfig } from "./strategy-schema";
import type { EquityCurvePoint, TradeRecord } from "./backtester";

export type StrategyType =
  | "momentum"
  | "mean_reversion"
  | "trend_following"
  | "breakout"
  | "value"
  | "degen";

export interface MockStrategy {
  id: string;
  name: string;
  creator: string;
  englishPrompt: string;
  type: StrategyType;
  config: StrategyConfig;
  returnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  avgTradeDuration: number;
  grade: string;
  compositeScore: number;
  createdAt: string;
}

// ── Deterministic pseudo-random ─────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Generate mock equity curve ──────────────────────────
export function generateEquityCurve(
  totalReturnPct: number,
  volatility: number,
  seed: number
): EquityCurvePoint[] {
  const rng = seededRandom(seed);
  const startValue = 100_000;
  const numPoints = 240; // ~biweekly for 10 years
  const endValue = startValue * (1 + totalReturnPct / 100);

  const dailyReturn = Math.pow(endValue / startValue, 1 / numPoints) - 1;
  const benchmarkEnd = startValue * 2.6; // SPY ~160% over 10 years
  const benchmarkDaily =
    Math.pow(benchmarkEnd / startValue, 1 / numPoints) - 1;

  const points: EquityCurvePoint[] = [];
  let pv = startValue;
  let bv = startValue;
  const startDate = new Date(2014, 0, 2);

  for (let i = 0; i < numPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((i * 3652) / numPoints));

    const r = rng();
    pv *= 1 + dailyReturn + (r - 0.5) * volatility;
    bv *= 1 + benchmarkDaily + (r - 0.5) * 0.006;

    // Clamp to never go below 5% of start
    pv = Math.max(pv, startValue * 0.05);
    bv = Math.max(bv, startValue * 0.05);

    points.push({
      date: date.toISOString().split("T")[0],
      portfolioValue: Math.round(pv * 100) / 100,
      benchmarkValue: Math.round(bv * 100) / 100,
    });
  }

  return points;
}

// ── Generate mock trade log ─────────────────────────────
export function generateTradeLog(
  tickers: string[],
  totalTrades: number,
  winRate: number,
  seed: number
): TradeRecord[] {
  const rng = seededRandom(seed);
  const trades: TradeRecord[] = [];
  const numSample = Math.min(totalTrades, 30);
  const startDate = new Date(2014, 0, 15);
  const exitReasons = [
    "take_profit",
    "stop_loss",
    "max_hold_days",
    "exit_condition",
  ];

  for (let i = 0; i < numSample; i++) {
    const ticker = tickers[Math.floor(rng() * tickers.length)];
    const entryDate = new Date(startDate);
    entryDate.setDate(
      entryDate.getDate() + Math.floor(rng() * 3400)
    );
    const holdDays = Math.floor(rng() * 45) + 1;
    const exitDate = new Date(entryDate);
    exitDate.setDate(exitDate.getDate() + holdDays);

    const isWin = rng() < winRate / 100;
    const entryPrice =
      Math.round((50 + rng() * 400) * 100) / 100;
    const returnPct = isWin
      ? Math.round((rng() * 15 + 1) * 100) / 100
      : Math.round((-rng() * 12 - 0.5) * 100) / 100;
    const exitPrice =
      Math.round(entryPrice * (1 + returnPct / 100) * 100) / 100;

    const exitReason = isWin
      ? rng() > 0.3
        ? "take_profit"
        : "exit_condition"
      : exitReasons[Math.floor(rng() * 3) + 1];

    trades.push({
      ticker,
      entryDate: entryDate.toISOString().split("T")[0],
      entryPrice,
      exitDate: exitDate.toISOString().split("T")[0],
      exitPrice,
      returnPct,
      holdDays,
      exitReason,
    });
  }

  return trades.sort(
    (a, b) =>
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );
}

// ── Strategy definitions ────────────────────────────────
export const MOCK_STRATEGIES: MockStrategy[] = [
  {
    id: "strat_bb_breakout",
    name: "Bollinger Breakout",
    creator: "AlphaRing",
    englishPrompt:
      "Buy when price crosses above the upper Bollinger Band with strong volume. Sell at 12% profit, 6% stop loss, or after 15 days.",
    type: "breakout",
    config: {
      name: "Bollinger Breakout",
      description:
        "Buy when price crosses above the upper Bollinger Band (20-day, 2 std dev) with strong volume. Sell at 12% profit, 6% stop loss, or after 15 days.",
      entry: {
        conditions: [
          {
            indicator: "bollinger_upper",
            period: 20,
            operator: "crosses_above",
            value: 0,
          },
          {
            indicator: "volume_ratio",
            period: 20,
            operator: ">=",
            value: 1.5,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 12,
        stop_loss_pct: 6,
        max_hold_days: 15,
      },
      universe: ["NVDA", "AMD", "TSLA", "SHOP", "COIN", "PLTR"],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 30,
    },
    returnPct: 739.7,
    sharpeRatio: 1.58,
    maxDrawdownPct: 16.74,
    winRatePct: 59.56,
    totalTrades: 187,
    avgTradeDuration: 9,
    grade: "B+",
    compositeScore: 79.0,
    createdAt: "2024-01-15",
  },
  {
    id: "strat_gc_rider",
    name: "Golden Cross Rider",
    creator: "AlphaRing",
    englishPrompt:
      "Buy when the 50-day SMA crosses above the 200-day SMA. Sell when it crosses below or at 10% stop loss.",
    type: "trend_following",
    config: {
      name: "Golden Cross Rider",
      description:
        "Buy when the 50-day SMA crosses above the 200-day SMA (golden cross). Sell when it crosses below (death cross) or at 10% stop loss.",
      entry: {
        conditions: [
          {
            indicator: "sma",
            period: 50,
            operator: "crosses_above",
            value: 0,
            compare_to: "sma_200",
          },
        ],
        logic: "AND",
      },
      exit: {
        stop_loss_pct: 10,
        conditions: [
          {
            indicator: "sma",
            period: 50,
            operator: "crosses_below",
            value: 0,
            compare_to: "sma_200",
          },
        ],
      },
      universe: [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "NVDA",
        "META",
        "TSLA",
        "JPM",
        "V",
        "MA",
      ],
      position_sizing: "equal_weight",
      max_positions: 5,
      max_position_pct: 20,
    },
    returnPct: 390.22,
    sharpeRatio: 0.93,
    maxDrawdownPct: 32.8,
    winRatePct: 57.69,
    totalTrades: 52,
    avgTradeDuration: 85,
    grade: "C",
    compositeScore: 50.3,
    createdAt: "2024-01-20",
  },
  {
    id: "strat_boomer",
    name: "Boomer Portfolio",
    creator: "AlphaRing",
    englishPrompt:
      "Buy blue-chip stocks when they're trading below their 200-day moving average. Hold until 15% profit or 60 days max. Conservative 7% stop loss.",
    type: "value",
    config: {
      name: "Boomer Portfolio",
      description:
        "Buy blue-chip stocks when they're trading below their 200-day moving average. Hold until 15% profit or 60 days max.",
      entry: {
        conditions: [
          {
            indicator: "sma",
            period: 200,
            operator: ">=",
            value: 0,
            compare_to: "price",
          },
          { indicator: "rsi", period: 14, operator: "<=", value: 45 },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 15,
        stop_loss_pct: 7,
        max_hold_days: 60,
      },
      universe: [
        "JNJ",
        "KO",
        "PEP",
        "WMT",
        "JPM",
        "V",
        "MA",
        "MCD",
        "HD",
        "UNH",
      ],
      position_sizing: "equal_weight",
      max_positions: 5,
      max_position_pct: 20,
    },
    returnPct: 229.56,
    sharpeRatio: 0.9,
    maxDrawdownPct: 23.5,
    winRatePct: 60.31,
    totalTrades: 126,
    avgTradeDuration: 32,
    grade: "D",
    compositeScore: 47.8,
    createdAt: "2024-02-01",
  },
  {
    id: "strat_momentum_dip",
    name: "Momentum Dip Buyer",
    creator: "AlphaRing",
    englishPrompt:
      "Buy large-cap tech stocks when they dip 5% over 5 days with above-average volume, sell at 8% profit or 4% stop loss.",
    type: "momentum",
    config: {
      name: "Momentum Dip Buyer",
      description:
        "Buy large-cap tech stocks when they dip 5% over 5 days with above-average volume, sell at 8% profit or 4% stop loss.",
      entry: {
        conditions: [
          {
            indicator: "price_change_pct",
            period: 5,
            operator: "<=",
            value: -5,
          },
          {
            indicator: "volume_ratio",
            period: 20,
            operator: ">=",
            value: 1.2,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 8,
        stop_loss_pct: 4,
        max_hold_days: 10,
      },
      universe: [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "NVDA",
        "META",
        "TSLA",
      ],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 25,
    },
    returnPct: 115.21,
    sharpeRatio: 0.59,
    maxDrawdownPct: 25.98,
    winRatePct: 50.79,
    totalTrades: 63,
    avgTradeDuration: 7,
    grade: "F",
    compositeScore: 36.4,
    createdAt: "2024-02-10",
  },
  {
    id: "strat_mean_rev",
    name: "Mean Reversion Nerd",
    creator: "AlphaRing",
    englishPrompt:
      "Buy when RSI drops below 30 (oversold) and sell when RSI rises above 70 (overbought) or at 5% stop loss.",
    type: "mean_reversion",
    config: {
      name: "Mean Reversion Nerd",
      description:
        "Buy when RSI drops below 30 (oversold) and sell when RSI rises above 70 (overbought) or at 5% stop loss.",
      entry: {
        conditions: [
          { indicator: "rsi", period: 14, operator: "<=", value: 30 },
        ],
        logic: "AND",
      },
      exit: {
        stop_loss_pct: 5,
        max_hold_days: 30,
        conditions: [
          {
            indicator: "rsi",
            period: 14,
            operator: ">=",
            value: 70,
          },
        ],
      },
      universe: [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "JPM",
        "BAC",
        "JNJ",
        "PFE",
        "XOM",
      ],
      position_sizing: "equal_weight",
      max_positions: 5,
      max_position_pct: 20,
    },
    returnPct: 50.05,
    sharpeRatio: 0.36,
    maxDrawdownPct: 33.11,
    winRatePct: 49.72,
    totalTrades: 181,
    avgTradeDuration: 15,
    grade: "F",
    compositeScore: 27.2,
    createdAt: "2024-02-15",
  },
  {
    id: "strat_wsb_degen",
    name: "WSB Degen",
    creator: "AlphaRing",
    englishPrompt:
      "YOLO into whatever dropped the most over 3 days. Diamond hands for 3 trading days, then dump it. No stop loss. Full send.",
    type: "degen",
    config: {
      name: "WSB Degen",
      description:
        "YOLO into whatever dropped the most over 3 days. Diamond hands for 3 trading days, then dump it.",
      entry: {
        conditions: [
          {
            indicator: "price_change_pct",
            period: 3,
            operator: "<=",
            value: -8,
          },
        ],
        logic: "AND",
      },
      exit: { max_hold_days: 3 },
      universe: [
        "TSLA",
        "AMD",
        "NVDA",
        "COIN",
        "SNAP",
        "PLTR",
        "SOFI",
        "UBER",
      ],
      position_sizing: "equal_weight",
      max_positions: 2,
      max_position_pct: 50,
    },
    returnPct: 46.32,
    sharpeRatio: 0.28,
    maxDrawdownPct: 72.13,
    winRatePct: 49.56,
    totalTrades: 224,
    avgTradeDuration: 3,
    grade: "F",
    compositeScore: 19.1,
    createdAt: "2024-03-01",
  },
  {
    id: "strat_macd_momentum",
    name: "MACD Momentum",
    creator: "QuantKid",
    englishPrompt:
      "Buy when MACD line crosses above signal line and RSI is between 40-60. Sell at 10% profit or 5% stop loss.",
    type: "momentum",
    config: {
      name: "MACD Momentum",
      description:
        "Buy when MACD line crosses above signal line and RSI is in neutral zone. Targets quick 10% gains.",
      entry: {
        conditions: [
          {
            indicator: "macd_line",
            period: 26,
            operator: "crosses_above",
            value: 0,
            compare_to: "macd_signal_26",
          },
          { indicator: "rsi", period: 14, operator: ">=", value: 40 },
          { indicator: "rsi", period: 14, operator: "<=", value: 60 },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 10,
        stop_loss_pct: 5,
        max_hold_days: 20,
      },
      universe: [
        "AAPL",
        "MSFT",
        "NVDA",
        "AMD",
        "GOOGL",
        "META",
        "CRM",
        "ADBE",
      ],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 312.45,
    sharpeRatio: 1.12,
    maxDrawdownPct: 22.1,
    winRatePct: 55.3,
    totalTrades: 94,
    avgTradeDuration: 12,
    grade: "C",
    compositeScore: 56.7,
    createdAt: "2024-01-28",
  },
  {
    id: "strat_vol_squeeze",
    name: "Volatility Squeeze",
    creator: "TraderAnon",
    englishPrompt:
      "Buy when Bollinger Bands are tight (ATR is low) and price breaks above the upper band. Ride the expansion for up to 20 days.",
    type: "breakout",
    config: {
      name: "Volatility Squeeze",
      description:
        "Buy when Bollinger Band width contracts and price breaks above upper band, indicating a volatility expansion is coming.",
      entry: {
        conditions: [
          {
            indicator: "atr",
            period: 14,
            operator: "<=",
            value: 2,
          },
          {
            indicator: "bollinger_upper",
            period: 20,
            operator: "crosses_above",
            value: 0,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 15,
        stop_loss_pct: 5,
        max_hold_days: 20,
      },
      universe: [
        "NVDA",
        "AMD",
        "TSLA",
        "SHOP",
        "COIN",
        "META",
        "NFLX",
      ],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 30,
    },
    returnPct: 485.6,
    sharpeRatio: 1.24,
    maxDrawdownPct: 28.5,
    winRatePct: 52.1,
    totalTrades: 71,
    avgTradeDuration: 14,
    grade: "C",
    compositeScore: 58.9,
    createdAt: "2024-02-05",
  },
  {
    id: "strat_div_value",
    name: "The Buffett Bot",
    creator: "ValueHunter",
    englishPrompt:
      "Buy undervalued blue-chip stocks when they drop below their 200-day moving average and RSI shows oversold. Very conservative with a tight stop loss.",
    type: "value",
    config: {
      name: "The Buffett Bot",
      description:
        "Buy quality blue chips when they're undervalued based on SMA-200 and RSI. Conservative approach with long hold periods.",
      entry: {
        conditions: [
          {
            indicator: "sma",
            period: 200,
            operator: ">=",
            value: 0,
            compare_to: "price",
          },
          { indicator: "rsi", period: 14, operator: "<=", value: 35 },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 20,
        stop_loss_pct: 8,
        max_hold_days: 90,
      },
      universe: [
        "JNJ",
        "KO",
        "PEP",
        "WMT",
        "JPM",
        "V",
        "HD",
        "MCD",
        "UNH",
        "LLY",
      ],
      position_sizing: "equal_weight",
      max_positions: 5,
      max_position_pct: 20,
    },
    returnPct: 198.3,
    sharpeRatio: 0.88,
    maxDrawdownPct: 18.2,
    winRatePct: 62.5,
    totalTrades: 48,
    avgTradeDuration: 45,
    grade: "D",
    compositeScore: 48.3,
    createdAt: "2024-01-10",
  },
  {
    id: "strat_diamond_hands",
    name: "Diamond Hands",
    creator: "HODLer",
    englishPrompt:
      "Buy tech stocks after a big dip (10%+). Never sell early - hold for at least 30 days. Only sell at 25% profit or a 15% loss.",
    type: "degen",
    config: {
      name: "Diamond Hands",
      description:
        "Buy after major tech dips. Hold with conviction for 30+ days. Wide stop loss, high profit target.",
      entry: {
        conditions: [
          {
            indicator: "price_change_pct",
            period: 5,
            operator: "<=",
            value: -10,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 25,
        stop_loss_pct: 15,
        max_hold_days: 60,
      },
      universe: [
        "TSLA",
        "NVDA",
        "AMD",
        "COIN",
        "SHOP",
        "PLTR",
        "SOFI",
      ],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 33,
    },
    returnPct: 156.8,
    sharpeRatio: 0.52,
    maxDrawdownPct: 45.2,
    winRatePct: 44.1,
    totalTrades: 34,
    avgTradeDuration: 28,
    grade: "F",
    compositeScore: 30.5,
    createdAt: "2024-02-20",
  },
  {
    id: "strat_ema_crossover",
    name: "EMA Scalper",
    creator: "SpeedTrader",
    englishPrompt:
      "Buy when the 9-day EMA crosses above the 21-day EMA on high-volume tech stocks. Quick exits: 5% profit or 3% loss.",
    type: "trend_following",
    config: {
      name: "EMA Scalper",
      description:
        "Fast EMA crossover on tech stocks for quick trades. Tight risk management.",
      entry: {
        conditions: [
          {
            indicator: "ema",
            period: 9,
            operator: "crosses_above",
            value: 0,
            compare_to: "ema_21",
          },
          {
            indicator: "volume_ratio",
            period: 10,
            operator: ">=",
            value: 1.3,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 5,
        stop_loss_pct: 3,
        max_hold_days: 7,
      },
      universe: [
        "AAPL",
        "MSFT",
        "NVDA",
        "AMD",
        "TSLA",
        "META",
        "GOOGL",
        "AMZN",
      ],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 88.4,
    sharpeRatio: 0.45,
    maxDrawdownPct: 19.8,
    winRatePct: 53.2,
    totalTrades: 312,
    avgTradeDuration: 5,
    grade: "F",
    compositeScore: 34.1,
    createdAt: "2024-03-05",
  },
  {
    id: "strat_momentum_bro",
    name: "Momentum Bro",
    creator: "ChaseAlpha",
    englishPrompt:
      "Chase whatever is running hot. Buy when a stock is up 15% in 20 days with volume surge. Ride the wave with a trailing-ish stop.",
    type: "momentum",
    config: {
      name: "Momentum Bro",
      description:
        "Chase stocks with strong upward momentum over 20 days. Ride the trend with moderate risk controls.",
      entry: {
        conditions: [
          {
            indicator: "price_change_pct",
            period: 20,
            operator: ">=",
            value: 15,
          },
          {
            indicator: "volume_ratio",
            period: 20,
            operator: ">=",
            value: 1.5,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 20,
        stop_loss_pct: 8,
        max_hold_days: 30,
      },
      universe: [
        "NVDA",
        "AMD",
        "TSLA",
        "COIN",
        "SHOP",
        "PLTR",
        "META",
        "NFLX",
      ],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 30,
    },
    returnPct: 520.1,
    sharpeRatio: 1.05,
    maxDrawdownPct: 38.7,
    winRatePct: 48.3,
    totalTrades: 58,
    avgTradeDuration: 18,
    grade: "C",
    compositeScore: 51.2,
    createdAt: "2024-01-25",
  },
  {
    id: "strat_rsi_rebound",
    name: "RSI Rebound",
    creator: "OversoldHunter",
    englishPrompt:
      "Buy when RSI drops below 25 (deeply oversold) and price has fallen 8%+ over 5 days. Take 12% profit, stop at 6%, max 20 days.",
    type: "mean_reversion",
    config: {
      name: "RSI Rebound",
      description:
        "Buy deeply oversold momentum stocks when RSI is below 25 and price has dropped 8%+ over 5 days. Targets quick mean-reversion bounces.",
      entry: {
        conditions: [
          { indicator: "rsi", period: 14, operator: "<=", value: 25 },
          {
            indicator: "price_change_pct",
            period: 5,
            operator: "<=",
            value: -8,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 12,
        stop_loss_pct: 6,
        max_hold_days: 20,
      },
      universe: ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA"],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 418.2,
    sharpeRatio: 1.31,
    maxDrawdownPct: 24.7,
    winRatePct: 61.2,
    totalTrades: 78,
    avgTradeDuration: 11,
    grade: "B",
    compositeScore: 64.8,
    createdAt: "2024-03-10",
  },
  {
    id: "strat_macd_crossover",
    name: "MACD Crossover",
    creator: "TechTrader99",
    englishPrompt:
      "Buy when the MACD line crosses above the signal line. Hold up to 25 days with 15% profit target and 7% stop.",
    type: "trend_following",
    config: {
      name: "MACD Crossover",
      description:
        "Buy on MACD line crossing above signal line. Rides short-term trend shifts on large-cap tech.",
      entry: {
        conditions: [
          {
            indicator: "macd_line",
            period: 26,
            operator: "crosses_above",
            value: 0,
            compare_to: "macd_signal_26",
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 15,
        stop_loss_pct: 7,
        max_hold_days: 25,
      },
      universe: ["AAPL", "MSFT", "NVDA", "AMD", "GOOGL", "META"],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 267.4,
    sharpeRatio: 0.98,
    maxDrawdownPct: 21.3,
    winRatePct: 56.8,
    totalTrades: 89,
    avgTradeDuration: 16,
    grade: "C",
    compositeScore: 53.2,
    createdAt: "2024-03-15",
  },
  {
    id: "strat_ema_trend_rider",
    name: "EMA Trend Rider",
    creator: "TrendSurfer",
    englishPrompt:
      "Buy when the 21-day EMA crosses above the 50-day EMA with volume 20% above average. Hold up to 45 days.",
    type: "trend_following",
    config: {
      name: "EMA Trend Rider",
      description:
        "Buy when short EMA crosses above medium EMA with volume confirmation. Rides multi-week trends across large-caps.",
      entry: {
        conditions: [
          {
            indicator: "ema",
            period: 21,
            operator: "crosses_above",
            value: 0,
            compare_to: "ema_50",
          },
          {
            indicator: "volume_ratio",
            period: 20,
            operator: ">=",
            value: 1.2,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 18,
        stop_loss_pct: 9,
        max_hold_days: 45,
      },
      universe: [
        "AAPL",
        "MSFT",
        "AMZN",
        "GOOGL",
        "NVDA",
        "META",
        "TSLA",
        "JPM",
      ],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 344.8,
    sharpeRatio: 1.19,
    maxDrawdownPct: 26.5,
    winRatePct: 54.3,
    totalTrades: 67,
    avgTradeDuration: 28,
    grade: "C",
    compositeScore: 57.4,
    createdAt: "2024-03-20",
  },
  {
    id: "strat_contrarian",
    name: "The Contrarian",
    creator: "BuyTheFear",
    englishPrompt:
      "Buy when a stock or ETF has crashed 15%+ over 10 days AND RSI is below 25. Big fear = big opportunity. 20% target, 8% stop.",
    type: "mean_reversion",
    config: {
      name: "The Contrarian",
      description:
        "Buy into extreme fear — 15%+ drops over 10 days with RSI below 25. Targets sharp mean-reversion bounces on quality assets.",
      entry: {
        conditions: [
          {
            indicator: "price_change_pct",
            period: 10,
            operator: "<=",
            value: -15,
          },
          { indicator: "rsi", period: 14, operator: "<=", value: 25 },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 20,
        stop_loss_pct: 8,
        max_hold_days: 40,
      },
      universe: ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "AMZN"],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 33,
    },
    returnPct: 508.3,
    sharpeRatio: 1.47,
    maxDrawdownPct: 19.8,
    winRatePct: 63.5,
    totalTrades: 42,
    avgTradeDuration: 22,
    grade: "B+",
    compositeScore: 71.9,
    createdAt: "2024-04-01",
  },
  {
    id: "strat_volume_surge",
    name: "Volume Surge Scout",
    creator: "QuietObserver",
    englishPrompt:
      "Buy when volume is 2.5x the 20-day average AND price is up 2% on the day. Momentum confirmed by crowd. Quick 10% target.",
    type: "breakout",
    config: {
      name: "Volume Surge Scout",
      description:
        "Buy breakouts confirmed by massive volume surge (2.5x avg) with price up 2%+ on the day. Quick momentum plays.",
      entry: {
        conditions: [
          {
            indicator: "volume_ratio",
            period: 20,
            operator: ">=",
            value: 2.5,
          },
          {
            indicator: "price_change_pct",
            period: 1,
            operator: ">=",
            value: 2,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 10,
        stop_loss_pct: 5,
        max_hold_days: 12,
      },
      universe: ["NVDA", "AMD", "TSLA", "META", "NFLX", "SHOP", "COIN"],
      position_sizing: "equal_weight",
      max_positions: 3,
      max_position_pct: 30,
    },
    returnPct: 623.7,
    sharpeRatio: 1.38,
    maxDrawdownPct: 31.2,
    winRatePct: 55.7,
    totalTrades: 145,
    avgTradeDuration: 8,
    grade: "B",
    compositeScore: 62.3,
    createdAt: "2024-04-05",
  },
  {
    id: "strat_patience_bot",
    name: "The Patience Bot",
    creator: "LongGamePlayer",
    englishPrompt:
      "Buy blue chips only when they're deeply oversold: RSI below 30 and down 20%+ in 20 days. Hold up to 120 days for a 30% recovery.",
    type: "value",
    config: {
      name: "The Patience Bot",
      description:
        "Ultra-patient value buying on blue chips. Only enters when RSI<30 AND 20-day drop exceeds 20%. Holds for a big recovery.",
      entry: {
        conditions: [
          { indicator: "rsi", period: 14, operator: "<=", value: 30 },
          {
            indicator: "price_change_pct",
            period: 20,
            operator: "<=",
            value: -20,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 30,
        stop_loss_pct: 12,
        max_hold_days: 120,
      },
      universe: [
        "JNJ",
        "KO",
        "PEP",
        "WMT",
        "JPM",
        "V",
        "HD",
        "MCD",
        "AAPL",
        "MSFT",
      ],
      position_sizing: "equal_weight",
      max_positions: 5,
      max_position_pct: 20,
    },
    returnPct: 176.4,
    sharpeRatio: 0.82,
    maxDrawdownPct: 15.9,
    winRatePct: 66.7,
    totalTrades: 27,
    avgTradeDuration: 58,
    grade: "D",
    compositeScore: 46.2,
    createdAt: "2024-04-10",
  },
  {
    id: "strat_nano_scalper",
    name: "Nano Scalper",
    creator: "FastFingers",
    englishPrompt:
      "Ultra-short trades: buy when 9-EMA crosses above 21-EMA with volume 1.5x above average. Exit in 3 days max. Tiny 3% profit target.",
    type: "momentum",
    config: {
      name: "Nano Scalper",
      description:
        "Hyper-active short-term scalper. Enters on fast EMA crossovers with volume. Quick 3% takes, 1.5% stops, 3-day max hold.",
      entry: {
        conditions: [
          {
            indicator: "ema",
            period: 9,
            operator: "crosses_above",
            value: 0,
            compare_to: "ema_21",
          },
          {
            indicator: "volume_ratio",
            period: 5,
            operator: ">=",
            value: 1.5,
          },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 3,
        stop_loss_pct: 1.5,
        max_hold_days: 3,
      },
      universe: [
        "AAPL",
        "MSFT",
        "NVDA",
        "AMD",
        "TSLA",
        "META",
        "GOOGL",
        "AMZN",
      ],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 71.3,
    sharpeRatio: 0.38,
    maxDrawdownPct: 22.4,
    winRatePct: 54.8,
    totalTrades: 487,
    avgTradeDuration: 2,
    grade: "F",
    compositeScore: 29.7,
    createdAt: "2024-04-15",
  },
  {
    id: "strat_bollinger_bounce",
    name: "Bollinger Bounce",
    creator: "BandTrader",
    englishPrompt:
      "Buy when price crosses above the lower Bollinger Band and RSI is below 40. Classic mean-reversion bounce setup.",
    type: "mean_reversion",
    config: {
      name: "Bollinger Bounce",
      description:
        "Buy when price bounces off the lower Bollinger Band with RSI confirming oversold conditions. Mean-reversion play on quality stocks.",
      entry: {
        conditions: [
          {
            indicator: "bollinger_lower",
            period: 20,
            operator: "crosses_above",
            value: 0,
          },
          { indicator: "rsi", period: 14, operator: "<=", value: 40 },
        ],
        logic: "AND",
      },
      exit: {
        take_profit_pct: 8,
        stop_loss_pct: 4,
        max_hold_days: 15,
      },
      universe: [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "NVDA",
        "META",
        "TSLA",
        "JPM",
        "V",
      ],
      position_sizing: "equal_weight",
      max_positions: 4,
      max_position_pct: 25,
    },
    returnPct: 289.6,
    sharpeRatio: 1.08,
    maxDrawdownPct: 20.1,
    winRatePct: 57.9,
    totalTrades: 112,
    avgTradeDuration: 9,
    grade: "C",
    compositeScore: 55.6,
    createdAt: "2024-04-20",
  },
];

// Pre-sorted by composite score (descending)
export const SORTED_STRATEGIES = [...MOCK_STRATEGIES].sort(
  (a, b) => b.compositeScore - a.compositeScore
);

export function getStrategyById(id: string): MockStrategy | undefined {
  return MOCK_STRATEGIES.find((s) => s.id === id);
}

export const STRATEGY_TYPE_LABELS: Record<StrategyType, string> = {
  momentum: "Momentum",
  mean_reversion: "Mean Reversion",
  trend_following: "Trend Following",
  breakout: "Breakout",
  value: "Value",
  degen: "Degen",
};
