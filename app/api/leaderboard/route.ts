import { NextResponse } from "next/server";
import { getAllUsers, getDb } from "@/lib/db";
import { revenueToSell, getProbabilities } from "@/lib/lmsr";

export async function GET() {
  const db = getDb();
  const users = getAllUsers();

  // Get the first (and only) market
  const market = db.prepare("SELECT * FROM markets ORDER BY id ASC LIMIT 1").get() as
    | { id: number; quantities: string; b: number }
    | undefined;

  const quantities = market ? (JSON.parse(market.quantities) as number[]) : [0, 0, 0, 0];
  const b = market?.b ?? 50;
  const probs = getProbabilities(quantities, b);

  const leaderboard = users.map((user) => {
    let positionValue = 0;
    let totalShares = 0;

    if (market) {
      const positions = db
        .prepare(
          "SELECT outcome_index, shares FROM positions WHERE user_id = ? AND market_id = ?"
        )
        .all(user.id, market.id) as { outcome_index: number; shares: number }[];

      for (const pos of positions) {
        if (pos.shares > 0) {
          const sellRevenue = revenueToSell(quantities, pos.outcome_index, pos.shares, b);
          positionValue += sellRevenue;
          totalShares += pos.shares;
        }
      }
    }

    const portfolioValue = Math.round((user.balance + positionValue) * 100) / 100;
    const pnl = Math.round((portfolioValue - user.total_deposited) * 100) / 100;
    const pnlPct =
      user.total_deposited > 0
        ? Math.round((pnl / user.total_deposited) * 10000) / 100
        : 0;

    const tradeCount = (
      db
        .prepare(
          "SELECT COUNT(*) as cnt FROM trades WHERE user_id = ? AND (market_id = ? OR 1=1)"
        )
        .get(user.id) as { cnt: number }
    ).cnt;

    return {
      id: user.id,
      name: user.name,
      image: user.image,
      balance: user.balance,
      totalDeposited: user.total_deposited,
      positionValue: Math.round(positionValue * 100) / 100,
      portfolioValue,
      pnl,
      pnlPct,
      tradeCount,
    };
  });

  leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);

  return NextResponse.json({ leaderboard, probabilities: probs });
}
