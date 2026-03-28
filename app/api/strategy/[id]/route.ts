import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createServerClient } from "@/lib/supabase-server";
import {
  getStrategyById,
  generateEquityCurve,
  generateTradeLog,
} from "@/lib/mock-strategies";

/**
 * Get full details for a single strategy.
 * Uses Supabase if configured, otherwise falls back to mock data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Supabase path ──────────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) throw error || new Error("Not found");

      return NextResponse.json({
        id: data.id,
        name: data.name,
        creator: data.user_name || "Anonymous",
        creatorAvatar: null,
        englishPrompt: data.english_prompt,
        type: data.strategy_type,
        config: data.json_config,
        returnPct: data.return_pct,
        sharpeRatio: data.sharpe_ratio,
        maxDrawdownPct: data.max_drawdown_pct,
        winRatePct: data.win_rate_pct,
        totalTrades: data.total_trades,
        avgTradeDuration: data.avg_trade_duration,
        grade: data.grade,
        compositeScore: data.composite_score,
        createdAt: data.created_at,
        equityCurve: data.equity_curve,
        tradeLog: data.trade_log,
        isActive: data.is_active,
        userId: data.user_id,
      });
    } catch {
      // If it's a UUID format (Supabase), don't fall through to mock
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        );
      if (isUuid) {
        return NextResponse.json(
          { error: "Strategy not found" },
          { status: 404 }
        );
      }
      // Non-UUID id → fall through to mock data
    }
  }

  // ── Mock data fallback ─────────────────────────────
  const strategy = getStrategyById(id);

  if (!strategy) {
    return NextResponse.json(
      { error: "Strategy not found" },
      { status: 404 }
    );
  }

  const seed = Array.from(strategy.id).reduce(
    (acc, c) => acc + c.charCodeAt(0),
    0
  );
  const equityCurve = generateEquityCurve(
    strategy.returnPct,
    strategy.returnPct > 300 ? 0.04 : 0.03,
    seed
  );
  const tradeLog = generateTradeLog(
    strategy.config.universe,
    strategy.totalTrades,
    strategy.winRatePct,
    seed + 1
  );

  return NextResponse.json({
    ...strategy,
    equityCurve,
    tradeLog,
  });
}
