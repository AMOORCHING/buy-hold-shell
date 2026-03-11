import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarket, getUserPositions, getRecentTrades, getDb } from "@/lib/db";
import { getProbabilities } from "@/lib/lmsr";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const marketId = parseInt(id);
  if (isNaN(marketId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const market = getMarket(marketId);
  if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quantities = JSON.parse(market.quantities) as number[];
  const probabilities = getProbabilities(quantities, market.b);

  const session = await getServerSession(authOptions);
  let userPositions: { outcome_index: number; shares: number }[] = [];
  if (session?.user?.id) {
    userPositions = getUserPositions(session.user.id, marketId).map((p) => ({
      outcome_index: p.outcome_index,
      shares: p.shares,
    }));
  }

  const recentTrades = getRecentTrades(marketId, 20);

  const totalVolume = (
    getDb()
      .prepare("SELECT COALESCE(SUM(ABS(cost)), 0) as vol FROM trades WHERE market_id = ? AND cost > 0")
      .get(marketId) as { vol: number }
  ).vol;

  return NextResponse.json({
    ...market,
    outcomes: JSON.parse(market.outcomes),
    quantities,
    probabilities,
    userPositions,
    recentTrades,
    totalVolume,
  });
}
