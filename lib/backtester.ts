// ============================================================
// Backtesting Engine
// Runs entirely client-side in the browser.
// Takes a StrategyConfig + stock data → BacktestResult
// ============================================================

import type { StockBar } from "./data";
import type { StrategyConfig, Condition, Indicator } from "./strategy-schema";
import {
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  atr,
  volumeRatio,
  priceChangePct,
} from "./indicators";

// ============================================================
// Result types
// ============================================================

export interface EquityCurvePoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
}

export interface TradeRecord {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPct: number;
  holdDays: number;
  exitReason: string;
}

export interface BacktestResult {
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  avgTradeDuration: number;
  equityCurve: EquityCurvePoint[];
  tradeLog: TradeRecord[];
}

// ============================================================
// Internal types
// ============================================================

interface OpenPosition {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  shares: number;
  daysHeld: number;
}

/** Pre-computed indicator values for one stock, keyed by "indicator_period" */
type IndicatorCache = Record<string, number[]>;

const INITIAL_CAPITAL = 100_000;

// ============================================================
// Indicator computation
// ============================================================

/** Collect all unique indicators needed from conditions */
function collectRequiredIndicators(
  config: StrategyConfig
): { indicator: Indicator; period: number }[] {
  const seen = new Set<string>();
  const result: { indicator: Indicator; period: number }[] = [];

  function addFromConditions(conditions: Condition[]) {
    for (const cond of conditions) {
      const period = cond.period ?? 14;
      const key = `${cond.indicator}_${period}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ indicator: cond.indicator, period });
      }

      // Also parse compare_to if it references another indicator
      if (cond.compare_to && cond.compare_to !== "price") {
        const match = cond.compare_to.match(/^([a-z_]+)_(\d+)$/);
        if (match) {
          const compKey = cond.compare_to;
          if (!seen.has(compKey)) {
            seen.add(compKey);
            result.push({
              indicator: match[1] as Indicator,
              period: parseInt(match[2]),
            });
          }
        }
      }
    }
  }

  addFromConditions(config.entry.conditions);
  if (config.exit.conditions) {
    addFromConditions(config.exit.conditions);
  }

  return result;
}

/** Compute all required indicators for a single stock */
function computeIndicators(
  bars: StockBar[],
  required: { indicator: Indicator; period: number }[]
): IndicatorCache {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const cache: IndicatorCache = {};

  for (const { indicator, period } of required) {
    const key = `${indicator}_${period}`;
    if (cache[key]) continue;

    switch (indicator) {
      case "sma":
        cache[key] = sma(closes, period);
        break;
      case "ema":
        cache[key] = ema(closes, period);
        break;
      case "rsi":
        cache[key] = rsi(closes, period);
        break;
      case "price_change_pct":
        cache[key] = priceChangePct(closes, period);
        break;
      case "volume_ratio":
        cache[key] = volumeRatio(volumes, period);
        break;
      case "atr":
        cache[key] = atr(highs, lows, closes, period);
        break;
      case "bollinger_upper":
      case "bollinger_lower":
      case "bollinger_middle": {
        // Compute all three bands at once, cache each
        const bands = bollingerBands(closes, period);
        cache[`bollinger_upper_${period}`] = bands.upper;
        cache[`bollinger_middle_${period}`] = bands.middle;
        cache[`bollinger_lower_${period}`] = bands.lower;
        break;
      }
      case "macd_line":
      case "macd_signal":
      case "macd_histogram": {
        // MACD uses fixed periods internally, but `period` can customize slow period
        const m = macd(closes, 12, period > 12 ? period : 26, 9);
        cache[`macd_line_${period}`] = m.line;
        cache[`macd_signal_${period}`] = m.signal;
        cache[`macd_histogram_${period}`] = m.histogram;
        break;
      }
    }
  }

  return cache;
}

// ============================================================
// Condition evaluation
// ============================================================

function getIndicatorValue(
  cache: IndicatorCache,
  closes: number[],
  indicator: Indicator,
  period: number,
  dayIndex: number
): number {
  const key = `${indicator}_${period}`;
  const series = cache[key];
  if (!series) return NaN;
  return series[dayIndex];
}

function getCompareToValue(
  cache: IndicatorCache,
  closes: number[],
  compareTo: string,
  dayIndex: number
): number {
  if (compareTo === "price") {
    return closes[dayIndex];
  }
  const series = cache[compareTo];
  if (!series) return NaN;
  return series[dayIndex];
}

/**
 * Evaluate a single condition at a given day index.
 *
 * Semantics:
 * - For >=, <=, >, <:
 *   - With compare_to: indicator_value OP compare_to_value
 *   - Without compare_to: indicator_value OP threshold
 *
 * - For crosses_above / crosses_below:
 *   - With compare_to: indicator crosses above/below compare_to series
 *   - Without compare_to: close price crosses above/below indicator
 */
function evaluateCondition(
  cond: Condition,
  dayIndex: number,
  cache: IndicatorCache,
  closes: number[]
): boolean {
  if (dayIndex < 1) return false;

  const period = cond.period ?? 14;
  const indValue = getIndicatorValue(
    cache,
    closes,
    cond.indicator,
    period,
    dayIndex
  );
  if (isNaN(indValue)) return false;

  const isCrossover =
    cond.operator === "crosses_above" || cond.operator === "crosses_below";

  if (isCrossover) {
    // Get previous indicator value
    const prevIndValue = getIndicatorValue(
      cache,
      closes,
      cond.indicator,
      period,
      dayIndex - 1
    );
    if (isNaN(prevIndValue)) return false;

    if (cond.compare_to) {
      // Indicator crosses above/below another indicator
      const compValue = getCompareToValue(cache, closes, cond.compare_to, dayIndex);
      const prevCompValue = getCompareToValue(
        cache,
        closes,
        cond.compare_to,
        dayIndex - 1
      );
      if (isNaN(compValue) || isNaN(prevCompValue)) return false;

      if (cond.operator === "crosses_above") {
        return indValue > compValue && prevIndValue <= prevCompValue;
      } else {
        return indValue < compValue && prevIndValue >= prevCompValue;
      }
    } else {
      // Close price crosses above/below the indicator
      const price = closes[dayIndex];
      const prevPrice = closes[dayIndex - 1];

      if (cond.operator === "crosses_above") {
        return price > indValue && prevPrice <= prevIndValue;
      } else {
        return price < indValue && prevPrice >= prevIndValue;
      }
    }
  }

  // Standard comparison operators
  let compareValue: number;
  if (cond.compare_to) {
    compareValue = getCompareToValue(cache, closes, cond.compare_to, dayIndex);
    if (isNaN(compareValue)) return false;
  } else {
    compareValue = cond.value;
  }

  switch (cond.operator) {
    case ">=":
      return indValue >= compareValue;
    case "<=":
      return indValue <= compareValue;
    case ">":
      return indValue > compareValue;
    case "<":
      return indValue < compareValue;
    default:
      return false;
  }
}

/** Evaluate all conditions for a condition group (AND/OR logic) */
function evaluateConditions(
  conditions: Condition[],
  logic: "AND" | "OR",
  dayIndex: number,
  cache: IndicatorCache,
  closes: number[]
): boolean {
  if (conditions.length === 0) return false;

  if (logic === "AND") {
    return conditions.every((c) =>
      evaluateCondition(c, dayIndex, cache, closes)
    );
  } else {
    return conditions.some((c) =>
      evaluateCondition(c, dayIndex, cache, closes)
    );
  }
}

// ============================================================
// Main backtest function
// ============================================================

export function backtest(
  config: StrategyConfig,
  stockData: Record<string, StockBar[]>,
  benchmarkData: StockBar[]
): BacktestResult {
  // --- Setup ---
  const requiredIndicators = collectRequiredIndicators(config);

  // Build date→index maps and indicator caches per ticker
  const tickerDateIndex: Record<string, Map<string, number>> = {};
  const tickerIndicators: Record<string, IndicatorCache> = {};
  const tickerCloses: Record<string, number[]> = {};

  for (const ticker of config.universe) {
    const bars = stockData[ticker];
    if (!bars || bars.length === 0) continue;

    const dateMap = new Map<string, number>();
    bars.forEach((b, i) => dateMap.set(b.date, i));
    tickerDateIndex[ticker] = dateMap;
    tickerIndicators[ticker] = computeIndicators(bars, requiredIndicators);
    tickerCloses[ticker] = bars.map((b) => b.close);
  }

  // Benchmark setup
  const benchmarkStart = benchmarkData[0].close;

  // --- Portfolio state ---
  let cash = INITIAL_CAPITAL;
  const openPositions: OpenPosition[] = [];
  const tradeLog: TradeRecord[] = [];
  const equityCurve: EquityCurvePoint[] = [];

  // Track which tickers have an open position (prevent doubling up)
  const positionTickers = new Set<string>();

  // --- Day-by-day simulation ---
  // Iterate through benchmark (SPY) dates as the master timeline
  for (let dayIdx = 0; dayIdx < benchmarkData.length; dayIdx++) {
    const date = benchmarkData[dayIdx].date;

    // --- 1. Update days held for open positions ---
    for (const pos of openPositions) {
      pos.daysHeld++;
    }

    // --- 2. Check exits for open positions ---
    const positionsToClose: number[] = [];

    for (let p = 0; p < openPositions.length; p++) {
      const pos = openPositions[p];
      const dateIdx = tickerDateIndex[pos.ticker]?.get(date);
      if (dateIdx === undefined) continue;

      const currentPrice = stockData[pos.ticker][dateIdx].close;
      const pnlPct =
        ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      let exitReason = "";

      // Take profit
      if (
        config.exit.take_profit_pct !== undefined &&
        pnlPct >= config.exit.take_profit_pct
      ) {
        exitReason = "take_profit";
      }

      // Stop loss
      if (
        !exitReason &&
        config.exit.stop_loss_pct !== undefined &&
        pnlPct <= -config.exit.stop_loss_pct
      ) {
        exitReason = "stop_loss";
      }

      // Max hold days
      if (
        !exitReason &&
        config.exit.max_hold_days !== undefined &&
        pos.daysHeld >= config.exit.max_hold_days
      ) {
        exitReason = "max_hold_days";
      }

      // Custom exit conditions
      if (
        !exitReason &&
        config.exit.conditions &&
        config.exit.conditions.length > 0
      ) {
        const cache = tickerIndicators[pos.ticker];
        const closes = tickerCloses[pos.ticker];
        if (cache && closes) {
          const exitTriggered = evaluateConditions(
            config.exit.conditions,
            "OR", // Any exit condition triggers a sell
            dateIdx,
            cache,
            closes
          );
          if (exitTriggered) {
            exitReason = "exit_condition";
          }
        }
      }

      if (exitReason) {
        tradeLog.push({
          ticker: pos.ticker,
          entryDate: pos.entryDate,
          entryPrice: pos.entryPrice,
          exitDate: date,
          exitPrice: currentPrice,
          returnPct: pnlPct,
          holdDays: pos.daysHeld,
          exitReason,
        });

        cash += pos.shares * currentPrice;
        positionTickers.delete(pos.ticker);
        positionsToClose.push(p);
      }
    }

    // Remove closed positions (iterate backwards to preserve indices)
    for (let i = positionsToClose.length - 1; i >= 0; i--) {
      openPositions.splice(positionsToClose[i], 1);
    }

    // --- 3. Check entries for new positions ---
    if (openPositions.length < config.max_positions) {
      for (const ticker of config.universe) {
        if (positionTickers.has(ticker)) continue;
        if (openPositions.length >= config.max_positions) break;

        const dateIdx = tickerDateIndex[ticker]?.get(date);
        if (dateIdx === undefined) continue;

        const cache = tickerIndicators[ticker];
        const closes = tickerCloses[ticker];
        if (!cache || !closes) continue;

        const entryTriggered = evaluateConditions(
          config.entry.conditions,
          config.entry.logic,
          dateIdx,
          cache,
          closes
        );

        if (entryTriggered) {
          // Calculate position size
          const portfolioValue =
            cash +
            openPositions.reduce((sum, pos) => {
              const idx = tickerDateIndex[pos.ticker]?.get(date);
              if (idx === undefined) return sum;
              return sum + pos.shares * stockData[pos.ticker][idx].close;
            }, 0);

          const maxAllocation =
            portfolioValue * (config.max_position_pct / 100);
          const positionValue = Math.min(maxAllocation, cash);

          if (positionValue < 1) continue; // Skip if we can't afford anything

          const entryPrice = stockData[ticker][dateIdx].close;
          const shares = Math.floor(positionValue / entryPrice);
          if (shares < 1) continue;

          cash -= shares * entryPrice;
          openPositions.push({
            ticker,
            entryDate: date,
            entryPrice,
            shares,
            daysHeld: 0,
          });
          positionTickers.add(ticker);
        }
      }
    }

    // --- 4. Record equity curve ---
    const positionsValue = openPositions.reduce((sum, pos) => {
      const idx = tickerDateIndex[pos.ticker]?.get(date);
      if (idx === undefined) return sum + pos.shares * pos.entryPrice;
      return sum + pos.shares * stockData[pos.ticker][idx].close;
    }, 0);

    const portfolioValue = cash + positionsValue;
    const benchmarkValue =
      INITIAL_CAPITAL * (benchmarkData[dayIdx].close / benchmarkStart);

    equityCurve.push({
      date,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      benchmarkValue: Math.round(benchmarkValue * 100) / 100,
    });
  }

  // --- 5. Force-close any remaining open positions at last day's price ---
  const lastDate = benchmarkData[benchmarkData.length - 1].date;
  for (const pos of openPositions) {
    const dateIdx = tickerDateIndex[pos.ticker]?.get(lastDate);
    const exitPrice =
      dateIdx !== undefined
        ? stockData[pos.ticker][dateIdx].close
        : pos.entryPrice;
    const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;

    tradeLog.push({
      ticker: pos.ticker,
      entryDate: pos.entryDate,
      entryPrice: pos.entryPrice,
      exitDate: lastDate,
      exitPrice,
      returnPct: pnlPct,
      holdDays: pos.daysHeld,
      exitReason: "end_of_backtest",
    });
  }

  // --- 6. Compute metrics ---
  const finalValue = equityCurve[equityCurve.length - 1].portfolioValue;
  const totalReturnPct =
    ((finalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;

  // Annualized return
  const tradingDays = equityCurve.length;
  const years = tradingDays / 252;
  const annualizedReturnPct =
    years > 0
      ? (Math.pow(finalValue / INITIAL_CAPITAL, 1 / years) - 1) * 100
      : 0;

  // Sharpe ratio (annualized, using daily returns)
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].portfolioValue;
    const curr = equityCurve[i].portfolioValue;
    if (prev > 0) {
      dailyReturns.push((curr - prev) / prev);
    }
  }
  const avgReturn =
    dailyReturns.length > 0
      ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      : 0;
  const stdReturn =
    dailyReturns.length > 1
      ? Math.sqrt(
          dailyReturns.reduce(
            (sum, r) => sum + (r - avgReturn) ** 2,
            0
          ) /
            (dailyReturns.length - 1)
        )
      : 0;
  const sharpeRatio =
    stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  // Max drawdown
  let peak = INITIAL_CAPITAL;
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    if (point.portfolioValue > peak) {
      peak = point.portfolioValue;
    }
    const drawdown = ((peak - point.portfolioValue) / peak) * 100;
    if (drawdown > maxDrawdownPct) {
      maxDrawdownPct = drawdown;
    }
  }

  // Win rate
  const winningTrades = tradeLog.filter((t) => t.returnPct > 0).length;
  const winRatePct =
    tradeLog.length > 0 ? (winningTrades / tradeLog.length) * 100 : 0;

  // Average trade duration
  const avgTradeDuration =
    tradeLog.length > 0
      ? tradeLog.reduce((sum, t) => sum + t.holdDays, 0) / tradeLog.length
      : 0;

  return {
    totalReturnPct: Math.round(totalReturnPct * 100) / 100,
    annualizedReturnPct: Math.round(annualizedReturnPct * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
    winRatePct: Math.round(winRatePct * 100) / 100,
    totalTrades: tradeLog.length,
    avgTradeDuration: Math.round(avgTradeDuration * 10) / 10,
    equityCurve,
    tradeLog: tradeLog.map((t) => ({
      ...t,
      entryPrice: Math.round(t.entryPrice * 100) / 100,
      exitPrice: Math.round(t.exitPrice * 100) / 100,
      returnPct: Math.round(t.returnPct * 100) / 100,
    })),
  };
}
