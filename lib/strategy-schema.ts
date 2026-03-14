// ============================================================
// Strategy JSON Schema — the single source of truth.
// The LLM outputs this. The backtester consumes this.
// Everything flows from this schema.
// ============================================================

/** All indicators the backtesting engine supports */
export const SUPPORTED_INDICATORS = [
  "price_change_pct",
  "sma",
  "ema",
  "rsi",
  "volume_ratio",
  "bollinger_upper",
  "bollinger_lower",
  "bollinger_middle",
  "macd_line",
  "macd_signal",
  "macd_histogram",
  "atr",
] as const;

export type Indicator = (typeof SUPPORTED_INDICATORS)[number];

/** Supported comparison operators */
export const SUPPORTED_OPERATORS = [
  ">=",
  "<=",
  ">",
  "<",
  "crosses_above",
  "crosses_below",
] as const;

export type Operator = (typeof SUPPORTED_OPERATORS)[number];

/** Position sizing methods */
export type PositionSizing = "equal_weight" | "risk_parity";

/** A single entry or exit condition */
export interface Condition {
  /** Which indicator to evaluate */
  indicator: Indicator;
  /** Lookback period in days (e.g., 14 for RSI-14, 20 for SMA-20) */
  period?: number;
  /** How to compare the indicator value */
  operator: Operator;
  /** The threshold value to compare against */
  value: number;
  /** For crossover conditions: compare indicator to another indicator (e.g., "sma_50") */
  compare_to?: string;
}

/** The complete strategy configuration */
export interface StrategyConfig {
  /** Human-readable strategy name */
  name: string;
  /** Brief description of what the strategy does */
  description: string;
  /** Entry rules: when to buy */
  entry: {
    conditions: Condition[];
    logic: "AND" | "OR";
  };
  /** Exit rules: when to sell */
  exit: {
    /** Sell when position is up this % */
    take_profit_pct?: number;
    /** Sell when position is down this % */
    stop_loss_pct?: number;
    /** Sell after holding this many trading days */
    max_hold_days?: number;
    /** Additional indicator-based exit conditions */
    conditions?: Condition[];
  };
  /** Which ticker symbols to trade */
  universe: string[];
  /** How to size positions */
  position_sizing: PositionSizing;
  /** Maximum number of simultaneous open positions */
  max_positions: number;
  /** Maximum % of portfolio allocated to a single position */
  max_position_pct: number;
}

// ============================================================
// Validation
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

/** List of ticker symbols we have data for */
const AVAILABLE_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  "AMD", "INTC", "AVGO", "CRM", "ADBE", "ORCL", "NFLX", "QCOM",
  "JPM", "BAC", "WFC", "GS", "MS", "V", "MA",
  "JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY",
  "WMT", "HD", "KO", "PEP", "MCD", "NKE", "SBUX", "DIS",
  "XOM", "CVX", "BA", "CAT", "GE", "UPS",
  "PYPL", "SHOP", "UBER", "COIN", "SNAP", "PLTR", "SOFI",
];

function validateCondition(
  condition: Condition,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!SUPPORTED_INDICATORS.includes(condition.indicator)) {
    errors.push({
      field: `${path}.indicator`,
      message: `Unsupported indicator "${condition.indicator}". Supported: ${SUPPORTED_INDICATORS.join(", ")}`,
    });
  }

  if (!SUPPORTED_OPERATORS.includes(condition.operator)) {
    errors.push({
      field: `${path}.operator`,
      message: `Unsupported operator "${condition.operator}". Supported: ${SUPPORTED_OPERATORS.join(", ")}`,
    });
  }

  // Indicators that require a period
  const needsPeriod: Indicator[] = [
    "sma", "ema", "rsi", "volume_ratio",
    "bollinger_upper", "bollinger_lower", "bollinger_middle",
    "macd_line", "macd_signal", "macd_histogram",
    "atr", "price_change_pct",
  ];

  if (
    needsPeriod.includes(condition.indicator) &&
    (condition.period === undefined || condition.period < 1)
  ) {
    errors.push({
      field: `${path}.period`,
      message: `Indicator "${condition.indicator}" requires a period >= 1`,
    });
  }

  if (condition.period !== undefined && condition.period > 252) {
    errors.push({
      field: `${path}.period`,
      message: `Period ${condition.period} is too large (max 252 trading days = ~1 year)`,
    });
  }

  if (typeof condition.value !== "number" || isNaN(condition.value)) {
    errors.push({
      field: `${path}.value`,
      message: "Value must be a valid number",
    });
  }

  return errors;
}

/**
 * Validate a strategy configuration.
 * Returns an array of errors. Empty array = valid.
 */
export function validateStrategy(config: StrategyConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name
  if (!config.name || config.name.trim().length === 0) {
    errors.push({ field: "name", message: "Strategy name is required" });
  }
  if (config.name && config.name.length > 100) {
    errors.push({ field: "name", message: "Strategy name must be 100 characters or less" });
  }

  // Description
  if (!config.description || config.description.trim().length === 0) {
    errors.push({ field: "description", message: "Strategy description is required" });
  }

  // Entry conditions
  if (!config.entry || !config.entry.conditions || config.entry.conditions.length === 0) {
    errors.push({ field: "entry.conditions", message: "At least one entry condition is required" });
  } else {
    config.entry.conditions.forEach((cond, i) => {
      errors.push(...validateCondition(cond, `entry.conditions[${i}]`));
    });
  }

  if (config.entry && !["AND", "OR"].includes(config.entry.logic)) {
    errors.push({ field: "entry.logic", message: 'Entry logic must be "AND" or "OR"' });
  }

  // Exit conditions
  if (config.exit) {
    if (
      config.exit.take_profit_pct !== undefined &&
      (config.exit.take_profit_pct <= 0 || config.exit.take_profit_pct > 1000)
    ) {
      errors.push({
        field: "exit.take_profit_pct",
        message: "Take profit must be between 0 and 1000%",
      });
    }

    if (
      config.exit.stop_loss_pct !== undefined &&
      (config.exit.stop_loss_pct <= 0 || config.exit.stop_loss_pct > 100)
    ) {
      errors.push({
        field: "exit.stop_loss_pct",
        message: "Stop loss must be between 0 and 100%",
      });
    }

    if (
      config.exit.max_hold_days !== undefined &&
      (config.exit.max_hold_days < 1 || config.exit.max_hold_days > 2520)
    ) {
      errors.push({
        field: "exit.max_hold_days",
        message: "Max hold days must be between 1 and 2520 (~10 years)",
      });
    }

    if (config.exit.conditions) {
      config.exit.conditions.forEach((cond, i) => {
        errors.push(...validateCondition(cond, `exit.conditions[${i}]`));
      });
    }
  }

  // Universe
  if (!config.universe || config.universe.length === 0) {
    errors.push({ field: "universe", message: "At least one ticker is required" });
  } else {
    const invalidTickers = config.universe.filter(
      (t) => !AVAILABLE_TICKERS.includes(t.toUpperCase())
    );
    if (invalidTickers.length > 0) {
      errors.push({
        field: "universe",
        message: `Unknown tickers: ${invalidTickers.join(", ")}. Available: ${AVAILABLE_TICKERS.join(", ")}`,
      });
    }
  }

  // Position sizing
  if (!["equal_weight", "risk_parity"].includes(config.position_sizing)) {
    errors.push({
      field: "position_sizing",
      message: 'Position sizing must be "equal_weight" or "risk_parity"',
    });
  }

  // Max positions
  if (
    config.max_positions === undefined ||
    config.max_positions < 1 ||
    config.max_positions > 50
  ) {
    errors.push({
      field: "max_positions",
      message: "Max positions must be between 1 and 50",
    });
  }

  // Max position %
  if (
    config.max_position_pct === undefined ||
    config.max_position_pct <= 0 ||
    config.max_position_pct > 100
  ) {
    errors.push({
      field: "max_position_pct",
      message: "Max position % must be between 0 and 100",
    });
  }

  return errors;
}

// ============================================================
// Example Strategy Configs (test fixtures)
// ============================================================

/** Momentum dip buyer: buy tech stocks on dips, sell on recovery */
export const EXAMPLE_MOMENTUM_DIP: StrategyConfig = {
  name: "Momentum Dip Buyer",
  description:
    "Buy large-cap tech stocks when they dip 5% over 5 days with above-average volume, sell at 8% profit or 4% stop loss.",
  entry: {
    conditions: [
      { indicator: "price_change_pct", period: 5, operator: "<=", value: -5 },
      { indicator: "volume_ratio", period: 20, operator: ">=", value: 1.2 },
    ],
    logic: "AND",
  },
  exit: {
    take_profit_pct: 8,
    stop_loss_pct: 4,
    max_hold_days: 10,
  },
  universe: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"],
  position_sizing: "equal_weight",
  max_positions: 3,
  max_position_pct: 25,
};

/** RSI mean reversion: buy oversold, sell overbought */
export const EXAMPLE_MEAN_REVERSION: StrategyConfig = {
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
      { indicator: "rsi", period: 14, operator: ">=", value: 70 },
    ],
  },
  universe: ["AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "BAC", "JNJ", "PFE", "XOM"],
  position_sizing: "equal_weight",
  max_positions: 5,
  max_position_pct: 20,
};

/** Golden cross trend follower: SMA 50 crosses above SMA 200 */
export const EXAMPLE_TREND_FOLLOWING: StrategyConfig = {
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
  universe: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "MA"],
  position_sizing: "equal_weight",
  max_positions: 5,
  max_position_pct: 20,
};

/** Bollinger Band breakout: buy when price breaks above upper band */
export const EXAMPLE_BREAKOUT: StrategyConfig = {
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
      { indicator: "volume_ratio", period: 20, operator: ">=", value: 1.5 },
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
};

/** Conservative blue-chip buyer: buy below 200-day SMA */
export const EXAMPLE_DIP_BUYING: StrategyConfig = {
  name: "Boomer Portfolio",
  description:
    "Buy blue-chip stocks when they're trading below their 200-day moving average. Hold until 15% profit or 60 days max. Conservative 7% stop loss.",
  entry: {
    conditions: [
      { indicator: "sma", period: 200, operator: ">=", value: 0, compare_to: "price" },
      { indicator: "rsi", period: 14, operator: "<=", value: 45 },
    ],
    logic: "AND",
  },
  exit: {
    take_profit_pct: 15,
    stop_loss_pct: 7,
    max_hold_days: 60,
  },
  universe: ["JNJ", "KO", "PEP", "WMT", "JPM", "V", "MA", "MCD", "HD", "UNH"],
  position_sizing: "equal_weight",
  max_positions: 5,
  max_position_pct: 20,
};

/** WSB degen: YOLO into biggest losers */
export const EXAMPLE_DEGEN: StrategyConfig = {
  name: "WSB Degen",
  description:
    "YOLO into whatever dropped the most over 3 days. Diamond hands for 3 trading days, then dump it. No stop loss. Full send.",
  entry: {
    conditions: [
      { indicator: "price_change_pct", period: 3, operator: "<=", value: -8 },
    ],
    logic: "AND",
  },
  exit: {
    max_hold_days: 3,
  },
  universe: ["TSLA", "AMD", "NVDA", "COIN", "SNAP", "PLTR", "SOFI", "UBER"],
  position_sizing: "equal_weight",
  max_positions: 2,
  max_position_pct: 50,
};

/** All example strategies in one array */
export const EXAMPLE_STRATEGIES: StrategyConfig[] = [
  EXAMPLE_MOMENTUM_DIP,
  EXAMPLE_MEAN_REVERSION,
  EXAMPLE_TREND_FOLLOWING,
  EXAMPLE_BREAKOUT,
  EXAMPLE_DIP_BUYING,
  EXAMPLE_DEGEN,
];
