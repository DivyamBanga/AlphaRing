/** Types for OHLCV stock data */
export interface StockBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  sector: string;
}

/** In-memory cache to avoid re-fetching */
const stockCache: Record<string, StockBar[]> = {};
let tickerListCache: TickerInfo[] | null = null;

/**
 * Lazy-load OHLCV data for a single ticker.
 * Fetches from /data/stocks/{TICKER}.json and caches in memory.
 */
export async function loadStockData(ticker: string): Promise<StockBar[]> {
  const symbol = ticker.toUpperCase();

  if (stockCache[symbol]) {
    return stockCache[symbol];
  }

  const response = await fetch(`/data/stocks/${symbol}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load data for ${symbol}: ${response.status}`);
  }

  const data: StockBar[] = await response.json();
  stockCache[symbol] = data;
  return data;
}

/**
 * Load data for multiple tickers in parallel.
 */
export async function loadMultipleStocks(
  tickers: string[]
): Promise<Record<string, StockBar[]>> {
  const results: Record<string, StockBar[]> = {};
  const promises = tickers.map(async (ticker) => {
    results[ticker.toUpperCase()] = await loadStockData(ticker);
  });
  await Promise.all(promises);
  return results;
}

/**
 * Load the SPY benchmark data.
 */
export async function loadBenchmark(): Promise<StockBar[]> {
  return loadStockData("SPY");
}

/**
 * Load the list of available tickers with metadata.
 */
export async function loadTickerList(): Promise<TickerInfo[]> {
  if (tickerListCache) {
    return tickerListCache;
  }

  const response = await fetch("/data/tickers.json");
  if (!response.ok) {
    throw new Error(`Failed to load ticker list: ${response.status}`);
  }

  tickerListCache = await response.json();
  return tickerListCache!;
}

/**
 * Get all available ticker symbols.
 */
export async function getAvailableTickers(): Promise<string[]> {
  const tickers = await loadTickerList();
  return tickers.map((t) => t.symbol);
}
