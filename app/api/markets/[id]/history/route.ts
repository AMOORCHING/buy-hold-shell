import { NextResponse } from "next/server";
import { getDb, getMarket } from "@/lib/db";
import { getProbabilities } from "@/lib/lmsr";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const marketId = parseInt(id);
    if (isNaN(marketId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const market = getMarket(marketId);
    if (!market) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const db = getDb();
    const b = market.b;

    const trades = db
      .prepare(
        "SELECT outcome_index, shares, created_at FROM trades WHERE market_id = ? ORDER BY created_at ASC, id ASC"
      )
      .all(marketId) as { outcome_index: number; shares: number; created_at: string }[];

    // SQLite CURRENT_TIMESTAMP stores UTC as "YYYY-MM-DD HH:MM:SS" (no timezone marker).
    // Browsers parse that as local time, causing a mismatch with ISO strings from the client.
    // Normalize to proper UTC ISO format so all timestamps are comparable.
    const toUtcIso = (ts: string) =>
      ts.includes("T") ? ts : ts.replace(" ", "T") + "Z";

    const quantities = [0, 0, 0, 0];
    const history: { probabilities: number[]; created_at: string }[] = [
      {
        probabilities: getProbabilities([...quantities], b),
        created_at: toUtcIso(market.created_at),
      },
    ];

    for (const trade of trades) {
      quantities[trade.outcome_index] += trade.shares;
      history.push({
        probabilities: getProbabilities([...quantities], b),
        created_at: toUtcIso(trade.created_at),
      });
    }

    return NextResponse.json({ history });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
