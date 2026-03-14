// ============================================================
// Code Renderer
// Converts StrategyConfig JSON → Python-like pseudocode
// This is purely visual theater for the "wow moment".
// The code is NOT executed — it's a deterministic template
// filled with values from the JSON config.
// ============================================================

import type { StrategyConfig, Condition } from "./strategy-schema";

function toClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function indicatorToReadable(indicator: string): string {
  const map: Record<string, string> = {
    price_change_pct: "PriceChange",
    sma: "SMA",
    ema: "EMA",
    rsi: "RSI",
    volume_ratio: "VolumeRatio",
    bollinger_upper: "BollingerBands.upper",
    bollinger_lower: "BollingerBands.lower",
    bollinger_middle: "BollingerBands.middle",
    macd_line: "MACD.line",
    macd_signal: "MACD.signal",
    macd_histogram: "MACD.histogram",
    atr: "ATR",
  };
  return map[indicator] || indicator;
}

function indicatorToInit(indicator: string, period: number): string {
  const readable = indicatorToReadable(indicator);
  if (readable.includes(".")) {
    const [parent] = readable.split(".");
    return `${parent}(period=${period})`;
  }
  return `${readable}(period=${period})`;
}

function operatorToSymbol(op: string): string {
  const map: Record<string, string> = {
    ">=": ">=",
    "<=": "<=",
    ">": ">",
    "<": "<",
    crosses_above: "crosses above",
    crosses_below: "crosses below",
  };
  return map[op] || op;
}

function conditionToCode(cond: Condition, varName: string): string {
  const period = cond.period ?? 14;
  const readable = indicatorToReadable(cond.indicator);
  const accessor = readable.includes(".")
    ? `self.${readable.split(".")[0].toLowerCase()}_${period}.${readable.split(".")[1]}`
    : `self.${readable.toLowerCase()}_${period}`;

  if (cond.operator === "crosses_above" || cond.operator === "crosses_below") {
    const direction = cond.operator === "crosses_above" ? "above" : "below";
    if (cond.compare_to) {
      if (cond.compare_to === "price") {
        return `${accessor}[${varName}] crosses ${direction} price[${varName}]`;
      }
      return `${accessor}[${varName}] crosses ${direction} self.${cond.compare_to}[${varName}]`;
    }
    return `price[${varName}] crosses ${direction} ${accessor}[${varName}]`;
  }

  const op = operatorToSymbol(cond.operator);
  if (cond.compare_to) {
    if (cond.compare_to === "price") {
      return `${accessor}[${varName}] ${op} price[${varName}]`;
    }
    return `${accessor}[${varName}] ${op} self.${cond.compare_to}[${varName}]`;
  }
  return `${accessor}[${varName}] ${op} ${cond.value}`;
}

function conditionsToComment(conditions: Condition[], logic: string): string {
  return conditions
    .map((c) => {
      const period = c.period ?? 14;
      const ind = indicatorToReadable(c.indicator);
      const op = operatorToSymbol(c.operator);
      if (c.compare_to) {
        return `${ind}(${period}) ${op} ${c.compare_to}`;
      }
      return `${ind}(${period}) ${op} ${c.value}`;
    })
    .join(` ${logic} `);
}

/**
 * Render a StrategyConfig as Python-like pseudocode.
 * Returns an array of lines for streaming animation.
 */
export function renderStrategyCode(config: StrategyConfig): string[] {
  const className = toClassName(config.name);
  const lines: string[] = [];

  // Imports
  lines.push("import backtrader as bt");
  lines.push("import numpy as np");
  lines.push("from alpha_ring import indicators, portfolio");
  lines.push("");

  // Class definition
  lines.push("");
  lines.push(`class ${className}(bt.Strategy):`);
  lines.push(`    """${config.description}"""`);
  lines.push("");

  // Parameters
  lines.push("    # ── Trading Universe ──────────────────────────");
  lines.push(`    universe = [${config.universe.map((t) => `"${t}"`).join(", ")}]`);
  lines.push("");

  // Position sizing
  lines.push("    # ── Position Sizing ──────────────────────────");
  lines.push(`    sizing = "${config.position_sizing}"`);
  lines.push(`    max_positions = ${config.max_positions}`);
  lines.push(`    max_position_pct = ${config.max_position_pct}  # % of portfolio`);
  lines.push("");

  // Init method - indicators
  lines.push("    def __init__(self):");
  lines.push("        # Initialize technical indicators");

  const seenInits = new Set<string>();
  const allConditions = [
    ...config.entry.conditions,
    ...(config.exit.conditions || []),
  ];

  for (const cond of allConditions) {
    const period = cond.period ?? 14;
    const initStr = indicatorToInit(cond.indicator, period);
    const varName = indicatorToReadable(cond.indicator).includes(".")
      ? `${indicatorToReadable(cond.indicator).split(".")[0].toLowerCase()}_${period}`
      : `${indicatorToReadable(cond.indicator).toLowerCase()}_${period}`;

    if (!seenInits.has(varName)) {
      seenInits.add(varName);
      lines.push(`        self.${varName} = indicators.${initStr}`);
    }

    // Handle compare_to indicator
    if (cond.compare_to && cond.compare_to !== "price") {
      const compKey = cond.compare_to;
      if (!seenInits.has(compKey)) {
        seenInits.add(compKey);
        const match = compKey.match(/^([a-z_]+)_(\d+)$/);
        if (match) {
          const compReadable = indicatorToReadable(match[1]);
          lines.push(
            `        self.${compKey} = indicators.${compReadable}(period=${match[2]})`
          );
        }
      }
    }
  }

  // Exit parameters
  lines.push("");
  lines.push("        # Exit parameters");
  if (config.exit.take_profit_pct !== undefined) {
    lines.push(
      `        self.take_profit = ${(config.exit.take_profit_pct / 100).toFixed(2)}  # ${config.exit.take_profit_pct}%`
    );
  }
  if (config.exit.stop_loss_pct !== undefined) {
    lines.push(
      `        self.stop_loss = ${(config.exit.stop_loss_pct / 100).toFixed(2)}   # ${config.exit.stop_loss_pct}%`
    );
  }
  if (config.exit.max_hold_days !== undefined) {
    lines.push(
      `        self.max_hold = ${config.exit.max_hold_days}       # trading days`
    );
  }
  lines.push("");

  // Next method - trading logic
  lines.push("    def next(self):");
  lines.push(`        # Evaluate ${config.universe.length} stocks each trading day`);
  lines.push("        for stock in self.universe:");
  lines.push("");

  // Entry conditions
  const entryComment = conditionsToComment(
    config.entry.conditions,
    config.entry.logic
  );
  lines.push(`            # ── Entry: ${entryComment}`);

  if (config.entry.conditions.length === 1) {
    const cond = conditionToCode(config.entry.conditions[0], "stock");
    lines.push(`            if ${cond}:`);
  } else {
    const joiner = config.entry.logic === "AND" ? "\n                    and " : "\n                    or ";
    const condStrs = config.entry.conditions.map((c) =>
      conditionToCode(c, "stock")
    );
    lines.push(`            if (${condStrs.join(joiner)}):`);
  }

  lines.push("                if self.open_positions < self.max_positions:");
  lines.push("                    size = self.calculate_position_size(stock)");
  lines.push("                    self.buy(stock, size=size)");
  lines.push("");

  // Exit conditions
  lines.push("            # ── Exit Logic ──");
  lines.push("            if self.holding(stock):");
  lines.push("                pnl = self.unrealized_pnl_pct(stock)");

  if (config.exit.take_profit_pct !== undefined) {
    lines.push(
      `                if pnl >= ${config.exit.take_profit_pct}:${" ".repeat(Math.max(1, 8 - String(config.exit.take_profit_pct).length))}# Take profit`
    );
    lines.push("                    self.sell(stock, reason='take_profit')");
  }

  if (config.exit.stop_loss_pct !== undefined) {
    lines.push(
      `                elif pnl <= -${config.exit.stop_loss_pct}:${" ".repeat(Math.max(1, 7 - String(config.exit.stop_loss_pct).length))}# Stop loss`
    );
    lines.push("                    self.sell(stock, reason='stop_loss')");
  }

  if (config.exit.max_hold_days !== undefined) {
    const prefix =
      config.exit.take_profit_pct !== undefined ||
      config.exit.stop_loss_pct !== undefined
        ? "elif"
        : "if";
    lines.push(
      `                ${prefix} self.days_held(stock) >= ${config.exit.max_hold_days}:`
    );
    lines.push("                    self.sell(stock, reason='max_hold_days')");
  }

  if (config.exit.conditions && config.exit.conditions.length > 0) {
    const prefix =
      config.exit.take_profit_pct !== undefined ||
      config.exit.stop_loss_pct !== undefined ||
      config.exit.max_hold_days !== undefined
        ? "elif"
        : "if";

    for (const exitCond of config.exit.conditions) {
      const exitCode = conditionToCode(exitCond, "stock");
      lines.push(`                ${prefix} ${exitCode}:`);
      lines.push("                    self.sell(stock, reason='indicator_exit')");
    }
  }

  lines.push("");

  // Backtest execution
  lines.push("");
  lines.push("# ── Execute Backtest ─────────────────────────────");
  lines.push(`engine = bt.BacktestEngine(data_range="10Y")`);
  lines.push(`engine.add_strategy(${className})`);
  lines.push(`results = engine.run()`);
  lines.push(`results.plot(benchmark="SPY")`);

  return lines;
}

/**
 * Render as a single string (for non-animated display).
 */
export function renderStrategyCodeString(config: StrategyConfig): string {
  return renderStrategyCode(config).join("\n");
}
