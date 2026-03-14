import { NextRequest, NextResponse } from "next/server";
import { validateStrategy } from "@/lib/strategy-schema";

/**
 * Deploy a strategy to the leaderboard.
 * Accepts strategy config + backtest results, saves to Supabase.
 * NOTE: Supabase integration will be added in Phase 7.
 * For now, validates the payload and returns a mock response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, results } = body;

    if (!strategy) {
      return NextResponse.json(
        { error: "Missing 'strategy' field" },
        { status: 400 }
      );
    }

    // Validate strategy config
    const errors = validateStrategy(strategy);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid strategy", details: errors },
        { status: 400 }
      );
    }

    if (!results || typeof results.totalReturnPct !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid 'results' field" },
        { status: 400 }
      );
    }

    // TODO Phase 7: Save to Supabase
    // For now, return a mock success response
    const mockId = `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      id: mockId,
      message: "Strategy deployed to leaderboard",
    });
  } catch (err) {
    console.error("Deploy API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
