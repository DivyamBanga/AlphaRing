"""
Download 10 years of daily OHLCV data for the top 50 US stocks + SPY benchmark.
Outputs individual JSON files per ticker into public/data/stocks/.
Run once: python scripts/download-data.py
"""

import json
import os
import sys
from datetime import datetime, timedelta

try:
    import yfinance as yf
except ImportError:
    print("Installing yfinance...")
    os.system(f"{sys.executable} -m pip install yfinance")
    import yfinance as yf

# Top 50 most traded US stocks + SPY benchmark
TICKERS = [
    # Mega-cap tech
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    # Tech / Semiconductor
    "AMD", "INTC", "AVGO", "CRM", "ADBE", "ORCL", "NFLX", "QCOM",
    # Finance
    "JPM", "BAC", "WFC", "GS", "MS", "V", "MA",
    # Healthcare
    "JNJ", "UNH", "PFE", "ABBV", "MRK", "LLY",
    # Consumer
    "WMT", "HD", "KO", "PEP", "MCD", "NKE", "SBUX", "DIS",
    # Industrial / Energy
    "XOM", "CVX", "BA", "CAT", "GE", "UPS",
    # Other high-volume
    "PYPL", "SQ", "SHOP", "UBER", "COIN", "SNAP", "PLTR", "SOFI",
    # Benchmark
    "SPY",
]

# Ticker metadata for tickers.json
TICKER_META = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Technology"},
    "META": {"name": "Meta Platforms Inc.", "sector": "Technology"},
    "TSLA": {"name": "Tesla Inc.", "sector": "Consumer Cyclical"},
    "AMD": {"name": "Advanced Micro Devices", "sector": "Technology"},
    "INTC": {"name": "Intel Corp.", "sector": "Technology"},
    "AVGO": {"name": "Broadcom Inc.", "sector": "Technology"},
    "CRM": {"name": "Salesforce Inc.", "sector": "Technology"},
    "ADBE": {"name": "Adobe Inc.", "sector": "Technology"},
    "ORCL": {"name": "Oracle Corp.", "sector": "Technology"},
    "NFLX": {"name": "Netflix Inc.", "sector": "Technology"},
    "QCOM": {"name": "Qualcomm Inc.", "sector": "Technology"},
    "JPM": {"name": "JPMorgan Chase & Co.", "sector": "Financial"},
    "BAC": {"name": "Bank of America Corp.", "sector": "Financial"},
    "WFC": {"name": "Wells Fargo & Co.", "sector": "Financial"},
    "GS": {"name": "Goldman Sachs Group", "sector": "Financial"},
    "MS": {"name": "Morgan Stanley", "sector": "Financial"},
    "V": {"name": "Visa Inc.", "sector": "Financial"},
    "MA": {"name": "Mastercard Inc.", "sector": "Financial"},
    "JNJ": {"name": "Johnson & Johnson", "sector": "Healthcare"},
    "UNH": {"name": "UnitedHealth Group", "sector": "Healthcare"},
    "PFE": {"name": "Pfizer Inc.", "sector": "Healthcare"},
    "ABBV": {"name": "AbbVie Inc.", "sector": "Healthcare"},
    "MRK": {"name": "Merck & Co.", "sector": "Healthcare"},
    "LLY": {"name": "Eli Lilly & Co.", "sector": "Healthcare"},
    "WMT": {"name": "Walmart Inc.", "sector": "Consumer Defensive"},
    "HD": {"name": "Home Depot Inc.", "sector": "Consumer Cyclical"},
    "KO": {"name": "Coca-Cola Co.", "sector": "Consumer Defensive"},
    "PEP": {"name": "PepsiCo Inc.", "sector": "Consumer Defensive"},
    "MCD": {"name": "McDonald's Corp.", "sector": "Consumer Cyclical"},
    "NKE": {"name": "Nike Inc.", "sector": "Consumer Cyclical"},
    "SBUX": {"name": "Starbucks Corp.", "sector": "Consumer Cyclical"},
    "DIS": {"name": "Walt Disney Co.", "sector": "Communication Services"},
    "XOM": {"name": "Exxon Mobil Corp.", "sector": "Energy"},
    "CVX": {"name": "Chevron Corp.", "sector": "Energy"},
    "BA": {"name": "Boeing Co.", "sector": "Industrials"},
    "CAT": {"name": "Caterpillar Inc.", "sector": "Industrials"},
    "GE": {"name": "General Electric Co.", "sector": "Industrials"},
    "UPS": {"name": "United Parcel Service", "sector": "Industrials"},
    "PYPL": {"name": "PayPal Holdings", "sector": "Financial"},
    "SQ": {"name": "Block Inc.", "sector": "Financial"},
    "SHOP": {"name": "Shopify Inc.", "sector": "Technology"},
    "UBER": {"name": "Uber Technologies", "sector": "Technology"},
    "COIN": {"name": "Coinbase Global", "sector": "Financial"},
    "SNAP": {"name": "Snap Inc.", "sector": "Technology"},
    "PLTR": {"name": "Palantir Technologies", "sector": "Technology"},
    "SOFI": {"name": "SoFi Technologies", "sector": "Financial"},
    "SPY": {"name": "S&P 500 ETF", "sector": "Index"},
}

def download_stock_data(ticker: str, start: str, end: str) -> list:
    """Download OHLCV data for a single ticker, return as list of dicts."""
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(start=start, end=end, auto_adjust=True)

        if df.empty:
            print(f"  WARNING: No data for {ticker}")
            return []

        records = []
        for date, row in df.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"]),
            })

        return records
    except Exception as e:
        print(f"  ERROR downloading {ticker}: {e}")
        return []


def main():
    # Calculate date range: 10 years back from today
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365 * 10)).strftime("%Y-%m-%d")

    # Output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, "public", "data", "stocks")
    os.makedirs(output_dir, exist_ok=True)

    print(f"Downloading {len(TICKERS)} tickers from {start_date} to {end_date}")
    print(f"Output: {output_dir}\n")

    total_size = 0
    successful = []
    failed = []

    for i, ticker in enumerate(TICKERS):
        print(f"[{i+1}/{len(TICKERS)}] Downloading {ticker}...", end=" ")
        records = download_stock_data(ticker, start_date, end_date)

        if records:
            filepath = os.path.join(output_dir, f"{ticker}.json")
            with open(filepath, "w") as f:
                json.dump(records, f, separators=(",", ":"))

            file_size = os.path.getsize(filepath)
            total_size += file_size
            successful.append(ticker)
            print(f"OK ({len(records)} days, {file_size/1024:.1f} KB)")
        else:
            failed.append(ticker)
            print("FAILED")

    # Write tickers.json manifest (only include successful tickers, exclude SPY)
    tickers_manifest = []
    for ticker in successful:
        if ticker == "SPY":
            continue
        meta = TICKER_META.get(ticker, {"name": ticker, "sector": "Unknown"})
        tickers_manifest.append({
            "symbol": ticker,
            "name": meta["name"],
            "sector": meta["sector"],
        })

    manifest_path = os.path.join(project_root, "public", "data", "tickers.json")
    with open(manifest_path, "w") as f:
        json.dump(tickers_manifest, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Done! {len(successful)} tickers downloaded, {len(failed)} failed")
    print(f"Total size: {total_size/1024/1024:.2f} MB")
    if failed:
        print(f"Failed tickers: {', '.join(failed)}")
    print(f"Tickers manifest: {manifest_path}")


if __name__ == "__main__":
    main()
