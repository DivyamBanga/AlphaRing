import { NextRequest, NextResponse } from "next/server";
import { validateStrategy } from "@/lib/strategy-schema";
import { isSupabaseConfigured, createServerClient } from "@/lib/supabase-server";

/**
 * Deploy a strategy to the leaderboard.
 * Saves to Supabase if configured, otherwise returns mock success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, result: results, englishPrompt } = body;

    if (!strategy) {
      return NextResponse.json(
        { error: "Missing 'strategy' field" },
        { status: 400 }
      );
    }

    const errors = validateStrategy(strategy);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid strategy", details: errors },
        { status: 400 }
      );
    }

    if (!results || typeof results.totalReturnPct !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid 'result' field" },
        { status: 400 }
      );
    }

    // ── Supabase: save to database ─────────────────────
    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required. Please sign in to deploy." },
          { status: 401 }
        );
      }

      const { data, error: dbError } = await supabase
        .from("strategies")
        .insert({
          user_id: user.id,
          name: strategy.name,
          english_prompt:
            englishPrompt || strategy.description || "",
          json_config: strategy,
          return_pct: results.totalReturnPct,
          sharpe_ratio: results.sharpeRatio,
          max_drawdown_pct: results.maxDrawdownPct,
          win_rate_pct: results.winRatePct,
          total_trades: results.totalTrades,
          avg_trade_duration: results.avgTradeDuration || 0,
          grade: results.grade,
          composite_score: results.compositeScore,
          equity_curve: results.equityCurve || [],
          trade_log: results.tradeLog || [],
          strategy_type: results.strategyType || "momentum",
          is_active: true,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        return NextResponse.json(
          { error: "Failed to save strategy" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        id: data.id,
        message: "Strategy deployed to leaderboard",
      });
    }

    // ── Fallback: mock response ────────────────────────
    const mockId = `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return NextResponse.json({
      success: true,
      id: mockId,
      message: "Strategy deployed to leaderboard (demo mode)",
    });
  } catch (err) {
    console.error("Deploy API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
