import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createServerClient } from "@/lib/supabase-server";
import {
  SORTED_STRATEGIES,
  STRATEGY_TYPE_LABELS,
  type StrategyType,
} from "@/lib/mock-strategies";

/**
 * Query the leaderboard.
 * Uses Supabase if configured, otherwise falls back to mock data.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sortBy = searchParams.get("sortBy") || "compositeScore";
  const sortDir = searchParams.get("sortDir") || "desc";
  const search = searchParams.get("search")?.toLowerCase();
  const typeFilter = searchParams.get("type") as StrategyType | null;

  // ── Supabase path ──────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();

      // Map client sort keys to DB column names
      const sortMap: Record<string, string> = {
        compositeScore: "composite_score",
        returnPct: "return_pct",
        sharpeRatio: "sharpe_ratio",
        maxDrawdownPct: "max_drawdown_pct",
        winRatePct: "win_rate_pct",
        name: "name",
      };
      const dbSortCol = sortMap[sortBy] || "composite_score";
      const ascending = sortDir === "asc";

      let query = supabase
        .from("leaderboard")
        .select("*", { count: "exact" });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,creator.ilike.%${search}%`
        );
      }

      if (typeFilter && typeFilter in STRATEGY_TYPE_LABELS) {
        query = query.eq("strategy_type", typeFilter);
      }

      const start = (page - 1) * limit;
      const { data, count, error } = await query
        .order(dbSortCol, { ascending })
        .range(start, start + limit - 1);

      if (error) throw error;

      const strategies = (data || []).map((s, i) => ({
        id: s.id,
        rank: start + i + 1,
        name: s.name,
        creator: s.creator || "Anonymous",
        type: s.strategy_type as StrategyType,
        returnPct: s.return_pct,
        sharpeRatio: s.sharpe_ratio,
        maxDrawdownPct: s.max_drawdown_pct,
        winRatePct: s.win_rate_pct,
        totalTrades: s.total_trades,
        grade: s.grade,
        compositeScore: s.composite_score,
      }));

      return NextResponse.json({
        strategies,
        total: count || 0,
        page,
        limit,
      });
    } catch (err) {
      console.error("Supabase leaderboard error:", err);
      // Fall through to mock data
    }
  }

  // ── Mock data fallback ─────────────────────────────
  let results = [...SORTED_STRATEGIES];

  if (search) {
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.creator.toLowerCase().includes(search)
    );
  }

  if (typeFilter && typeFilter in STRATEGY_TYPE_LABELS) {
    results = results.filter((s) => s.type === typeFilter);
  }

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

  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

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
