import { NextRequest, NextResponse } from "next/server";
import {
  SORTED_STRATEGIES,
  STRATEGY_TYPE_LABELS,
  type StrategyType,
} from "@/lib/mock-strategies";

/**
 * Query the leaderboard.
 * NOTE: Supabase integration will be added in Phase 7.
 * For now, returns data from pre-seeded mock strategies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sortBy = searchParams.get("sortBy") || "compositeScore";
  const sortDir = searchParams.get("sortDir") || "desc";
  const search = searchParams.get("search")?.toLowerCase();
  const typeFilter = searchParams.get("type") as StrategyType | null;

  let results = [...SORTED_STRATEGIES];

  // Search filter
  if (search) {
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.creator.toLowerCase().includes(search)
    );
  }

  // Type filter
  if (typeFilter && typeFilter in STRATEGY_TYPE_LABELS) {
    results = results.filter((s) => s.type === typeFilter);
  }

  // Sort
  type SortKey =
    | "compositeScore"
    | "returnPct"
    | "sharpeRatio"
    | "maxDrawdownPct"
    | "winRatePct"
    | "name";

  const validSortKeys: SortKey[] = [
    "compositeScore",
    "returnPct",
    "sharpeRatio",
    "maxDrawdownPct",
    "winRatePct",
    "name",
  ];

  const sortKey = validSortKeys.includes(sortBy as SortKey)
    ? (sortBy as SortKey)
    : "compositeScore";

  results.sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return 0;
  });

  // Paginate
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  // Return leaderboard-level fields (no equity curves or trade logs)
  const strategies = paged.map((s, i) => ({
    id: s.id,
    rank: start + i + 1,
    name: s.name,
    creator: s.creator,
    type: s.type,
    returnPct: s.returnPct,
    sharpeRatio: s.sharpeRatio,
    maxDrawdownPct: s.maxDrawdownPct,
    winRatePct: s.winRatePct,
    totalTrades: s.totalTrades,
    grade: s.grade,
    compositeScore: s.compositeScore,
  }));

  return NextResponse.json({
    strategies,
    total: results.length,
    page,
    limit,
  });
}
