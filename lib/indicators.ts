// ============================================================
// Technical Indicators
// All functions return arrays same length as input.
// NaN for indices in the warmup period where the indicator
// can't be computed yet.
// ============================================================

/**
 * Simple Moving Average
 * sma[i] = average of prices[i-period+1 .. i]
 */
export function sma(prices: number[], period: number): number[] {
  const result = new Array<number>(prices.length).fill(NaN);
  if (period > prices.length) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < prices.length; i++) {
    sum += prices[i] - prices[i - period];
    result[i] = sum / period;
  }

  return result;
}

/**
 * Exponential Moving Average
 * Uses SMA as the seed value, then applies the EMA formula.
 */
export function ema(prices: number[], period: number): number[] {
  const result = new Array<number>(prices.length).fill(NaN);
  if (period > prices.length) return result;

  const multiplier = 2 / (period + 1);

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  result[period - 1] = sum / period;

  // EMA from period onwards
  for (let i = period; i < prices.length; i++) {
    result[i] = (prices[i] - result[i - 1]) * multiplier + result[i - 1];
  }

  return result;
}

/**
 * Relative Strength Index (Wilder's smoothing method)
 */
export function rsi(prices: number[], period: number): number[] {
  const result = new Array<number>(prices.length).fill(NaN);
  if (prices.length < period + 1) return result;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // First average gain/loss over the initial period
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // RSI at index = period (first computable point)
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  // Subsequent values using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i + 1] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i + 1] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * Returns { line, signal, histogram } arrays.
 */
export function macd(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { line: number[]; signal: number[]; histogram: number[] } {
  const fastEma = ema(prices, fastPeriod);
  const slowEma = ema(prices, slowPeriod);

  // MACD line = fast EMA - slow EMA
  const line = new Array<number>(prices.length).fill(NaN);
  for (let i = 0; i < prices.length; i++) {
    if (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) {
      line[i] = fastEma[i] - slowEma[i];
    }
  }

  // Signal line = EMA of MACD line
  // Find the first valid MACD value to seed the signal EMA
  const validMacdValues: number[] = [];
  const validMacdIndices: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (!isNaN(line[i])) {
      validMacdValues.push(line[i]);
      validMacdIndices.push(i);
    }
  }

  const signal = new Array<number>(prices.length).fill(NaN);
  const histogram = new Array<number>(prices.length).fill(NaN);

  if (validMacdValues.length >= signalPeriod) {
    // Seed signal with SMA of first signalPeriod MACD values
    let seedSum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      seedSum += validMacdValues[i];
    }
    const seedIdx = validMacdIndices[signalPeriod - 1];
    signal[seedIdx] = seedSum / signalPeriod;
    histogram[seedIdx] = line[seedIdx] - signal[seedIdx];

    const mult = 2 / (signalPeriod + 1);
    for (let i = signalPeriod; i < validMacdValues.length; i++) {
      const idx = validMacdIndices[i];
      const prevIdx = validMacdIndices[i - 1];
      signal[idx] =
        (validMacdValues[i] - signal[prevIdx]) * mult + signal[prevIdx];
      histogram[idx] = line[idx] - signal[idx];
    }
  }

  return { line, signal, histogram };
}

/**
 * Bollinger Bands
 * Returns { upper, middle, lower } arrays.
 */
export function bollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(prices, period);
  const upper = new Array<number>(prices.length).fill(NaN);
  const lower = new Array<number>(prices.length).fill(NaN);

  for (let i = period - 1; i < prices.length; i++) {
    // Calculate standard deviation for the window
    let sumSqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = prices[j] - middle[i];
      sumSqDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSqDiff / period);

    upper[i] = middle[i] + stdDevMultiplier * stdDev;
    lower[i] = middle[i] - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

/**
 * Average True Range
 * Uses Wilder's smoothing (same as RMA).
 */
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const result = new Array<number>(highs.length).fill(NaN);
  if (highs.length < period + 1) return result;

  // Calculate True Range
  const tr = new Array<number>(highs.length).fill(0);
  tr[0] = highs[0] - lows[0]; // First day: just high-low

  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hl, hc, lc);
  }

  // First ATR = simple average of first `period` true ranges
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  result[period - 1] = sum / period;

  // Subsequent ATR using Wilder's smoothing
  for (let i = period; i < highs.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + tr[i]) / period;
  }

  return result;
}

/**
 * Volume Ratio: current volume / N-day average volume
 */
export function volumeRatio(volumes: number[], period: number): number[] {
  const result = new Array<number>(volumes.length).fill(NaN);
  if (period >= volumes.length) return result;

  // For each day, compute ratio of current volume to the average of the prior `period` days
  for (let i = period; i < volumes.length; i++) {
    let sum = 0;
    for (let j = i - period; j < i; j++) {
      sum += volumes[j];
    }
    const avg = sum / period;
    result[i] = avg > 0 ? volumes[i] / avg : 0;
  }

  return result;
}

/**
 * Price Change Percentage over N days
 * pct[i] = ((prices[i] - prices[i-period]) / prices[i-period]) * 100
 */
export function priceChangePct(prices: number[], period: number): number[] {
  const result = new Array<number>(prices.length).fill(NaN);

  for (let i = period; i < prices.length; i++) {
    if (prices[i - period] !== 0) {
      result[i] =
        ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
    }
  }

  return result;
}
