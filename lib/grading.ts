// ============================================================
// Grading System
// Converts BacktestResult → letter grade + composite score
// ============================================================

import type { BacktestResult } from "./backtester";

export interface Grade {
  letter: string;
  score: number;
  color: string;
}

/**
 * Grade a strategy based on its backtest results.
 *
 * Composite score (0-100) is a weighted blend of:
 *   - Return vs benchmark (40%) — how much did you beat SPY?
 *   - Sharpe ratio (30%) — risk-adjusted performance
 *   - Max drawdown penalty (20%) — how bad was the worst dip?
 *   - Win rate bonus (10%) — what % of trades were profitable?
 *
 * Letter grades:
 *   A+ (90+), A (80-89), B+ (70-79), B (60-69),
 *   C (50-59), D (40-49), F (<40)
 */
export function gradeStrategy(result: BacktestResult): Grade {
  // --- Return vs Benchmark score (0-100, weight: 40%) ---
  // Benchmark (SPY) ~10% annual = ~160% over 10 years
  // Score 50 = matched benchmark, 100 = 3x benchmark, 0 = lost money
  const benchmarkReturn =
    result.equityCurve.length > 0
      ? ((result.equityCurve[result.equityCurve.length - 1].benchmarkValue -
          100_000) /
          100_000) *
        100
      : 0;

  let returnScore: number;
  if (result.totalReturnPct <= 0) {
    // Lost money: 0-20 based on how bad
    returnScore = Math.max(0, 20 + result.totalReturnPct / 5);
  } else if (result.totalReturnPct <= benchmarkReturn) {
    // Positive but below benchmark: 20-50
    returnScore =
      20 +
      30 * (benchmarkReturn > 0 ? result.totalReturnPct / benchmarkReturn : 0);
  } else {
    // Beat benchmark: 50-100
    const excessReturn = result.totalReturnPct - benchmarkReturn;
    const maxExcess = benchmarkReturn * 2; // 3x benchmark = score 100
    returnScore = 50 + 50 * Math.min(1, excessReturn / Math.max(maxExcess, 1));
  }
  returnScore = Math.max(0, Math.min(100, returnScore));

  // --- Sharpe ratio score (0-100, weight: 30%) ---
  // Sharpe 0 = score 0, Sharpe 1 = score 50, Sharpe 2+ = score 100
  let sharpeScore: number;
  if (result.sharpeRatio <= 0) {
    sharpeScore = Math.max(0, 25 + result.sharpeRatio * 25);
  } else {
    sharpeScore = Math.min(100, result.sharpeRatio * 50);
  }

  // --- Max drawdown score (0-100, weight: 20%) ---
  // 0% drawdown = score 100, 50%+ drawdown = score 0
  const drawdownScore = Math.max(0, 100 - result.maxDrawdownPct * 2);

  // --- Win rate score (0-100, weight: 10%) ---
  // 0% = score 0, 50% = score 50, 100% = score 100
  // No trades = score 50 (neutral)
  const winRateScore = result.totalTrades > 0 ? result.winRatePct : 50;

  // --- Composite ---
  const compositeScore =
    returnScore * 0.4 +
    sharpeScore * 0.3 +
    drawdownScore * 0.2 +
    winRateScore * 0.1;

  const clampedScore = Math.max(0, Math.min(100, compositeScore));

  return {
    letter: scoreToLetter(clampedScore),
    score: Math.round(clampedScore * 10) / 10,
    color: scoreToColor(clampedScore),
  };
}

function scoreToLetter(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  return "F";
}

function scoreToColor(score: number): string {
  if (score >= 80) return "#22C55E"; // green (profit color)
  if (score >= 60) return "#EAB308"; // yellow
  if (score >= 40) return "#F97316"; // orange
  return "#EF4444"; // red (loss color)
}
