import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { getDb, getMarket } from "@/lib/db";
import { getProbabilities } from "@/lib/lmsr";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { marketId, outcomeIndex } = await req.json();
  if (typeof marketId !== "number" || typeof outcomeIndex !== "number") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const market = getMarket(marketId);
  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status === "resolved") {
    return NextResponse.json({ error: "Market already resolved" }, { status: 400 });
  }

  const db = getDb();
  const resolveTx = db.transaction(() => {
    // Get all positions for winning outcome
    const winningPositions = db
      .prepare(
        "SELECT p.*, u.name as user_name FROM positions p JOIN users u ON p.user_id = u.id WHERE p.market_id = ? AND p.outcome_index = ? AND p.shares > 0"
      )
      .all(marketId, outcomeIndex) as {
      user_id: string;
      shares: number;
      user_name: string;
    }[];

    const payouts: { userId: string; userName: string; shares: number; payout: number }[] = [];
    let totalPayout = 0;

    for (const pos of winningPositions) {
      const payout = Math.round(pos.shares * 100) / 100; // $1 per share
      payouts.push({
        userId: pos.user_id,
        userName: pos.user_name,
        shares: pos.shares,
        payout,
      });
      totalPayout += payout;

      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(payout, pos.user_id);
      db.prepare("INSERT INTO ledger (user_id, amount, note, admin_id) VALUES (?, ?, ?, ?)").run(
        pos.user_id,
        payout,
        `Payout: Market #${marketId} resolved to outcome ${outcomeIndex}`,
        session.user.id
      );
    }

    db.prepare(
      "UPDATE markets SET status = 'resolved', resolved_outcome = ? WHERE id = ?"
    ).run(outcomeIndex, marketId);

    const quantities = JSON.parse(market.quantities) as number[];
    const probabilities = getProbabilities(quantities, market.b);

    return { payouts, totalPayout, probabilities };
  });

  try {
    const result = resolveTx();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resolution failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
