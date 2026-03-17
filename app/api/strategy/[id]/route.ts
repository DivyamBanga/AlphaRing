import { NextRequest, NextResponse } from "next/server";
import {
  getStrategyById,
  generateEquityCurve,
  generateTradeLog,
} from "@/lib/mock-strategies";

/**
 * Get full details for a single strategy.
 * NOTE: Supabase integration will be added in Phase 7.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const strategy = getStrategyById(id);

  if (!strategy) {
    return NextResponse.json(
      { error: "Strategy not found" },
      { status: 404 }
    );
  }

  // Generate equity curve and trade log on demand (deterministic)
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
