import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getMarket, getUserPositions } from "@/lib/db";
import { sharesToBuy, revenueToSell, getProbabilities, costToBuy } from "@/lib/lmsr";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const marketId = parseInt(id);
  if (isNaN(marketId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const { outcomeIndex, action } = body;

  if (typeof outcomeIndex !== "number" || outcomeIndex < 0 || outcomeIndex > 3) {
    return NextResponse.json({ error: "Invalid outcomeIndex" }, { status: 400 });
  }

  const market = getMarket(marketId);
  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "open") {
    return NextResponse.json({ error: "Market is not open for trading" }, { status: 400 });
  }
  if (market.closes_at && new Date() > new Date(market.closes_at)) {
    return NextResponse.json({ error: "Market has closed for trading" }, { status: 400 });
  }

  const db = getDb();

  const tradeTransaction = db.transaction(() => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.user.id) as {
      id: string;
      balance: number;
      total_deposited: number;
    };
    if (!user) throw new Error("User not found");

    const quantities = JSON.parse(market.quantities) as number[];

    if (action === "buy") {
      const { dollarAmount } = body;
      if (typeof dollarAmount !== "number") throw new Error("Invalid dollarAmount");
      if (dollarAmount < 1.0) throw new Error("Minimum bet is $1.00");
      if (dollarAmount > 5.0) throw new Error("Maximum bet is $5.00");

      const roundedAmount = Math.round(dollarAmount * 100) / 100;
      if (user.balance < roundedAmount) throw new Error("Insufficient balance");

      const shares = sharesToBuy(quantities, outcomeIndex, roundedAmount, market.b);
      const actualCost = Math.round(costToBuy(quantities, outcomeIndex, shares, market.b) * 100) / 100;

      // Update quantities
      quantities[outcomeIndex] += shares;
      db.prepare("UPDATE markets SET quantities = ? WHERE id = ?").run(
        JSON.stringify(quantities),
        marketId
      );

      // Deduct from balance
      const newBalance = Math.round((user.balance - roundedAmount) * 100) / 100;
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, user.id);

      // Update position
      db.prepare(`
        INSERT INTO positions (user_id, market_id, outcome_index, shares)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, market_id, outcome_index)
        DO UPDATE SET shares = shares + excluded.shares
      `).run(user.id, marketId, outcomeIndex, shares);

      // Log trade
      db.prepare(
        "INSERT INTO trades (user_id, market_id, outcome_index, shares, cost) VALUES (?, ?, ?, ?, ?)"
      ).run(user.id, marketId, outcomeIndex, shares, roundedAmount);

      const newProbs = getProbabilities(quantities, market.b);
      const newPositions = getUserPositions(user.id, marketId);

      return {
        success: true,
        action: "buy",
        shares: Math.round(shares * 1000) / 1000,
        cost: roundedAmount,
        actualCost,
        newBalance,
        probabilities: newProbs,
        quantities,
        userPositions: newPositions,
      };
    } else if (action === "sell") {
      const { shares: sharesToSell } = body;
      if (typeof sharesToSell !== "number" || sharesToSell <= 0) {
        throw new Error("Invalid shares amount");
      }

      // Check user has enough shares
      const position = db
        .prepare(
          "SELECT shares FROM positions WHERE user_id = ? AND market_id = ? AND outcome_index = ?"
        )
        .get(user.id, marketId, outcomeIndex) as { shares: number } | undefined;

      if (!position || position.shares < sharesToSell) {
        throw new Error("Insufficient shares");
      }

      const revenue = revenueToSell(quantities, outcomeIndex, sharesToSell, market.b);
      const roundedRevenue = Math.round(revenue * 100) / 100;

      // Update quantities
      quantities[outcomeIndex] -= sharesToSell;
      db.prepare("UPDATE markets SET quantities = ? WHERE id = ?").run(
        JSON.stringify(quantities),
        marketId
      );

      // Credit balance
      const newBalance = Math.round((user.balance + roundedRevenue) * 100) / 100;
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, user.id);

      // Update position
      const newShares = position.shares - sharesToSell;
      if (newShares < 0.001) {
        db.prepare(
          "DELETE FROM positions WHERE user_id = ? AND market_id = ? AND outcome_index = ?"
        ).run(user.id, marketId, outcomeIndex);
      } else {
        db.prepare(
          "UPDATE positions SET shares = ? WHERE user_id = ? AND market_id = ? AND outcome_index = ?"
        ).run(newShares, user.id, marketId, outcomeIndex);
      }

      // Log trade (negative = sell)
      db.prepare(
        "INSERT INTO trades (user_id, market_id, outcome_index, shares, cost) VALUES (?, ?, ?, ?, ?)"
      ).run(user.id, marketId, outcomeIndex, -sharesToSell, -roundedRevenue);

      const newProbs = getProbabilities(quantities, market.b);
      const newPositions = getUserPositions(user.id, marketId);

      return {
        success: true,
        action: "sell",
        shares: sharesToSell,
        revenue: roundedRevenue,
        newBalance,
        probabilities: newProbs,
        quantities,
        userPositions: newPositions,
      };
    } else {
      throw new Error("Invalid action");
    }
  });

  try {
    const result = tradeTransaction();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trade failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
