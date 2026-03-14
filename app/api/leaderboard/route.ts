import { NextRequest, NextResponse } from "next/server";

/**
 * Query the leaderboard.
 * NOTE: Supabase integration will be added in Phase 7.
 * For now, returns mock data from pre-seeded strategies.
 */

const MOCK_LEADERBOARD = [
  {
    id: "1",
    rank: 1,
    name: "Bollinger Breakout",
    creator: "AlphaRing",
    returnPct: 739.7,
    sharpeRatio: 1.58,
    maxDrawdownPct: 16.74,
    winRatePct: 59.56,
    grade: "B+",
    compositeScore: 79.0,
  },
  {
    id: "2",
    rank: 2,
    name: "Golden Cross Rider",
    creator: "AlphaRing",
    returnPct: 390.22,
    sharpeRatio: 0.93,
    maxDrawdownPct: 32.8,
    winRatePct: 57.69,
    grade: "C",
    compositeScore: 50.3,
  },
  {
    id: "3",
    rank: 3,
    name: "Boomer Portfolio",
    creator: "AlphaRing",
    returnPct: 229.56,
    sharpeRatio: 0.9,
    maxDrawdownPct: 23.5,
    winRatePct: 60.31,
    grade: "D",
    compositeScore: 47.8,
  },
  {
    id: "4",
    rank: 4,
    name: "Momentum Dip Buyer",
    creator: "AlphaRing",
    returnPct: 115.21,
    sharpeRatio: 0.59,
    maxDrawdownPct: 25.98,
    winRatePct: 50.79,
    grade: "F",
    compositeScore: 36.4,
  },
  {
    id: "5",
    rank: 5,
    name: "Mean Reversion Nerd",
    creator: "AlphaRing",
    returnPct: 50.05,
    sharpeRatio: 0.36,
    maxDrawdownPct: 33.11,
    winRatePct: 49.72,
    grade: "F",
    compositeScore: 27.2,
  },
  {
    id: "6",
    rank: 6,
    name: "WSB Degen",
    creator: "AlphaRing",
    returnPct: 46.32,
    sharpeRatio: 0.28,
    maxDrawdownPct: 72.13,
    winRatePct: 49.56,
    grade: "F",
    compositeScore: 19.1,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sortBy = searchParams.get("sortBy") || "compositeScore";
  const search = searchParams.get("search")?.toLowerCase();

  // TODO Phase 7: Query Supabase instead
  let results = [...MOCK_LEADERBOARD];

  // Search filter
  if (search) {
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.creator.toLowerCase().includes(search)
    );
  }

  // Sort
  const sortKey = sortBy as keyof (typeof MOCK_LEADERBOARD)[0];
  if (sortKey in results[0]) {
    results.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal;
      }
      return 0;
    });
  }

  // Paginate
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  return NextResponse.json({
    strategies: paged,
    total: results.length,
    page,
    limit,
  });
}
